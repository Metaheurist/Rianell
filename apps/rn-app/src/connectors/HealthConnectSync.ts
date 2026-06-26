/**
 * Plan 19 CN6 — Android Health Connect read-only sync (stub when native module absent).
 */
import { Platform } from 'react-native';

export type HealthConnectPartialLog = {
  date: string;
  steps?: number;
  bpm?: number;
  weight?: string;
  sleep?: number;
};

export async function initializeHealthConnect(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const mod = await import('react-native-health-connect');
    if (typeof mod.initialize === 'function') {
      return await mod.initialize();
    }
  } catch {
    return false;
  }
  return false;
}

export async function syncFromHealthConnect(since: Date): Promise<HealthConnectPartialLog[]> {
  if (Platform.OS !== 'android') return [];
  const sinceMs = since.getTime();
  const out: HealthConnectPartialLog[] = [];
  try {
    const mod = await import('react-native-health-connect');
    if (typeof mod.readRecords !== 'function') return [];
    const steps = await mod.readRecords('Steps', { timeRangeFilter: { operator: 'after', startTime: since.toISOString() } });
    for (const rec of steps?.records ?? []) {
      if (rec.startTime && new Date(rec.startTime).getTime() >= sinceMs) {
        out.push({ date: rec.startTime.slice(0, 10), steps: rec.count });
      }
    }
  } catch {
    return [];
  }
  return out;
}
