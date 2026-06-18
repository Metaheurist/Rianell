import {
  LOG_CSV_ENGLISH_HEADERS,
  LOG_CSV_I18N_KEYS,
  logsToCsv,
  normalizeLogEntry,
  parseLogsCsv,
  parseMigrationCsv,
} from '@rianell/shared';
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

export function serializeLogsCsvForExport(
  logs: LogEntry[],
  t: (key: string) => string,
): string {
  return logsToCsv(logs, (fieldId: string) => {
    const key = LOG_CSV_I18N_KEYS[fieldId as keyof typeof LOG_CSV_I18N_KEYS];
    const translated = key ? t(key) : '';
    if (translated && translated !== key) return translated;
    return LOG_CSV_ENGLISH_HEADERS[fieldId as keyof typeof LOG_CSV_ENGLISH_HEADERS] || fieldId;
  });
}

export function parseLogImportCsv(text: string, t?: (key: string) => string): LogEntry[] {
  const aliasMap: Record<string, string | string[]> = {};
  for (const [id, en] of Object.entries(LOG_CSV_ENGLISH_HEADERS)) {
    const key = LOG_CSV_I18N_KEYS[id as keyof typeof LOG_CSV_I18N_KEYS];
    const labels = [en];
    if (t && key) {
      const tr = t(key);
      if (tr && tr !== key) labels.push(tr);
    }
    aliasMap[id] = labels;
  }
  const raw = parseLogsCsv(text, aliasMap as Parameters<typeof parseLogsCsv>[1]);
  return raw.map((x) => normalizeLogEntry(x) as LogEntry);
}

export function parseLogImportMigration(text: string, sourceId: 'bearable' | 'flaredown'): LogEntry[] {
  return parseMigrationCsv(text, sourceId).map((x) => normalizeLogEntry(x) as LogEntry);
}
