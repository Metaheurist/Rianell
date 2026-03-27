export type PermissionName = 'notifications' | 'microphone';

export type PermissionStatus = 'unavailable' | 'denied' | 'granted';

export type DailyReminderOptions = {
  enabled: boolean;
  time: string;
  soundEnabled: boolean;
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

const NOTIFICATION_REMINDER_ID = 'rianell-daily-reminder';
const NOTIFICATION_SNOOZE_ID = 'rianell-reminder-snooze';
const NOTIFICATION_CHANNEL_ID = 'rianell-reminders';
const NOTIFICATION_CATEGORY_ID = 'rianell-reminder-actions';

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

export const Permissions = {
  async getStatus(permission: PermissionName): Promise<PermissionStatus> {
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
      }
      if (!opts.enabled) return { ok: true, delivery: 'disabled' };
      const t = parseTimeHHMM(opts.time);
      if (!t) return { ok: false, reason: 'invalid-time', delivery: 'schedule-failed' };
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_REMINDER_ID,
        content: {
          title: 'Rianell reminder',
          body: 'Log today to keep your trends and AI insights up to date.',
          sound: opts.soundEnabled ? 'default' : null,
          ...(categoryConfigured ? { categoryIdentifier: NOTIFICATION_CATEGORY_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
          hour: t.hour,
          minute: t.minute,
          ...(channelConfigured ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
        },
      });
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
      const id = response?.notification?.request?.identifier;
      if (id !== NOTIFICATION_REMINDER_ID) return 'none';
      const action = response?.actionIdentifier;
      if (action === 'log-now') return 'log-now';
      if (action === 'later') return 'later';
      if (action === Notifications.DEFAULT_ACTION_IDENTIFIER || action === 'default') return 'default';
      return action ? 'unknown' : 'none';
    } catch {
      return 'none';
    }
  },
  async subscribeReminderActions(onAction: (action: ReminderAction) => void): Promise<() => void> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.addNotificationResponseReceivedListener) return () => {};
    try {
      const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const id = response?.notification?.request?.identifier;
        if (id !== NOTIFICATION_REMINDER_ID) return;
        const action = response?.actionIdentifier;
        if (action === 'log-now') onAction('log-now');
        else if (action === 'later') onAction('later');
        else if (action === Notifications.DEFAULT_ACTION_IDENTIFIER || action === 'default') onAction('default');
        else onAction('unknown');
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
};

