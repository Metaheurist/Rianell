import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeLogEntry } from '@rianell/shared';
import type { LogEntry } from '../storage/logs';
import { loadLogs, saveLogs } from '../storage/logs';

const DEMO_BACKUP_KEY = 'rianell.logs.backup.beforeDemo.v1';
const DEMO_DAYS = 90;

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rebaseDatesToRecent(logs: LogEntry[]): LogEntry[] {
  const today = new Date();
  return logs.map((entry, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (logs.length - 1 - idx));
    return normalizeLogEntry({ ...entry, date: toYmd(d) }) as LogEntry;
  });
}

function buildPremadeDemoLogs(days = DEMO_DAYS): LogEntry[] {
  const logs: LogEntry[] = [];
  const cycle = 14 + 5 + 10; // good + flare + recovery
  for (let day = 0; day < days; day += 1) {
    const phase = day % cycle;
    const inFlare = phase >= 14 && phase < 19;
    const inRecovery = phase >= 19 && phase < 29;
    const fatigue = inFlare ? 7 : inRecovery ? 5 : 4;
    const stiffness = inFlare ? 8 : inRecovery ? 5 : 3;
    const sleep = inFlare ? 4 : inRecovery ? 6 : 8;
    const mood = inFlare ? 4 : inRecovery ? 6 : 8;
    const steps = inFlare ? 2500 : inRecovery ? 5000 : 7500;
    const hydration = inFlare ? 6 : 8;
    const bpm = inFlare ? 78 : 68;
    logs.push(
      normalizeLogEntry({
        date: '2000-01-01',
        bpm,
        weight: '75.0',
        flare: inFlare ? 'Yes' : 'No',
        fatigue,
        stiffness,
        jointPain: inFlare ? 7 : 3,
        sleep,
        mobility: inFlare ? 4 : 8,
        dailyFunction: inFlare ? 4 : 8,
        swelling: inFlare ? 6 : 2,
        mood,
        irritability: inFlare ? 7 : 3,
        weatherSensitivity: inFlare ? 7 : 3,
        steps,
        hydration,
        notes: inFlare ? 'Flare day, rested' : day % 7 === 0 ? 'Good day overall' : '',
        food: { breakfast: [], lunch: [], dinner: [], snack: [] },
        exercise: inFlare ? [] : [{ name: 'Walking', duration: 20 }],
      }) as LogEntry
    );
  }
  return rebaseDatesToRecent(logs);
}

export async function enableDemoMode(): Promise<void> {
  const existingBackup = await AsyncStorage.getItem(DEMO_BACKUP_KEY);
  if (!existingBackup) {
    const currentLogs = await loadLogs();
    await AsyncStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(currentLogs));
  }
  await saveLogs(buildPremadeDemoLogs());
}

export async function disableDemoMode(): Promise<void> {
  const backup = await AsyncStorage.getItem(DEMO_BACKUP_KEY);
  if (backup) {
    try {
      const parsed = JSON.parse(backup);
      if (Array.isArray(parsed)) {
        await saveLogs(parsed.map((x) => normalizeLogEntry(x)));
      } else {
        await saveLogs([]);
      }
    } catch {
      await saveLogs([]);
    }
    await AsyncStorage.removeItem(DEMO_BACKUP_KEY);
    return;
  }
  await saveLogs([]);
}

export async function refreshDemoModeLogsOnLaunch(): Promise<void> {
  await saveLogs(buildPremadeDemoLogs());
}

export async function clearDemoBackup(): Promise<void> {
  await AsyncStorage.removeItem(DEMO_BACKUP_KEY);
}
