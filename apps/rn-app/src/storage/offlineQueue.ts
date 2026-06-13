import AsyncStorage from '@react-native-async-storage/async-storage';
import { OFFLINE_QUEUE_KEY } from '@rianell/shared';
import type { LogEntry } from './logs';
import { loadLogs, saveLogs } from './logs';

type QueueItem = { op: 'save'; entry: LogEntry };

export async function enqueueOfflineLog(entry: LogEntry): Promise<void> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  const queue: QueueItem[] = raw ? JSON.parse(raw) : [];
  queue.push({ op: 'save', entry });
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(): Promise<number> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return 0;
  const queue: QueueItem[] = JSON.parse(raw);
  if (!queue.length) return 0;
  const logs = await loadLogs();
  const byDate = new Map(logs.map((l) => [l.date, l]));
  queue.forEach((item) => {
    if (item.op === 'save') byDate.set(item.entry.date, item.entry);
  });
  await saveLogs(Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)));
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  return queue.length;
}
