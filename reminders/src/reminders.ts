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
  location?: string;
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

function resolveLeadTime(data: UserTeamDoc): ReminderLeadTime {
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

async function isEventGoing(
  db: admin.firestore.Firestore,
  userId: string,
  teamId: string,
  eventId: string
): Promise<boolean> {
  const snap = await db
    .collection('availabilities')
    .where('userId', '==', userId)
    .where('teamId', '==', teamId)
    .where('eventId', '==', eventId)
    .limit(1)
    .get();

  if (snap.empty) return false;
  return snap.docs[0].data().status === 'YES';
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

  if (entityType === 'event') {
    if (!(await isEventGoing(db, userId, teamId, entityId))) return false;
  } else {
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

    const yesSnap = await db
      .collection('availabilities')
      .where('eventId', '==', eventId)
      .where('status', '==', 'YES')
      .get();

    for (const availDoc of yesSnap.docs) {
      const avail = availDoc.data();
      const userId = String(avail.userId);
      const teamId = String(avail.teamId ?? event.teamId);

      const didSend = await trySendReminder({
        db,
        userId,
        teamId,
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
    const yesSnap = await db
      .collection('availabilities')
      .where('eventId', '==', eventId)
      .where('status', '==', 'YES')
      .get();

    for (const availDoc of yesSnap.docs) {
      const avail = availDoc.data();
      const userId = String(avail.userId);
      const teamId = String(avail.teamId ?? event.teamId);

      const didSend = await trySendReminder({
        db,
        userId,
        teamId,
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

export async function runProcessReminders(): Promise<{ eventsSent: number; tasksSent: number }> {
  const db = admin.firestore();
  const now = new Date();

  let eventsSent = 0;
  let tasksSent = 0;

  try {
    eventsSent += await processEvents(db, now);
  } catch (err) {
    console.warn('startAtUtc event query failed, using legacy date scan', err);
    eventsSent += await processLegacyEventsWithoutUtcIndex(db, now);
  }

  try {
    tasksSent += await processTasks(db, now);
  } catch (err) {
    console.warn('startAtUtc task query failed, using legacy date scan', err);
    tasksSent += await processLegacyTasksWithoutUtc(db, now);
  }

  eventsSent += await processLegacyEventsWithoutUtcIndex(db, now);
  tasksSent += await processLegacyTasksWithoutUtc(db, now);

  return { eventsSent, tasksSent };
}
