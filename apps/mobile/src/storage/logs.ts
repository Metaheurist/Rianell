import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGS_STORAGE_KEY_V1, LOGS_STORAGE_KEY_MOBILE_LEGACY, normalizeLogEntry, createSampleLogEntry } from '@rianell/shared';

export type LogEntry = ReturnType<typeof normalizeLogEntry>;

export async function loadLogs(): Promise<LogEntry[]> {
  const raw = await AsyncStorage.getItem(LOGS_STORAGE_KEY_V1);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => normalizeLogEntry(x));
  } catch {
    return [];
  }
}

export async function saveLogs(logs: LogEntry[]): Promise<void> {
  await AsyncStorage.setItem(LOGS_STORAGE_KEY_V1, JSON.stringify(logs));
}

export function makeSampleLog(): LogEntry {
  return createSampleLogEntry();
}

export function addLogEntry(existing: LogEntry[], nextEntry: LogEntry): LogEntry[] {
  const normalized = normalizeLogEntry(nextEntry);
  if (existing.some((l) => l.date === normalized.date)) {
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
    await AsyncStorage.setItem(LOGS_STORAGE_KEY_V1, JSON.stringify(normalized));
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

