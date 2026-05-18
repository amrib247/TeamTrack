import { getStartDate, type ScheduledFields } from './timezoneUtils';

export function parseItemDateTime(item: ScheduledFields): Date | null {
  try {
    if (!item.date) return null;
    return getStartDate(item);
  } catch {
    return null;
  }
}

export function filterAndSortByDate<
  T extends ScheduledFields & { id: string },
>(items: T[], onDeleteOld: (id: string) => Promise<void>): Promise<T[]> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const kept: T[] = [];
  const toDelete: string[] = [];

  for (const item of items) {
    const dt = parseItemDateTime(item);
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
      const da = parseItemDateTime(a)?.getTime() ?? 0;
      const db = parseItemDateTime(b)?.getTime() ?? 0;
      return db - da;
    })
  );
}
