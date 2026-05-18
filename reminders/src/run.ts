import * as admin from 'firebase-admin';
import { runProcessReminders } from './reminders';

function initFirebase(): void {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required');
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(json) as admin.ServiceAccount;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

async function main(): Promise<void> {
  initFirebase();
  const result = await runProcessReminders();
  console.log(
    JSON.stringify({
      ok: true,
      ...result,
      ranAt: new Date().toISOString(),
    })
  );
  if (result.eventsSent === 0 && result.tasksSent === 0) {
    console.log(
      'No reminders sent. Common causes: start time still more than lead time away; ' +
        'not signed up for task; notifications disabled; invite not accepted; wrong timezone; ' +
        'or reminder already recorded in reminderDeliveries.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
