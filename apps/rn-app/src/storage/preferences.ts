import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rianell.preferences.v1';

export type AppearanceMode = 'system' | 'light' | 'dark';
export type PreferredLlmModelSize = 'recommended' | 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';
export type WeightUnit = 'kg' | 'lb';
export type AiModelDownloadConsent = 'granted' | 'deferred';

export type Preferences = {
  team: string;
  appearanceMode: AppearanceMode;
  aiEnabled: boolean;
  demoMode: boolean;
  userName: string;
  medicalCondition: string;
  weightUnit: WeightUnit;
  contributeAnonData: boolean;
  useOpenData: boolean;
  healthDataConsent: boolean;
  healthDataConsentAt: string | null;
  privacyRegion: string;
  privacyRegionSource: string;
  privacyRegionUpdatedAt: string | null;
  policyAcknowledgedVersion: string | null;
  policyAcknowledgedAt: string | null;
  uiLocale: string;
  uiLocaleSource: 'onboarding' | 'user' | 'region' | 'account' | '';
  uiLocaleUpdatedAt: string | null;
  dataResidencyCode: string;
  dataResidencyProjectUrl: string;
  backup: boolean;
  compress: boolean;
  animations: boolean;
  lazyCharts: boolean;
  lazy: boolean;
  aiModelDownloadConsent: AiModelDownloadConsent;
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
    steps: number;
    hydration: number;
    sleepScore: number;
    goodDaysPerWeek: number;
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
    userName: '',
    medicalCondition: '',
    weightUnit: 'kg',
    contributeAnonData: false,
    useOpenData: false,
    healthDataConsent: false,
    healthDataConsentAt: null,
    privacyRegion: '',
    privacyRegionSource: '',
    privacyRegionUpdatedAt: null,
    policyAcknowledgedVersion: null,
    policyAcknowledgedAt: null,
    uiLocale: 'en-GB',
    uiLocaleSource: '',
    uiLocaleUpdatedAt: null,
    dataResidencyCode: 'default',
    dataResidencyProjectUrl: '',
    backup: true,
    compress: false,
    animations: true,
    lazyCharts: true,
    lazy: true,
    aiModelDownloadConsent: 'deferred',
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
      steps: 10000,
      hydration: 9,
      sleepScore: 5,
      goodDaysPerWeek: 3,
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
      userName: typeof parsed.userName === 'string' ? parsed.userName : d.userName,
      medicalCondition: typeof parsed.medicalCondition === 'string' ? parsed.medicalCondition : d.medicalCondition,
      weightUnit: parsed.weightUnit === 'lb' ? 'lb' : d.weightUnit,
      contributeAnonData: parsed.contributeAnonData === true,
      useOpenData: parsed.useOpenData === true,
      healthDataConsent: parsed.healthDataConsent === true,
      healthDataConsentAt:
        typeof parsed.healthDataConsentAt === 'string' ? parsed.healthDataConsentAt : d.healthDataConsentAt,
      privacyRegion: typeof parsed.privacyRegion === 'string' ? parsed.privacyRegion : d.privacyRegion,
      privacyRegionSource:
        typeof parsed.privacyRegionSource === 'string' ? parsed.privacyRegionSource : d.privacyRegionSource,
      privacyRegionUpdatedAt:
        typeof parsed.privacyRegionUpdatedAt === 'string' ? parsed.privacyRegionUpdatedAt : d.privacyRegionUpdatedAt,
      policyAcknowledgedVersion:
        typeof parsed.policyAcknowledgedVersion === 'string'
          ? parsed.policyAcknowledgedVersion
          : d.policyAcknowledgedVersion,
      policyAcknowledgedAt:
        typeof parsed.policyAcknowledgedAt === 'string' ? parsed.policyAcknowledgedAt : d.policyAcknowledgedAt,
      uiLocale: typeof parsed.uiLocale === 'string' ? parsed.uiLocale : d.uiLocale,
      uiLocaleSource:
        parsed.uiLocaleSource === 'onboarding' ||
        parsed.uiLocaleSource === 'user' ||
        parsed.uiLocaleSource === 'region' ||
        parsed.uiLocaleSource === 'account'
          ? parsed.uiLocaleSource
          : d.uiLocaleSource,
      uiLocaleUpdatedAt:
        typeof parsed.uiLocaleUpdatedAt === 'string' ? parsed.uiLocaleUpdatedAt : d.uiLocaleUpdatedAt,
      dataResidencyCode: 'default',
      dataResidencyProjectUrl:
        typeof parsed.dataResidencyProjectUrl === 'string'
          ? parsed.dataResidencyProjectUrl
          : d.dataResidencyProjectUrl,
      backup: parsed.backup !== false,
      compress: parsed.compress === true,
      animations: parsed.animations !== false,
      lazyCharts: parsed.lazyCharts !== false,
      lazy: parsed.lazy !== false && parsed.lazyCharts !== false,
      aiModelDownloadConsent:
        parsed.aiModelDownloadConsent === 'granted' ? 'granted' : d.aiModelDownloadConsent,
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
        steps: Number.isFinite(parsed.goals?.steps)
          ? Math.min(100000, Math.max(0, Number(parsed.goals?.steps)))
          : d.goals.steps,
        hydration: Number.isFinite(parsed.goals?.hydration)
          ? Math.min(30, Math.max(0, Number(parsed.goals?.hydration)))
          : d.goals.hydration,
        sleepScore: Number.isFinite(parsed.goals?.sleepScore)
          ? Math.min(10, Math.max(0, Number(parsed.goals?.sleepScore)))
          : d.goals.sleepScore,
        goodDaysPerWeek: Number.isFinite(parsed.goals?.goodDaysPerWeek)
          ? Math.min(7, Math.max(0, Number(parsed.goals?.goodDaysPerWeek)))
          : d.goals.goodDaysPerWeek,
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

const VALID_TEAMS = new Set(['mint', 'red-black', 'mono', 'rainbow']);

/** Fast team read for BootLoadingScreen while full preferences load. */
export async function peekStoredTeamForBoot(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { team?: string };
    const t = parsed.team;
    if (typeof t === 'string' && VALID_TEAMS.has(t)) return t;
  } catch {
    /* ignore */
  }
  return null;
}

