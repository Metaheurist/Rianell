import NetInfo from '@react-native-community/netinfo';
import { stampLogSavedAtForSave } from '@rianell/shared';
import { addLogEntry, saveLogs, type LogEntry } from './logs';
import { enqueueOfflineLog } from './offlineQueue';

export async function isDeviceOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === false;
}

/** Persist wizard entry locally; enqueue when offline for flush-on-reconnect. */
export async function persistWizardLogEntry(existing: LogEntry[], entry: LogEntry): Promise<LogEntry[]> {
  const existingForDate = existing.find((l) => l.date === entry.date);
  const stamped = stampLogSavedAtForSave(entry, existingForDate) as LogEntry;
  const next = addLogEntry(existing, stamped);
  await saveLogs(next);
  if (await isDeviceOffline()) {
    await enqueueOfflineLog(stamped);
  }
  return next;
}
