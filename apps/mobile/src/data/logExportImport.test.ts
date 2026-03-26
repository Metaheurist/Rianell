import { mergeLogsAppend, parseLogImportJson, serializeLogsForExport } from './logExportImport';
import type { LogEntry } from '../storage/logs';

test('serialize and parse round-trip', () => {
  const logs = [{ date: '2026-01-01', flare: 'No' as const }] as LogEntry[];
  const s = serializeLogsForExport(logs);
  const back = parseLogImportJson(s);
  expect(back[0].date).toBe('2026-01-01');
});

test('mergeLogsAppend skips duplicate dates', () => {
  const a = [{ date: '2026-01-01', flare: 'No' as const, mood: 5 }] as LogEntry[];
  const b = [{ date: '2026-01-01', flare: 'Yes' as const, mood: 8 }] as LogEntry[];
  const m = mergeLogsAppend(a, b);
  expect(m).toHaveLength(1);
  expect(m[0].flare).toBe('No');
});

test('mergeLogsAppend adds new dates', () => {
  const a = [{ date: '2026-01-01', flare: 'No' as const }] as LogEntry[];
  const b = [{ date: '2026-01-02', flare: 'No' as const }] as LogEntry[];
  const m = mergeLogsAppend(a, b);
  expect(m.map((x) => x.date)).toEqual(['2026-01-01', '2026-01-02']);
});
