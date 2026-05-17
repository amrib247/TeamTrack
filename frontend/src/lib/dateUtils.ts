export function parseItemDateTime(date: string, startTime?: string): Date | null {
  if (!date) return null;

  const time = startTime?.trim() || '00:00';
  const attempts = [
    `${date}T${time}`,
    `${date}T${time}:00`,
    date,
  ];

  for (const value of attempts) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const dateOnly = new Date(`${date}T00:00:00`);
  return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
}

export function filterAndSortByDate<T extends { date: string; startTime?: string; id: string }>(
  items: T[],
  onDeleteOld: (id: string) => Promise<void>
): Promise<T[]> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const kept: T[] = [];
  const toDelete: string[] = [];

  for (const item of items) {
    const dt = parseItemDateTime(item.date, item.startTime);
    if (!dt) {
      kept.push(item);
      continue;
    }
    if (dt > oneWeekAgo) {
      kept.push(item);
    } else if (dt <= oneMonthAgo) {
      toDelete.push(item.id);
    }
  }

  return Promise.all(toDelete.map(onDeleteOld)).then(() =>
    kept.sort((a, b) => {
      const da = parseItemDateTime(a.date, a.startTime)?.getTime() ?? 0;
      const db = parseItemDateTime(b.date, b.startTime)?.getTime() ?? 0;
      return db - da;
    })
  );
}
