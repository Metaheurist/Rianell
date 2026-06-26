import { Platform } from 'react-native';
import { buildNotificationContent } from '@rianell/shared';

export type PermissionName = 'notifications' | 'microphone';

export type PermissionStatus = 'unavailable' | 'denied' | 'granted';

export type DailyReminderOptions = {
  enabled: boolean;
  time: string;
  soundEnabled: boolean;
  missedNudgeTime?: string;
};

export type DailyReminderResult = {
  ok: boolean;
  reason?: 'module-unavailable' | 'invalid-time' | 'schedule-failed';
  delivery:
    | 'disabled'
    | 'runtime-unavailable'
    | 'scheduled-basic'
    | 'scheduled-android-channel'
    | 'scheduled-ios-category'
    | 'scheduled-channel-and-category'
    | 'schedule-failed';
};

export type ReminderAction = 'log-now' | 'later' | 'default' | 'unknown' | 'none';
export type MedDoseAction = 'taken' | 'snooze' | 'default' | 'none';
export type MedDoseReminderPayload = {
  scheduledAt: string;
  drug: string;
  dose?: string;
  triggerAt: string;
};
export type ReminderCapabilities = {
  hasScheduling: boolean;
  hasAndroidChannel: boolean;
  hasIosCategory: boolean;
  hasResponseListener: boolean;
  hasSnooze: boolean;
  hasDismissAction: boolean;
};

const NOTIFICATION_REMINDER_ID = 'rianell-daily-reminder';
const NOTIFICATION_SNOOZE_ID = 'rianell-reminder-snooze';
const NOTIFICATION_SMART_MISSED_ID = 'rianell-smart-missed-nudge';
const NOTIFICATION_FLARE_RISK_ID = 'rianell-flare-risk-nudge';
const NOTIFICATION_RE_ENGAGEMENT_ID = 'rianell-re-engagement-nudge';
const NOTIFICATION_STREAK_REMINDER_ID = 'rianell-streak-reminder-nudge';
const NOTIFICATION_CHANNEL_ID = 'rianell-reminders';
const NOTIFICATION_CATEGORY_ID = 'rianell-reminder-actions';
const NOTIFICATION_MED_DOSE_CATEGORY_ID = 'rianell-med-dose-actions';
const MED_DOSE_ID_PREFIX = 'rianell-med-dose-';

function notificationPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function buildReminderNotificationContent(title: string, body: string, soundEnabled: boolean) {
  const base = buildNotificationContent(notificationPlatform(), {
    title,
    body,
    channelId: NOTIFICATION_CHANNEL_ID,
    badge: 1,
  });
  return {
    ...base,
    sound: soundEnabled ? 'default' : null,
  };
}

export function normalizeReminderActionIdentifier(
  actionIdentifier: unknown,
  defaultActionIdentifier?: string,
  dismissedActionIdentifier?: string
): ReminderAction {
  if (typeof actionIdentifier !== 'string' || !actionIdentifier.trim()) return 'none';
  const raw = actionIdentifier.trim();
  if (defaultActionIdentifier && raw === defaultActionIdentifier) return 'default';
  if (dismissedActionIdentifier && raw === dismissedActionIdentifier) return 'none';

  // Normalize action IDs from different runtimes (hyphen/underscore/space/case variants).
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (normalized === 'dismiss' || normalized === 'dismissed' || normalized === 'close' || normalized === 'closed') return 'none';
  if (normalized === 'default') return 'default';
  if (normalized === 'log-now' || normalized === 'lognow') return 'log-now';
  if (normalized === 'later') return 'later';
  return 'unknown';
}

export function mapNotificationResponseToReminderAction(
  notificationIdentifier: unknown,
  actionIdentifier: unknown,
  defaultActionIdentifier?: string,
  dismissedActionIdentifier?: string
): ReminderAction {
  if (notificationIdentifier !== NOTIFICATION_REMINDER_ID && notificationIdentifier !== NOTIFICATION_SNOOZE_ID && notificationIdentifier !== NOTIFICATION_SMART_MISSED_ID) {
    return 'none';
  }
  const normalized = normalizeReminderActionIdentifier(actionIdentifier, defaultActionIdentifier, dismissedActionIdentifier);
  // Snooze notifications do not expose custom category actions; treat taps as open-app intent.
  if (notificationIdentifier === NOTIFICATION_SNOOZE_ID) {
    if (normalized === 'none') return 'none';
    return 'default';
  }
  return normalized;
}

export function mapNotificationResponseToMedDoseAction(
  notificationIdentifier: unknown,
  actionIdentifier: unknown,
  defaultActionIdentifier?: string,
  dismissedActionIdentifier?: string,
): MedDoseAction {
  if (typeof notificationIdentifier !== 'string' || !notificationIdentifier.startsWith(MED_DOSE_ID_PREFIX)) {
    return 'none';
  }
  const raw = typeof actionIdentifier === 'string' ? actionIdentifier.trim() : '';
  if (dismissedActionIdentifier && raw === dismissedActionIdentifier) return 'none';
  if (defaultActionIdentifier && raw === defaultActionIdentifier) return 'default';
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (normalized === 'taken' || normalized === 'mark-taken') return 'taken';
  if (normalized === 'snooze' || normalized === 'later') return 'snooze';
  if (normalized === 'default') return 'default';
  return raw ? 'default' : 'none';
}

function parseTimeHHMM(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

async function loadExpoNotifications(): Promise<any | null> {
  try {
    // Optional at runtime; keep graceful fallback when unavailable.
    const moduleName = 'expo-notifications';
    const mod = await import(moduleName);
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

async function loadExpoAv(): Promise<any | null> {
  try {
    const mod = await import('expo-av');
    return mod;
  } catch {
    return null;
  }
}

function mapAvPermission(p: { granted?: boolean; canAskAgain?: boolean; status?: string } | null | undefined): PermissionStatus {
  if (!p) return 'unavailable';
  if (p.granted === true || p.status === 'granted') return 'granted';
  if (p.canAskAgain === false) return 'denied';
  return 'denied';
}

export const Permissions = {
  async getStatus(permission: PermissionName): Promise<PermissionStatus> {
    if (permission === 'microphone') {
      const ExpoAv = await loadExpoAv();
      const Audio = ExpoAv?.Audio;
      if (!Audio?.getPermissionsAsync) return 'unavailable';
      try {
        const p = await Audio.getPermissionsAsync();
        return mapAvPermission(p);
      } catch {
        return 'unavailable';
      }
    }
    if (permission !== 'notifications') return 'unavailable';
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.getPermissionsAsync) return 'unavailable';
    try {
      const p = await Notifications.getPermissionsAsync();
      if (p?.granted) return 'granted';
      if (p?.canAskAgain === false) return 'denied';
      return 'denied';
    } catch {
      return 'unavailable';
    }
  },
  async request(permission: PermissionName): Promise<PermissionStatus> {
    if (permission === 'microphone') {
      const ExpoAv = await loadExpoAv();
      const Audio = ExpoAv?.Audio;
      if (!Audio?.requestPermissionsAsync) return 'unavailable';
      try {
        const p = await Audio.requestPermissionsAsync();
        return mapAvPermission(p);
      } catch {
        return 'unavailable';
      }
    }
    if (permission !== 'notifications') return 'unavailable';
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.requestPermissionsAsync) return 'unavailable';
    try {
      const p = await Notifications.requestPermissionsAsync();
      return p?.granted ? 'granted' : 'denied';
    } catch {
      return 'unavailable';
    }
  },
  async scheduleDailyReminder(opts: DailyReminderOptions): Promise<DailyReminderResult> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) {
      return { ok: false, reason: 'module-unavailable', delivery: 'runtime-unavailable' };
    }
    try {
      let channelConfigured = false;
      let categoryConfigured = false;
      if (Notifications?.setNotificationChannelAsync && Notifications?.AndroidImportance) {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'Daily reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: opts.soundEnabled ? 'default' : null,
          vibrationPattern: opts.soundEnabled ? [0, 250, 150, 250] : [0],
        });
        channelConfigured = true;
      }
      if (Notifications?.setNotificationCategoryAsync) {
        await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_ID, [
          {
            identifier: 'log-now',
            buttonTitle: 'Log now',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'later',
            buttonTitle: 'Later',
            options: { opensAppToForeground: false },
          },
        ]);
        categoryConfigured = true;
      }
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_REMINDER_ID);
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_SMART_MISSED_ID);
      }
      if (!opts.enabled) return { ok: true, delivery: 'disabled' };
      const t = parseTimeHHMM(opts.time);
      if (!t) return { ok: false, reason: 'invalid-time', delivery: 'schedule-failed' };
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_REMINDER_ID,
        content: {
          ...buildReminderNotificationContent(
            'Rianell reminder',
            'Log today to keep your trends and AI insights up to date.',
            opts.soundEnabled,
          ),
          ...(categoryConfigured ? { categoryIdentifier: NOTIFICATION_CATEGORY_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
          hour: t.hour,
          minute: t.minute,
          ...(channelConfigured ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
        },
      });
      if (opts.missedNudgeTime) {
        const nudge = parseTimeHHMM(opts.missedNudgeTime);
        if (nudge) {
          const now = new Date();
          const triggerAt = new Date();
          triggerAt.setHours(nudge.hour, nudge.minute, 0, 0);
          if (triggerAt > now) {
            const seconds = Math.max(60, Math.floor((triggerAt.getTime() - now.getTime()) / 1000));
            await Notifications.scheduleNotificationAsync({
              identifier: NOTIFICATION_SMART_MISSED_ID,
              content: {
                ...buildReminderNotificationContent(
                  'Still time to log today',
                  'A quick check-in keeps your health trends accurate.',
                  opts.soundEnabled,
                ),
                ...(categoryConfigured ? { categoryIdentifier: NOTIFICATION_CATEGORY_ID } : {}),
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
                seconds,
                repeats: false,
                ...(channelConfigured ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
              },
            });
          }
        }
      }
      return {
        ok: true,
        delivery: channelConfigured && categoryConfigured
          ? 'scheduled-channel-and-category'
          : channelConfigured
            ? 'scheduled-android-channel'
            : categoryConfigured
              ? 'scheduled-ios-category'
              : 'scheduled-basic',
      };
    } catch {
      return { ok: false, reason: 'schedule-failed', delivery: 'schedule-failed' };
    }
  },
  async getLastReminderAction(): Promise<ReminderAction> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.getLastNotificationResponseAsync) return 'none';
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      return mapNotificationResponseToReminderAction(
        response?.notification?.request?.identifier,
        response?.actionIdentifier,
        Notifications.DEFAULT_ACTION_IDENTIFIER,
        Notifications.DISMISSED_ACTION_IDENTIFIER
      );
    } catch {
      return 'none';
    }
  },
  async subscribeReminderActions(onAction: (action: ReminderAction) => void): Promise<() => void> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.addNotificationResponseReceivedListener) return () => {};
    try {
      const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const action = mapNotificationResponseToReminderAction(
          response?.notification?.request?.identifier,
          response?.actionIdentifier,
          Notifications.DEFAULT_ACTION_IDENTIFIER,
          Notifications.DISMISSED_ACTION_IDENTIFIER
        );
        if (action === 'none') return;
        onAction(action);
      });
      return () => {
        try {
          sub?.remove?.();
        } catch {
          // no-op
        }
      };
    } catch {
      return () => {};
    }
  },
  async clearLastReminderAction(): Promise<void> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.clearLastNotificationResponseAsync) return;
    try {
      await Notifications.clearLastNotificationResponseAsync();
    } catch {
      // no-op
    }
  },
  async scheduleReminderSnooze(minutes = 30): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_SNOOZE_ID);
      }
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_SNOOZE_ID,
        content: {
          title: 'Rianell reminder (snoozed)',
          body: 'Quick check-in: log now when you are ready.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: Math.max(60, Math.floor(minutes * 60)),
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async scheduleSmartMissedLogNudgeNow(soundEnabled = true): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_SMART_MISSED_ID);
      }
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_SMART_MISSED_ID,
        content: {
          title: 'Still time to log today',
          body: 'A quick check-in keeps your health trends accurate.',
          sound: soundEnabled ? 'default' : null,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: 2,
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async scheduleMedDoseReminders(opts: {
    enabled: boolean;
    soundEnabled: boolean;
    doses: MedDoseReminderPayload[];
  }): Promise<{ scheduled: number }> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return { scheduled: 0 };
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync?.();
      if (Array.isArray(scheduled)) {
        for (const item of scheduled) {
          const id = item?.identifier;
          if (typeof id === 'string' && id.startsWith(MED_DOSE_ID_PREFIX) && Notifications.cancelScheduledNotificationAsync) {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        }
      }
      if (!opts.enabled || !opts.doses.length) return { scheduled: 0 };

      let channelConfigured = false;
      let categoryConfigured = false;
      if (Notifications?.setNotificationChannelAsync && Notifications?.AndroidImportance) {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'Daily reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: opts.soundEnabled ? 'default' : null,
        });
        channelConfigured = true;
      }
      if (Notifications?.setNotificationCategoryAsync) {
        await Notifications.setNotificationCategoryAsync(NOTIFICATION_MED_DOSE_CATEGORY_ID, [
          { identifier: 'taken', buttonTitle: 'Taken', options: { opensAppToForeground: true } },
          { identifier: 'snooze', buttonTitle: 'Snooze', options: { opensAppToForeground: false } },
        ]);
        categoryConfigured = true;
      }

      const now = Date.now();
      let count = 0;
      for (const dose of opts.doses) {
        const triggerAt = new Date(dose.triggerAt);
        if (Number.isNaN(triggerAt.getTime()) || triggerAt.getTime() <= now) continue;
        const id = `${MED_DOSE_ID_PREFIX}${dose.scheduledAt.replace(/[^0-9A-Za-z]/g, '')}`;
        const label = dose.dose ? `${dose.drug} (${dose.dose})` : dose.drug;
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: 'Medication reminder',
            body: `Time for ${label}. Mark taken when you log today.`,
            sound: opts.soundEnabled ? 'default' : null,
            data: { scheduledAt: dose.scheduledAt, kind: 'med-dose' },
            ...(categoryConfigured ? { categoryIdentifier: NOTIFICATION_MED_DOSE_CATEGORY_ID } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
            date: triggerAt,
            ...(channelConfigured ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
          },
        });
        count += 1;
      }
      return { scheduled: count };
    } catch {
      return { scheduled: 0 };
    }
  },
  async scheduleMedDoseNudgeNow(dose: MedDoseReminderPayload, soundEnabled = true): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      const id = `${MED_DOSE_ID_PREFIX}${dose.scheduledAt.replace(/[^0-9A-Za-z]/g, '')}`;
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      const label = dose.dose ? `${dose.drug} (${dose.dose})` : dose.drug;
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: 'Medication reminder',
          body: `Time for ${label}. Mark taken when you log today.`,
          sound: soundEnabled ? 'default' : null,
          data: { scheduledAt: dose.scheduledAt, kind: 'med-dose' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: 2,
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async scheduleMedDoseSnooze(dose: MedDoseReminderPayload, minutes: number, soundEnabled = true): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      const id = `${MED_DOSE_ID_PREFIX}snooze-${dose.scheduledAt.replace(/[^0-9A-Za-z]/g, '')}`;
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      const label = dose.dose ? `${dose.drug} (${dose.dose})` : dose.drug;
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: 'Medication reminder (snoozed)',
          body: `Reminder: ${label}`,
          sound: soundEnabled ? 'default' : null,
          data: { scheduledAt: dose.scheduledAt, kind: 'med-dose-snooze' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: Math.max(60, Math.floor(minutes * 60)),
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async scheduleFlareRiskNudgeNow(soundEnabled = true): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_FLARE_RISK_ID);
      }
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_FLARE_RISK_ID,
        content: {
          title: 'High fatigue week',
          body: 'Patterns suggest an unusually fatiguing week. Consider pacing and logging how you feel.',
          sound: soundEnabled ? 'default' : null,
          data: { kind: 'flare-risk' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: 2,
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async scheduleReEngagementNudgeNow(soundEnabled = true): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_RE_ENGAGEMENT_ID);
      }
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_RE_ENGAGEMENT_ID,
        content: {
          title: 'We miss you',
          body: 'A quick check-in keeps your health trends useful. Tap to log today.',
          sound: soundEnabled ? 'default' : null,
          data: { kind: 're-engagement' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: 2,
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async scheduleStreakReminderNudgeNow(goodDayStreak: number, soundEnabled = true): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    const body =
      goodDayStreak <= 1
        ? 'One calm day in a row. A quick log keeps your picture complete.'
        : `${goodDayStreak} calm day(s) in a row. Still time to log today, no scores, just continuity.`;
    try {
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_STREAK_REMINDER_ID);
      }
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_STREAK_REMINDER_ID,
        content: {
          title: 'Recent patterns',
          body,
          sound: soundEnabled ? 'default' : null,
          data: { kind: 'streak-reminder', goodDayStreak },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          seconds: 2,
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  async subscribeMedDoseActions(onAction: (action: MedDoseAction, scheduledAt?: string) => void): Promise<() => void> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.addNotificationResponseReceivedListener) return () => {};
    try {
      const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const identifier = response?.notification?.request?.identifier;
        const action = mapNotificationResponseToMedDoseAction(
          identifier,
          response?.actionIdentifier,
          Notifications.DEFAULT_ACTION_IDENTIFIER,
          Notifications.DISMISSED_ACTION_IDENTIFIER,
        );
        if (action === 'none') return;
        const scheduledAt = response?.notification?.request?.content?.data?.scheduledAt;
        onAction(action, typeof scheduledAt === 'string' ? scheduledAt : undefined);
      });
      return () => {
        try {
          sub?.remove?.();
        } catch {
          // no-op
        }
      };
    } catch {
      return () => {};
    }
  },
  async getReminderCapabilities(): Promise<ReminderCapabilities> {
    const Notifications = await loadExpoNotifications();
    return {
      hasScheduling: !!Notifications?.scheduleNotificationAsync,
      hasAndroidChannel: !!(Notifications?.setNotificationChannelAsync && Notifications?.AndroidImportance),
      hasIosCategory: !!Notifications?.setNotificationCategoryAsync,
      hasResponseListener: !!Notifications?.addNotificationResponseReceivedListener,
      hasSnooze: !!Notifications?.scheduleNotificationAsync,
      hasDismissAction: !!Notifications?.DISMISSED_ACTION_IDENTIFIER,
    };
  },
};

