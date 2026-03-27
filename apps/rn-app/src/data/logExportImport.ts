import { normalizeLogEntry } from '@rianell/shared';
import type { LogEntry } from '../storage/logs';

export function serializeLogsForExport(logs: LogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

export function parseLogImportJson(text: string): LogEntry[] {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Paste or choose a JSON file with a log array.');
  const parsed = JSON.parse(trimmed) as unknown;
  if (!Array.isArray(parsed)) throw new Error('JSON must be an array of log entries.');
  return parsed.map((x) => normalizeLogEntry(x) as LogEntry);
}

export function mergeLogsAppend(existing: LogEntry[], incoming: LogEntry[]): LogEntry[] {
  const byDate = new Map(existing.map((e) => [e.date, e]));
  for (const e of incoming) {
    const n = normalizeLogEntry(e) as LogEntry;
    if (!byDate.has(n.date)) byDate.set(n.date, n);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
