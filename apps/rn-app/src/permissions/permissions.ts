export type PermissionName = 'notifications' | 'microphone';

export type PermissionStatus = 'unavailable' | 'denied' | 'granted';

export type DailyReminderOptions = {
  enabled: boolean;
  time: string;
  soundEnabled: boolean;
};

const NOTIFICATION_REMINDER_ID = 'rianell-daily-reminder';

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
  async scheduleDailyReminder(opts: DailyReminderOptions): Promise<boolean> {
    const Notifications = await loadExpoNotifications();
    if (!Notifications?.scheduleNotificationAsync) return false;
    try {
      if (Notifications?.cancelScheduledNotificationAsync) {
        await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_REMINDER_ID);
      }
      if (!opts.enabled) return true;
      const t = parseTimeHHMM(opts.time);
      if (!t) return false;
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_REMINDER_ID,
        content: {
          title: 'Rianell reminder',
          body: 'Log today to keep your trends and AI insights up to date.',
          sound: opts.soundEnabled ? 'default' : null,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
          hour: t.hour,
          minute: t.minute,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
};

