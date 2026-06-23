import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGS_STORAGE_KEY_V1, LOGS_STORAGE_KEY_MOBILE_LEGACY, normalizeLogEntry, createSampleLogEntry, mergeLogEntriesForDate } from '@rianell/shared';
import { backupLogs, compressLogsIfEnabled } from './backup';
import { decryptLogsEnvelope, encryptLogsEnvelope } from './logsAesGcm';

export type LogEntry = ReturnType<typeof normalizeLogEntry>;

export type PersistLogsOptions = {
  backup?: boolean;
  compress?: boolean;
};

export async function loadLogs(): Promise<LogEntry[]> {
  const raw = await AsyncStorage.getItem(LOGS_STORAGE_KEY_V1);
  if (!raw) return [];
  try {
    const parsed = await decryptLogsEnvelope<unknown>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => normalizeLogEntry(x));
  } catch {
    return [];
  }
}

export async function saveLogs(logs: LogEntry[]): Promise<void> {
  const envelope = await encryptLogsEnvelope(logs);
  await AsyncStorage.setItem(LOGS_STORAGE_KEY_V1, envelope);
}

export async function persistLogs(logs: LogEntry[], opts?: PersistLogsOptions): Promise<void> {
  if (opts?.backup) {
    try {
      await backupLogs();
    } catch {
      /* best effort */
    }
  }
  await saveLogs(logs);
  if (opts?.compress) {
    try {
      await compressLogsIfEnabled(true);
    } catch {
      /* best effort */
    }
  }
}

export function makeSampleLog(): LogEntry {
  return createSampleLogEntry();
}

export function addLogEntry(existing: LogEntry[], nextEntry: LogEntry): LogEntry[] {
  const normalized = normalizeLogEntry(nextEntry);
  const idx = existing.findIndex((l) => l.date === normalized.date);
  if (idx >= 0) {
    if (normalized.subEntries?.length) {
      const merged = normalizeLogEntry(mergeLogEntriesForDate(existing[idx], normalized));
      const next = [...existing];
      next[idx] = merged;
      return next;
    }
    throw new Error(`Duplicate entry for ${normalized.date}`);
  }
  return [...existing, normalized];
}

export async function migrateLegacyLogsIfNeeded(): Promise<void> {
  const hasNew = await AsyncStorage.getItem(LOGS_STORAGE_KEY_V1);
  if (hasNew) return;
  const legacy = await AsyncStorage.getItem(LOGS_STORAGE_KEY_MOBILE_LEGACY);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed)) return;
    const normalized = parsed.map((x) => normalizeLogEntry(x));
    await saveLogs(normalized);
  } catch {
    // ignore
  }
}

export function getFrequentLogItems(logs: LogEntry[], key: 'symptoms' | 'stressors', limit = 6): string[] {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const arr = log[key];
    if (!Array.isArray(arr)) return;
    arr.forEach((item) => {
      if (typeof item !== 'string') return;
      const normalized = item.trim();
      if (!normalized) return;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([item]) => item);
}
