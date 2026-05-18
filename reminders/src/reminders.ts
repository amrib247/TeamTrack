import * as admin from 'firebase-admin';
import {
  CRON_WINDOW_MS,
  DEFAULT_REMINDER_LEAD_TIME,
  LEAD_TIME_MS,
  MAX_LEAD_TIME_MS,
  type ReminderLeadTime,
} from './constants';
import { formatDateForDisplay, parseItemDateTime, toDateString } from './dateUtils';
import { sendReminderEmail } from './email';

type EventDoc = {
  teamId: string;
  name: string;
  date: string;
  startTime: string;
  location?: string;
};

type TaskDoc = {
  teamId: string;
  name: string;
  date: string;
  startTime: string;
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
  return reminderAt <= now && now < new Date(reminderAt.getTime() + CRON_WINDOW_MS) && now < start;
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
  date: string;
  startTime: string;
  location: string;
  now: Date;
}): Promise<boolean> {
  const { db, userId, teamId, entityType, entityId, now } = params;

  const membership = await getUserTeamMembership(db, userId, teamId);
  if (!membership || membership.inviteAccepted === false) return false;
  if (membership.emailNotificationsEnabled === false) return false;

  const leadTime = resolveLeadTime(membership);
  const start = parseItemDateTime(params.date, params.startTime);
  if (!start || !isInReminderWindow(start, leadTime, now)) return false;

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
    whenDisplay: formatDateForDisplay(params.date, params.startTime),
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
  const today = toDateString(now);
  const maxDate = toDateString(new Date(now.getTime() + MAX_LEAD_TIME_MS + CRON_WINDOW_MS));

  const eventsSnap = await db
    .collection('events')
    .where('date', '>=', today)
    .where('date', '<=', maxDate)
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
        date: event.date,
        startTime: event.startTime,
        location: event.location ?? '',
        now,
      });
      if (didSend) sent += 1;
    }
  }

  return sent;
}

async function processTasks(db: admin.firestore.Firestore, now: Date): Promise<number> {
  const today = toDateString(now);
  const maxDate = toDateString(new Date(now.getTime() + MAX_LEAD_TIME_MS + CRON_WINDOW_MS));

  const tasksSnap = await db
    .collection('tasks')
    .where('date', '>=', today)
    .where('date', '<=', maxDate)
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
        date: task.date,
        startTime: task.startTime,
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
  const eventsSent = await processEvents(db, now);
  const tasksSent = await processTasks(db, now);
  return { eventsSent, tasksSent };
}
