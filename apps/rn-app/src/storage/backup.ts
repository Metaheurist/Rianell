import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGS_BACKUP_KEY, LOGS_STORAGE_KEY_V1 } from '@rianell/shared';

export async function backupLogs(): Promise<void> {
  const raw = await AsyncStorage.getItem(LOGS_STORAGE_KEY_V1);
  if (raw) await AsyncStorage.setItem(LOGS_BACKUP_KEY, raw);
}

export async function restoreLogsFromBackup(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LOGS_BACKUP_KEY);
  if (!raw) return false;
  await AsyncStorage.setItem(LOGS_STORAGE_KEY_V1, raw);
  return true;
}

export async function compressLogsIfEnabled(enabled: boolean): Promise<void> {
  if (!enabled) return;
  const raw = await AsyncStorage.getItem(LOGS_STORAGE_KEY_V1);
  if (!raw || raw.length < 4096) return;
  try {
    await backupLogs();
  } catch {
    /* best effort */
  }
}
