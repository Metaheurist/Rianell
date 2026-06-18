import { appendProcessingActivity } from '@rianell/shared';
import { savePreferences, type Preferences } from './preferences';

export async function recordProcessingActivity(
  prefs: Preferences,
  entry: { type: string; at?: string; detail?: string },
  onChangePrefs: (next: Preferences) => void,
): Promise<void> {
  const next = {
    ...prefs,
    processingActivityLog: appendProcessingActivity(prefs.processingActivityLog, entry),
  };
  onChangePrefs(next);
  await savePreferences(next);
}
