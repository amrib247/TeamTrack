export function parseItemDateTime(date: string, startTime?: string): Date | null {
  if (!date) return null;

  const time = startTime?.trim() || '00:00';
  const attempts = [`${date}T${time}`, `${date}T${time}:00`, date];

  for (const value of attempts) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const dateOnly = new Date(`${date}T00:00:00`);
  return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
}

export function formatDateForDisplay(date: string, startTime?: string): string {
  const dt = parseItemDateTime(date, startTime);
  if (!dt) return `${date} ${startTime ?? ''}`.trim();
  return dt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
