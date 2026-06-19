import {
  hasLoggedToday,
  localDateStrFromNow,
  resolveMissedLogNudgeTimeHHMM,
  resolveSmartReminderTime,
  shouldFireMissedLogNudge,
} from '@rianell/shared';
import { Permissions } from '../permissions/permissions';
import { loadLogs } from '../storage/logs';
import type { Preferences } from '../storage/preferences';

export async function resolveEffectiveReminderSchedule(
  prefs: Preferences,
  now = new Date(),
) {
  const logs = await loadLogs();
  const fallback = prefs.notifications.dailyReminderTime;
  const todayStr = localDateStrFromNow(now);
  const { time: reminderTime, learned } = resolveSmartReminderTime(logs, fallback, { now, todayStr });
  const { time: missedNudgeTime } = resolveMissedLogNudgeTimeHHMM(logs, fallback, { now, todayStr });
  return {
    logs,
    todayStr,
    reminderTime,
    missedNudgeTime: hasLoggedToday(logs, todayStr) ? undefined : missedNudgeTime,
    learned,
  };
}

export async function maybeFireSmartMissedLogNudge(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  now = new Date(),
): Promise<void> {
  if (!prefs.notifications.enabled) return;
  const logs = await loadLogs();
  const todayStr = localDateStrFromNow(now);
  const result = shouldFireMissedLogNudge(logs, now, {
    fallbackHHMM: prefs.notifications.dailyReminderTime,
    lastNudgeDate: prefs.notifications.smartMissedNudgeDate ?? undefined,
    todayStr,
  });
  if (!result.fire) return;
  const ok = await Permissions.scheduleSmartMissedLogNudgeNow(prefs.notifications.soundEnabled);
  if (!ok) return;
  onPrefsUpdate({
    ...prefs,
    notifications: {
      ...prefs.notifications,
      smartMissedNudgeDate: todayStr,
    },
  });
}
