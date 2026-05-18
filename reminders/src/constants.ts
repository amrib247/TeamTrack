export type ReminderLeadTime = '1h' | '6h' | '1d' | '2d' | '3d';

export const LEAD_TIME_MS: Record<ReminderLeadTime, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '2d': 2 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
};

export const MAX_LEAD_TIME_MS = LEAD_TIME_MS['3d'];
export const CRON_WINDOW_MS = 15 * 60 * 1000;

export const DEFAULT_REMINDER_LEAD_TIME: ReminderLeadTime = '1d';
