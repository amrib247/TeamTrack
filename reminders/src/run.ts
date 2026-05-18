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
  console.log(JSON.stringify({ ok: true, ...result }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
