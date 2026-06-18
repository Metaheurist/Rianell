import NetInfo from '@react-native-community/netinfo';
import { addLogEntry, saveLogs, type LogEntry } from './logs';
import { enqueueOfflineLog } from './offlineQueue';

export async function isDeviceOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === false;
}

/** Persist wizard entry locally; enqueue when offline for flush-on-reconnect. */
export async function persistWizardLogEntry(existing: LogEntry[], entry: LogEntry): Promise<LogEntry[]> {
  const next = addLogEntry(existing, entry);
  await saveLogs(next);
  if (await isDeviceOffline()) {
    await enqueueOfflineLog(entry);
  }
  return next;
}
