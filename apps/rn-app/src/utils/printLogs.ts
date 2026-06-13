import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { LogEntry } from '../storage/logs';

export async function printOrShareLogs(logs: LogEntry[]): Promise<void> {
  const rows = logs
    .map(
      (e) =>
        `<tr><td>${e.date}</td><td>${e.flare ?? ''}</td><td>${e.mood ?? ''}</td><td>${e.sleep ?? ''}</td><td>${e.fatigue ?? ''}</td><td>${(e.notes ?? '').slice(0, 120)}</td></tr>`
    )
    .join('');
  const html = `<html><body><h1>Rianell logs</h1><table border="1" cellpadding="4"><thead><tr><th>Date</th><th>Flare</th><th>Mood</th><th>Sleep</th><th>Fatigue</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share health logs' });
  }
}
