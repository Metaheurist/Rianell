import {
  filterLogsByRange,
  replaceLogEntryByDate,
  sortLogsByDate,
  todayYmd,
  type LogRangePreset,
} from './logsViewHelpers';
import type { LogEntry } from '../storage/logs';

function entry(date: string, mood = 5): LogEntry {
  return {
    date,
    flare: 'No',
    mood,
    fatigue: 3,
    sleep: 7,
  } as LogEntry;
}

describe('filterLogsByRange', () => {
  const logs: LogEntry[] = [
    entry('2025-01-01'),
    entry('2025-06-15'),
    entry('2030-12-31'),
  ];

  test('all returns copy', () => {
    const r = filterLogsByRange(logs, 'all');
    expect(r).toHaveLength(3);
    expect(r).not.toBe(logs);
  });

  test('today keeps only matching date', () => {
    const today = todayYmd();
    const mixed: LogEntry[] = [entry('1999-01-01'), entry(today), entry('1999-01-02')];
    const r = filterLogsByRange(mixed, 'today');
    expect(r).toHaveLength(1);
    expect(r[0].date).toBe(today);
  });

  test('7-day window excludes old dates', () => {
    const t = todayYmd();
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 1);
    const yest = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const narrow: LogEntry[] = [entry('2020-01-01'), entry(yest), entry(t)];
    const r = filterLogsByRange(narrow, 7);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.date).sort()).toEqual([yest, t].sort());
  });
});

describe('sortLogsByDate', () => {
  const logs: LogEntry[] = [entry('2025-01-03'), entry('2025-01-01'), entry('2025-01-02')];

  test('newest first', () => {
    const r = sortLogsByDate(logs, 'newest');
    expect(r.map((x) => x.date)).toEqual(['2025-01-03', '2025-01-02', '2025-01-01']);
  });

  test('oldest first', () => {
    const r = sortLogsByDate(logs, 'oldest');
    expect(r.map((x) => x.date)).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
  });
});

describe('replaceLogEntryByDate', () => {
  test('replaces the first matching entry by date', () => {
    const logs: LogEntry[] = [entry('2025-01-01', 1), entry('2025-01-02', 2), entry('2025-01-01', 3)];
    const updated = entry('2025-01-01', 9);
    const result = replaceLogEntryByDate(logs, '2025-01-01', updated);
    expect(result[0].mood).toBe(9);
    expect(result[2].mood).toBe(3);
  });

  test('returns copy when no date matches', () => {
    const logs: LogEntry[] = [entry('2025-01-01', 1)];
    const result = replaceLogEntryByDate(logs, '2025-02-01', entry('2025-02-01', 7));
    expect(result).toEqual(logs);
    expect(result).not.toBe(logs);
  });
});
