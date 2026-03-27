import type { LogEntry } from '../storage/logs';

/** Matches web View Logs shortcuts (Today / 7 / 30 / 90 / all). */
export type LogRangePreset = 'today' | 7 | 30 | 90 | 'all';

export type LogSortOrder = 'newest' | 'oldest';

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today’s calendar date in local time (YYYY-MM-DD). */
export function todayYmd(): string {
  return ymdLocal(new Date());
}

export function filterLogsByRange(logs: LogEntry[], preset: LogRangePreset): LogEntry[] {
  if (preset === 'all') return [...logs];

  const t = todayYmd();
  if (preset === 'today') {
    return logs.filter((l) => l.date === t);
  }

  const n = preset;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (n - 1));
  const startStr = ymdLocal(start);
  const endStr = ymdLocal(end);

  return logs.filter((l) => l.date >= startStr && l.date <= endStr);
}

export function sortLogsByDate(logs: LogEntry[], order: LogSortOrder): LogEntry[] {
  const mult = order === 'newest' ? -1 : 1;
  return [...logs].sort((a, b) => mult * a.date.localeCompare(b.date));
}

/**
 * Replaces the first entry matching `originalDate` with `nextEntry`.
 * If no match exists, returns a shallow copy of the original list.
 */
export function replaceLogEntryByDate(
  logs: LogEntry[],
  originalDate: string,
  nextEntry: LogEntry
): LogEntry[] {
  const idx = logs.findIndex((entry) => entry.date === originalDate);
  if (idx < 0) return [...logs];
  const next = [...logs];
  next[idx] = nextEntry;
  return next;
}
