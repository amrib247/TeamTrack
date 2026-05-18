import { DateTime } from 'luxon';

export const DEFAULT_TIME_ZONE = 'America/Los_Angeles';

export interface ScheduledFields {
  date: string;
  startTime: string;
  timeZone?: string;
  startAtUtc?: string;
}

export function localDateTimeToUtcIso(date: string, startTime: string, timeZone: string): string {
  const time = startTime.trim();
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const dt = DateTime.fromISO(`${date}T${normalizedTime}`, { zone: timeZone });
  if (!dt.isValid) {
    throw new Error(`Invalid date/time: ${date} ${startTime} (${timeZone})`);
  }
  const iso = dt.toUTC().toISO();
  if (!iso) throw new Error('Failed to convert to UTC');
  return iso;
}

export function resolveStartAtUtc(fields: ScheduledFields): string {
  if (fields.startAtUtc) return fields.startAtUtc;
  const zone = fields.timeZone || DEFAULT_TIME_ZONE;
  return localDateTimeToUtcIso(fields.date, fields.startTime, zone);
}

export function formatDateForDisplay(startAtUtc: string, viewerTimeZone = 'UTC'): string {
  const dt = DateTime.fromISO(startAtUtc, { zone: 'utc' }).setZone(viewerTimeZone);
  if (!dt.isValid) return startAtUtc;
  return dt.toFormat("EEE, MMM d, yyyy 'at' h:mm a ZZZZ");
}
