import { DateTime } from 'luxon';

/** Pacific Time — default for legacy events/tasks without a time zone. */
export const DEFAULT_TIME_ZONE = 'America/Los_Angeles';

export interface ScheduledFields {
  date: string;
  startTime: string;
  timeZone?: string;
  startAtUtc?: string;
}

export interface NormalizedSchedule extends ScheduledFields {
  timeZone: string;
  startAtUtc: string;
}

/** Browser IANA zone, or Pacific if unavailable. */
export function getUserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch {
    /* ignore */
  }
  return DEFAULT_TIME_ZONE;
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

export function utcIsoToLocalParts(
  startAtUtc: string,
  timeZone: string
): { date: string; startTime: string } {
  const dt = DateTime.fromISO(startAtUtc, { zone: 'utc' }).setZone(timeZone);
  if (!dt.isValid) {
    throw new Error(`Invalid UTC instant: ${startAtUtc}`);
  }
  return {
    date: dt.toFormat('yyyy-MM-dd'),
    startTime: dt.toFormat('HH:mm'),
  };
}

export function resolveStartAtUtc(fields: ScheduledFields): string {
  if (fields.startAtUtc) return fields.startAtUtc;
  const zone = fields.timeZone || DEFAULT_TIME_ZONE;
  return localDateTimeToUtcIso(fields.date, fields.startTime, zone);
}

export function normalizeScheduledFields(fields: ScheduledFields): NormalizedSchedule {
  const timeZone = fields.timeZone || DEFAULT_TIME_ZONE;
  const startAtUtc = resolveStartAtUtc({ ...fields, timeZone });
  const parts = utcIsoToLocalParts(startAtUtc, timeZone);
  return {
    date: parts.date,
    startTime: parts.startTime,
    timeZone,
    startAtUtc,
  };
}

export function getStartDate(fields: ScheduledFields): Date {
  return new Date(resolveStartAtUtc(fields));
}

export function calendarDateInZone(startAtUtc: string, timeZone: string): string {
  return DateTime.fromISO(startAtUtc, { zone: 'utc' }).setZone(timeZone).toFormat('yyyy-MM-dd');
}

export function formatScheduledDate(
  startAtUtc: string,
  viewerTimeZone: string = getUserTimeZone()
): string {
  return DateTime.fromISO(startAtUtc, { zone: 'utc' })
    .setZone(viewerTimeZone)
    .toFormat('EEE, MMM d, yyyy');
}

export function formatScheduledTime(
  startAtUtc: string,
  viewerTimeZone: string = getUserTimeZone()
): string {
  const dt = DateTime.fromISO(startAtUtc, { zone: 'utc' }).setZone(viewerTimeZone);
  return `${dt.toFormat('h:mm a')} ${dt.offsetNameShort || dt.toFormat('ZZZZ')}`;
}

export function formatScheduledDateTime(
  startAtUtc: string,
  viewerTimeZone: string = getUserTimeZone()
): string {
  const dt = DateTime.fromISO(startAtUtc, { zone: 'utc' }).setZone(viewerTimeZone);
  return dt.toFormat("EEE, MMM d, yyyy 'at' h:mm a ZZZZ");
}

export function formatTimeZoneLabel(timeZone: string): string {
  const dt = DateTime.now().setZone(timeZone);
  const short = dt.offsetNameShort || timeZone;
  return `${timeZone.replace(/_/g, ' ')} (${short})`;
}

/** Common zones for the event/task form dropdown. */
export function getTimeZoneOptions(): { value: string; label: string }[] {
  const detected = getUserTimeZone();
  const common = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'UTC',
  ];
  const values = [detected, ...common.filter((z) => z !== detected)];
  return values.map((value) => ({
    value,
    label: value === detected ? `${formatTimeZoneLabel(value)} — your device` : formatTimeZoneLabel(value),
  }));
}
