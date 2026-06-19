import {
  buildFlareRiskNotificationContent,
  buildMedDoseNotificationContent,
  buildReEngagementNotificationContent,
  hasEnabledMedSchedule,
  hasLoggedToday,
  listTodayMedDoseReminders,
  localDateStrFromNow,
  MED_DOSE_SNOOZE_MINUTES,
  resolveMissedLogNudgeTimeHHMM,
  resolveSmartReminderTime,
  shouldFireFlareRiskNudge,
  shouldFireMissedLogNudge,
  shouldFireReEngagementNudge,
  touchLastActiveAt,
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

export async function syncMedDoseReminders(prefs: Preferences, now = new Date()): Promise<void> {
  if (!prefs.notifications.enabled || !hasEnabledMedSchedule(prefs.medSchedule)) return;
  const logs = await loadLogs();
  const todayStr = localDateStrFromNow(now);
  const doses = listTodayMedDoseReminders(prefs.medSchedule, logs, now, {
    todayStr,
    notifiedAt: prefs.notifications.medDoseReminderNotifiedAt || {},
    snoozeUntil: prefs.notifications.medDoseSnoozeUntil || {},
  }).filter((d) => d.schedule);

  await Permissions.scheduleMedDoseReminders({
    enabled: true,
    soundEnabled: prefs.notifications.soundEnabled,
    doses: doses.map((d) => ({
      scheduledAt: d.scheduledAt,
      drug: d.drug,
      dose: d.dose,
      triggerAt: d.triggerAt,
    })),
  });
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

export async function maybeFireMedDoseReminders(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  now = new Date(),
): Promise<void> {
  if (!prefs.notifications.enabled || !hasEnabledMedSchedule(prefs.medSchedule)) return;
  const logs = await loadLogs();
  const todayStr = localDateStrFromNow(now);
  const pending = listTodayMedDoseReminders(prefs.medSchedule, logs, now, {
    todayStr,
    notifiedAt: prefs.notifications.medDoseReminderNotifiedAt || {},
    snoozeUntil: prefs.notifications.medDoseSnoozeUntil || {},
  }).filter((d) => d.fire);

  if (!pending.length) return;
  const dose = pending[0];
  const ok = await Permissions.scheduleMedDoseNudgeNow(
    {
      scheduledAt: dose.scheduledAt,
      drug: dose.drug,
      dose: dose.dose,
      triggerAt: dose.triggerAt,
    },
    prefs.notifications.soundEnabled,
  );
  if (!ok) return;
  void buildMedDoseNotificationContent(dose);
  onPrefsUpdate({
    ...prefs,
    notifications: {
      ...prefs.notifications,
      medDoseReminderNotifiedAt: {
        ...(prefs.notifications.medDoseReminderNotifiedAt || {}),
        [dose.scheduledAt]: todayStr,
      },
    },
  });
}

export async function maybeFireFlareRiskNudge(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  now = new Date(),
): Promise<void> {
  if (!prefs.notifications.enabled || prefs.aiEnabled === false) return;
  const logs = await loadLogs();
  const result = shouldFireFlareRiskNudge(logs, now, {
    lastNudgeWeek: prefs.notifications.flareRiskNudgeWeek ?? undefined,
  });
  if (!result.fire || !result.week) return;
  const ok = await Permissions.scheduleFlareRiskNudgeNow(prefs.notifications.soundEnabled);
  if (!ok) return;
  void buildFlareRiskNotificationContent(result.eval);
  onPrefsUpdate({
    ...prefs,
    notifications: {
      ...prefs.notifications,
      flareRiskNudgeWeek: result.week,
    },
  });
}

export function touchEngagementActivity(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  now = new Date(),
): void {
  const prev = prefs.notifications.lastActiveAt;
  if (prev) {
    const prevMs = Date.parse(prev);
    const nowMs = now.getTime();
    if (Number.isFinite(prevMs) && nowMs - prevMs < 5 * 60_000) return;
  }
  const at = touchLastActiveAt(now);
  onPrefsUpdate({
    ...prefs,
    notifications: {
      ...prefs.notifications,
      lastActiveAt: at,
    },
  });
}

export async function maybeFireReEngagementNudge(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  now = new Date(),
): Promise<void> {
  if (prefs.notifications.reEngagementNudgesEnabled === false) return;
  const result = shouldFireReEngagementNudge(now, {
    enabled: prefs.notifications.reEngagementNudgesEnabled,
    lastActiveAt: prefs.notifications.lastActiveAt ?? undefined,
    lastReEngagementNudgeAt: prefs.notifications.reEngagementNudgeAt ?? undefined,
  });
  if (!result.fire) return;
  const ok = await Permissions.scheduleReEngagementNudgeNow(prefs.notifications.soundEnabled);
  if (!ok) return;
  void buildReEngagementNotificationContent();
  onPrefsUpdate({
    ...prefs,
    notifications: {
      ...prefs.notifications,
      reEngagementNudgeAt: now.toISOString(),
    },
  });
}

export async function syncEngagementNotifications(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  now = new Date(),
): Promise<void> {
  await syncMedDoseReminders(prefs, now);
  await maybeFireSmartMissedLogNudge(prefs, onPrefsUpdate, now);
  await maybeFireMedDoseReminders(prefs, onPrefsUpdate, now);
  await maybeFireFlareRiskNudge(prefs, onPrefsUpdate, now);
  await maybeFireReEngagementNudge(prefs, onPrefsUpdate, now);
  touchEngagementActivity(prefs, onPrefsUpdate, now);
}

export async function handleMedDoseNotificationAction(
  prefs: Preferences,
  onPrefsUpdate: (next: Preferences) => void,
  action: 'taken' | 'snooze' | 'default' | 'none' | 'unknown',
  scheduledAt?: string,
): Promise<'open-log' | 'none'> {
  if (action === 'none' || action === 'unknown') return 'none';
  if (!scheduledAt) return action === 'taken' || action === 'default' ? 'open-log' : 'none';
  const logs = await loadLogs();
  const todayStr = localDateStrFromNow();
  const dose = listTodayMedDoseReminders(prefs.medSchedule, logs, new Date(), {
    todayStr,
    notifiedAt: prefs.notifications.medDoseReminderNotifiedAt || {},
    snoozeUntil: prefs.notifications.medDoseSnoozeUntil || {},
  }).find((d) => d.scheduledAt === scheduledAt);

  if (action === 'snooze' && dose) {
    const until = new Date(Date.now() + MED_DOSE_SNOOZE_MINUTES * 60_000).toISOString();
    await Permissions.scheduleMedDoseSnooze(
      { scheduledAt: dose.scheduledAt, drug: dose.drug, dose: dose.dose, triggerAt: dose.triggerAt },
      MED_DOSE_SNOOZE_MINUTES,
      prefs.notifications.soundEnabled,
    );
    onPrefsUpdate({
      ...prefs,
      notifications: {
        ...prefs.notifications,
        medDoseSnoozeUntil: {
          ...(prefs.notifications.medDoseSnoozeUntil || {}),
          [scheduledAt]: until,
        },
      },
    });
    return 'none';
  }

  return action === 'taken' || action === 'default' ? 'open-log' : 'none';
}
