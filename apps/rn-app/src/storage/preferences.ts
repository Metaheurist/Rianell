import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rianell.preferences.v1';

export type AppearanceMode = 'system' | 'light' | 'dark';
export type PreferredLlmModelSize = 'recommended' | 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';

export type Preferences = {
  team: string;
  appearanceMode: AppearanceMode;
  aiEnabled: boolean;
  demoMode: boolean;
  notifications: {
    enabled: boolean;
    dailyReminderTime: string;
    soundEnabled: boolean;
    snoozeMinutes: number;
  };
  goals: {
    moodTarget: number;
    sleepTarget: number;
    fatigueTarget: number;
  };
  performance: {
    preferredLlmModelSize: PreferredLlmModelSize;
  };
  accessibility: {
    textScale: number;
    largeTextEnabled: boolean;
    ttsEnabled: boolean;
    ttsReadModeEnabled: boolean;
    colorblindMode: string;
  };
};

export function getDefaultPreferences(): Preferences {
  return {
    team: 'mint',
    appearanceMode: 'system',
    aiEnabled: true,
    demoMode: false,
    notifications: {
      enabled: false,
      dailyReminderTime: '20:00',
      soundEnabled: true,
      snoozeMinutes: 30,
    },
    goals: {
      moodTarget: 7,
      sleepTarget: 7,
      fatigueTarget: 7,
    },
    performance: {
      preferredLlmModelSize: 'recommended',
    },
    accessibility: {
      textScale: 1,
      largeTextEnabled: false,
      ttsEnabled: false,
      ttsReadModeEnabled: false,
      colorblindMode: 'none',
    },
  };
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return getDefaultPreferences();
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    const d = getDefaultPreferences();
    const appearanceMode =
      parsed.appearanceMode === 'light' || parsed.appearanceMode === 'dark' || parsed.appearanceMode === 'system'
        ? parsed.appearanceMode
        : d.appearanceMode;
    const textScaleRaw = parsed.accessibility?.textScale ?? d.accessibility.textScale;
    const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, Number(textScaleRaw))) : d.accessibility.textScale;
    return {
      team: typeof parsed.team === 'string' ? parsed.team : d.team,
      appearanceMode,
      aiEnabled: parsed.aiEnabled !== false,
      demoMode: parsed.demoMode === true,
      notifications: {
        enabled: parsed.notifications?.enabled === true,
        dailyReminderTime:
          typeof parsed.notifications?.dailyReminderTime === 'string' &&
          /^\d{2}:\d{2}$/.test(parsed.notifications.dailyReminderTime)
            ? parsed.notifications.dailyReminderTime
            : d.notifications.dailyReminderTime,
        soundEnabled:
          parsed.notifications?.soundEnabled === false ? false : d.notifications.soundEnabled,
        snoozeMinutes: Number.isFinite(parsed.notifications?.snoozeMinutes)
          ? Math.min(120, Math.max(5, Number(parsed.notifications?.snoozeMinutes)))
          : d.notifications.snoozeMinutes,
      },
      goals: {
        moodTarget: Number.isFinite(parsed.goals?.moodTarget)
          ? Math.min(10, Math.max(0, Number(parsed.goals?.moodTarget)))
          : d.goals.moodTarget,
        sleepTarget: Number.isFinite(parsed.goals?.sleepTarget)
          ? Math.min(10, Math.max(0, Number(parsed.goals?.sleepTarget)))
          : d.goals.sleepTarget,
        fatigueTarget: Number.isFinite(parsed.goals?.fatigueTarget)
          ? Math.min(10, Math.max(0, Number(parsed.goals?.fatigueTarget)))
          : d.goals.fatigueTarget,
      },
      performance: {
        preferredLlmModelSize:
          parsed.performance?.preferredLlmModelSize === 'tier1' ||
          parsed.performance?.preferredLlmModelSize === 'tier2' ||
          parsed.performance?.preferredLlmModelSize === 'tier3' ||
          parsed.performance?.preferredLlmModelSize === 'tier4' ||
          parsed.performance?.preferredLlmModelSize === 'tier5' ||
          parsed.performance?.preferredLlmModelSize === 'recommended'
            ? parsed.performance.preferredLlmModelSize
            : d.performance.preferredLlmModelSize,
      },
      accessibility: {
        textScale,
        largeTextEnabled: parsed.accessibility?.largeTextEnabled === true,
        ttsEnabled: parsed.accessibility?.ttsEnabled === true,
        ttsReadModeEnabled: parsed.accessibility?.ttsReadModeEnabled === true,
        colorblindMode: typeof parsed.accessibility?.colorblindMode === 'string' ? parsed.accessibility!.colorblindMode : d.accessibility.colorblindMode,
      },
    };
  } catch {
    return getDefaultPreferences();
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

