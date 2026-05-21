import * as admin from 'firebase-admin';
import {
  DEFAULT_REMINDER_LEAD_TIME,
  LEAD_TIME_MS,
  MAX_LEAD_TIME_MS,
  type ReminderLeadTime,
} from './constants';
import { sendReminderEmail } from './email';
import { formatDateForDisplay, resolveStartAtUtc } from './timezoneUtils';

type EventDoc = {
  teamId: string;
  name: string;
  date: string;
  startTime: string;
  timeZone?: string;
  startAtUtc?: string;
  lengthMinutes?: number;
  location?: string;
  tournamentId?: string;
  refereeUserIds?: string[];
};

type RefereeTournamentDoc = {
  userId: string;
  tournamentId: string;
  isActive?: boolean;
  emailNotificationsEnabled?: boolean;
  reminderLeadTime?: ReminderLeadTime;
};

type TaskDoc = {
  teamId: string;
  name: string;
  date: string;
  startTime: string;
  timeZone?: string;
  startAtUtc?: string;
  location?: string;
  signedUpUserIds?: string[];
};

type UserTeamDoc = {
  userId: string;
  teamId: string;
  inviteAccepted?: boolean;
  emailNotificationsEnabled?: boolean;
  reminderLeadTime?: ReminderLeadTime;
};

type UserProfileDoc = {
  email?: string;
  firstName?: string;
};

function resolveLeadTime(data: {
  reminderLeadTime?: ReminderLeadTime;
}): ReminderLeadTime {
  const value = data.reminderLeadTime;
  if (value && value in LEAD_TIME_MS) {
    return value;
  }
  return DEFAULT_REMINDER_LEAD_TIME;
}

function deliveryId(
  userId: string,
  entityType: 'event' | 'task',
  entityId: string,
  leadTime: ReminderLeadTime
): string {
  return `${userId}_${entityType}_${entityId}_${leadTime}`;
}

/** Canonical UTC instant for dedupe keys (paired event docs may store slightly different ISO strings). */
function normalizeStartAtUtcKey(startAtUtc: string): string {
  const ms = new Date(startAtUtc).getTime();
  if (Number.isNaN(ms)) return startAtUtc;
  return new Date(ms).toISOString();
}

function refereeDeliveryId(
  userId: string,
  tournamentId: string,
  startAtUtc: string,
  leadTime: ReminderLeadTime
): string {
  const utcKey = normalizeStartAtUtcKey(startAtUtc);
  return `${userId}_referee_event_${tournamentId}_${utcKey}_${leadTime}`;
}

/** Same grouping as tournament schedule: one reminder per matchup, not per team event row. */
function tournamentGameGroupKey(event: EventDoc): string | null {
  if (!event.tournamentId) return null;
  const startAtUtc = resolveStartAtUtc(event);
  const utcKey = normalizeStartAtUtcKey(startAtUtc);
  const lengthMinutes = event.lengthMinutes ?? 60;
  return `${event.tournamentId}|${utcKey}|${event.location ?? ''}|${lengthMinutes}`;
}

function buildTournamentGameGroups(events: EventDoc[]): Map<string, EventDoc[]> {
  const groups = new Map<string, EventDoc[]>();
  for (const event of events) {
    const key = tournamentGameGroupKey(event);
    if (!key || !(event.refereeUserIds?.length)) continue;
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return groups;
}

function isInReminderWindow(start: Date, leadTime: ReminderLeadTime, now: Date): boolean {
  const leadMs = LEAD_TIME_MS[leadTime];
  const reminderAt = new Date(start.getTime() - leadMs);
  return reminderAt <= now && now < start;
}

async function getUserTeamMembership(
  db: admin.firestore.Firestore,
  userId: string,
  teamId: string
): Promise<(UserTeamDoc & { id: string }) | null> {
  const snap = await db
    .collection('userTeams')
    .where('userId', '==', userId)
    .where('teamId', '==', teamId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as UserTeamDoc) };
}

async function getRefereeTournamentMembership(
  db: admin.firestore.Firestore,
  userId: string,
  tournamentId: string
): Promise<(RefereeTournamentDoc & { id: string }) | null> {
  const snap = await db
    .collection('refereeTournaments')
    .where('userId', '==', userId)
    .where('tournamentId', '==', tournamentId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as RefereeTournamentDoc) };
}

async function isTaskSignedUp(
  db: admin.firestore.Firestore,
  taskId: string,
  userId: string
): Promise<boolean> {
  const taskSnap = await db.collection('tasks').doc(taskId).get();
  if (!taskSnap.exists) return false;
  const ids = (taskSnap.data() as TaskDoc).signedUpUserIds ?? [];
  return ids.includes(userId);
}

async function trySendReminder(params: {
  db: admin.firestore.Firestore;
  userId: string;
  teamId: string;
  entityType: 'event' | 'task';
  entityId: string;
  itemName: string;
  schedule: EventDoc | TaskDoc;
  location: string;
  now: Date;
}): Promise<boolean> {
  const { db, userId, teamId, entityType, entityId, now, schedule } = params;

  const membership = await getUserTeamMembership(db, userId, teamId);
  if (!membership || membership.inviteAccepted === false) return false;
  if (membership.emailNotificationsEnabled === false) return false;

  const leadTime = resolveLeadTime(membership);
  const startAtUtc = resolveStartAtUtc(schedule);
  const start = new Date(startAtUtc);
  if (!isInReminderWindow(start, leadTime, now)) return false;

  const dedupeRef = db.collection('reminderDeliveries').doc(
    deliveryId(userId, entityType, entityId, leadTime)
  );
  const existing = await dedupeRef.get();
  if (existing.exists) return false;

  if (entityType === 'task') {
    if (!(await isTaskSignedUp(db, entityId, userId))) return false;
  }

  const profileSnap = await db.collection('userProfiles').doc(userId).get();
  if (!profileSnap.exists) return false;
  const profile = profileSnap.data() as UserProfileDoc;
  const recipientEmail = profile.email?.trim();
  if (!recipientEmail) return false;

  const teamSnap = await db.collection('teams').doc(teamId).get();
  const teamName = teamSnap.exists
    ? String((teamSnap.data() as { teamName?: string }).teamName ?? 'Your team')
    : 'Your team';

  await sendReminderEmail({
    kind: entityType,
    recipientEmail,
    firstName: String(profile.firstName ?? 'there'),
    teamName,
    itemName: params.itemName,
    whenDisplay: formatDateForDisplay(startAtUtc),
    location: params.location,
  });

  await dedupeRef.set({
    userId,
    teamId,
    entityType,
    entityId,
    leadTime,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    recipientEmail,
  });

  return true;
}

async function trySendRefereeReminder(params: {
  db: admin.firestore.Firestore;
  userId: string;
  tournamentId: string;
  itemName: string;
  schedule: EventDoc;
  location: string;
  now: Date;
}): Promise<boolean> {
  const { db, userId, tournamentId, now, schedule } = params;

  const membership = await getRefereeTournamentMembership(db, userId, tournamentId);
  if (!membership || membership.isActive === false) return false;
  if (membership.emailNotificationsEnabled === false) return false;

  const leadTime = resolveLeadTime(membership);
  const startAtUtc = resolveStartAtUtc(schedule);
  const start = new Date(startAtUtc);
  if (!isInReminderWindow(start, leadTime, now)) return false;

  const dedupeRef = db
    .collection('reminderDeliveries')
    .doc(refereeDeliveryId(userId, tournamentId, startAtUtc, leadTime));
  const existing = await dedupeRef.get();
  if (existing.exists) return false;

  const profileSnap = await db.collection('userProfiles').doc(userId).get();
  if (!profileSnap.exists) return false;
  const profile = profileSnap.data() as UserProfileDoc;
  const recipientEmail = profile.email?.trim();
  if (!recipientEmail) return false;

  const tournamentSnap = await db.collection('tournaments').doc(tournamentId).get();
  const tournamentName = tournamentSnap.exists
    ? String((tournamentSnap.data() as { name?: string }).name ?? 'Tournament')
    : 'Tournament';

  await sendReminderEmail({
    kind: 'referee_game',
    recipientEmail,
    firstName: String(profile.firstName ?? 'there'),
    teamName: tournamentName,
    itemName: params.itemName,
    whenDisplay: formatDateForDisplay(startAtUtc),
    location: params.location,
  });

  await dedupeRef.set({
    userId,
    teamId: schedule.teamId,
    entityType: 'referee_event',
    entityId: tournamentId,
    leadTime,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    recipientEmail,
    tournamentId,
    startAtUtc,
  });

  return true;
}

async function processRefereeAssignmentsFromEvents(
  db: admin.firestore.Firestore,
  events: EventDoc[],
  now: Date
): Promise<number> {
  let sent = 0;
  const gameGroups = buildTournamentGameGroups(events);

  for (const groupEvents of gameGroups.values()) {
    const representative = groupEvents[0];
    const tournamentId = representative.tournamentId;
    if (!tournamentId) continue;

    const refereeUserIds = [
      ...new Set(groupEvents.flatMap((e) => e.refereeUserIds ?? [])),
    ];
    if (refereeUserIds.length === 0) continue;

    for (const userId of refereeUserIds) {
      const didSend = await trySendRefereeReminder({
        db,
        userId,
        tournamentId,
        itemName: representative.name,
        schedule: representative,
        location: representative.location ?? '',
        now,
      });
      if (didSend) sent += 1;
    }
  }

  return sent;
}

async function processRefereeAssignments(db: admin.firestore.Firestore, now: Date): Promise<number> {
  const nowIso = now.toISOString();
  const maxIso = new Date(now.getTime() + MAX_LEAD_TIME_MS + 24 * 60 * 60 * 1000).toISOString();

  const eventsSnap = await db
    .collection('events')
    .where('startAtUtc', '>=', nowIso)
    .where('startAtUtc', '<=', maxIso)
    .get();

  const events = eventsSnap.docs.map((d) => d.data() as EventDoc);
  return processRefereeAssignmentsFromEvents(db, events, now);
}

async function processLegacyRefereeAssignmentsWithoutUtc(
  db: admin.firestore.Firestore,
  now: Date
): Promise<number> {
  const today = now.toISOString().slice(0, 10);
  const maxDate = new Date(now.getTime() + MAX_LEAD_TIME_MS + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const eventsSnap = await db
    .collection('events')
    .where('date', '>=', today)
    .where('date', '<=', maxDate)
    .get();

  const legacyEvents = eventsSnap.docs
    .map((d) => d.data() as EventDoc)
    .filter((event) => !event.startAtUtc);

  return processRefereeAssignmentsFromEvents(db, legacyEvents, now);
}

async function processEvents(db: admin.firestore.Firestore, now: Date): Promise<number> {
  const nowIso = now.toISOString();
  const maxIso = new Date(now.getTime() + MAX_LEAD_TIME_MS + 24 * 60 * 60 * 1000).toISOString();

  const eventsSnap = await db
    .collection('events')
    .where('startAtUtc', '>=', nowIso)
    .where('startAtUtc', '<=', maxIso)
    .get();

  let sent = 0;

  for (const eventDoc of eventsSnap.docs) {
    const event = eventDoc.data() as EventDoc;
    const eventId = eventDoc.id;

    const membersSnap = await db
      .collection('userTeams')
      .where('teamId', '==', event.teamId)
      .get();

    for (const memberDoc of membersSnap.docs) {
      const userId = String(memberDoc.data().userId);

      const didSend = await trySendReminder({
        db,
        userId,
        teamId: event.teamId,
        entityType: 'event',
        entityId: eventId,
        itemName: event.name,
        schedule: event,
        location: event.location ?? '',
        now,
      });
      if (didSend) sent += 1;
    }
  }

  return sent;
}

async function processLegacyEventsWithoutUtcIndex(db: admin.firestore.Firestore, now: Date): Promise<number> {
  const today = now.toISOString().slice(0, 10);
  const maxDate = new Date(now.getTime() + MAX_LEAD_TIME_MS + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const eventsSnap = await db
    .collection('events')
    .where('date', '>=', today)
    .where('date', '<=', maxDate)
    .get();

  let sent = 0;

  for (const eventDoc of eventsSnap.docs) {
    const event = eventDoc.data() as EventDoc;
    if (event.startAtUtc) continue;

    const eventId = eventDoc.id;
    const membersSnap = await db
      .collection('userTeams')
      .where('teamId', '==', event.teamId)
      .get();

    for (const memberDoc of membersSnap.docs) {
      const userId = String(memberDoc.data().userId);

      const didSend = await trySendReminder({
        db,
        userId,
        teamId: event.teamId,
        entityType: 'event',
        entityId: eventId,
        itemName: event.name,
        schedule: event,
        location: event.location ?? '',
        now,
      });
      if (didSend) sent += 1;
    }
  }

  return sent;
}

async function processTasks(db: admin.firestore.Firestore, now: Date): Promise<number> {
  const nowIso = now.toISOString();
  const maxIso = new Date(now.getTime() + MAX_LEAD_TIME_MS + 24 * 60 * 60 * 1000).toISOString();

  const tasksSnap = await db
    .collection('tasks')
    .where('startAtUtc', '>=', nowIso)
    .where('startAtUtc', '<=', maxIso)
    .get();

  let sent = 0;

  for (const taskDoc of tasksSnap.docs) {
    const task = taskDoc.data() as TaskDoc;
    const signedUp = task.signedUpUserIds ?? [];
    if (signedUp.length === 0) continue;

    for (const userId of signedUp) {
      const didSend = await trySendReminder({
        db,
        userId,
        teamId: task.teamId,
        entityType: 'task',
        entityId: taskDoc.id,
        itemName: task.name,
        schedule: task,
        location: task.location ?? '',
        now,
      });
      if (didSend) sent += 1;
    }
  }

  return sent;
}

async function processLegacyTasksWithoutUtc(db: admin.firestore.Firestore, now: Date): Promise<number> {
  const today = now.toISOString().slice(0, 10);
  const maxDate = new Date(now.getTime() + MAX_LEAD_TIME_MS + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const tasksSnap = await db
    .collection('tasks')
    .where('date', '>=', today)
    .where('date', '<=', maxDate)
    .get();

  let sent = 0;

  for (const taskDoc of tasksSnap.docs) {
    const task = taskDoc.data() as TaskDoc;
    if (task.startAtUtc) continue;

    const signedUp = task.signedUpUserIds ?? [];
    for (const userId of signedUp) {
      const didSend = await trySendReminder({
        db,
        userId,
        teamId: task.teamId,
        entityType: 'task',
        entityId: taskDoc.id,
        itemName: task.name,
        schedule: task,
        location: task.location ?? '',
        now,
      });
      if (didSend) sent += 1;
    }
  }

  return sent;
}

export async function runProcessReminders(): Promise<{
  eventsSent: number;
  tasksSent: number;
  refereeEventsSent: number;
}> {
  const db = admin.firestore();
  const now = new Date();

  let eventsSent = 0;
  let tasksSent = 0;
  let refereeEventsSent = 0;

  try {
    eventsSent += await processEvents(db, now);
  } catch (err) {
    console.warn('startAtUtc event query failed, using legacy date scan', err);
    eventsSent += await processLegacyEventsWithoutUtcIndex(db, now);
  }

  try {
    refereeEventsSent += await processRefereeAssignments(db, now);
  } catch (err) {
    console.warn('startAtUtc referee event query failed, using legacy date scan', err);
    refereeEventsSent += await processLegacyRefereeAssignmentsWithoutUtc(db, now);
  }

  try {
    tasksSent += await processTasks(db, now);
  } catch (err) {
    console.warn('startAtUtc task query failed, using legacy date scan', err);
    tasksSent += await processLegacyTasksWithoutUtc(db, now);
  }

  eventsSent += await processLegacyEventsWithoutUtcIndex(db, now);
  refereeEventsSent += await processLegacyRefereeAssignmentsWithoutUtc(db, now);
  tasksSent += await processLegacyTasksWithoutUtc(db, now);

  return { eventsSent, tasksSent, refereeEventsSent };
}
