import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyLocaleDefaultsToPrefs,
  normalizeDisplayNameTheme,
  normalizeLogFavorites,
  normalizeMedSchedule,
  normalizeProfileAvatar,
  normalizeSymptomTemplates,
  normalizeTrackingProfile,
  normalizeCustomChartMetrics,
  normalizeHomeDashboardPrefs,
  normalizeAchievementState,
  readProcessingActivity,
} from '@rianell/shared';

export type CustomChartMetric = {
  id: string;
  label: string;
  type: 'scale' | 'boolean';
  color: string;
};

const KEY = 'rianell.preferences.v1';
const TUTORIAL_SEEN_KEY = 'rianellTutorialSeen';

export type AppearanceMode = 'system' | 'light' | 'dark';
export type PreferredLlmModelSize = 'recommended' | 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';
export type LlmCoachPersona = 'encouraging' | 'clinical' | 'minimal';
export type WeightUnit = 'kg' | 'lb';
export type AiModelDownloadConsent = 'granted' | 'deferred';
export type DateFormatPref = 'DMY' | 'MDY' | 'YMD' | 'locale';
export type WeightUnitSource = 'default' | 'locale' | 'user';

export type TrackingProfile = {
  condition: string;
  fields: {
    mood: boolean;
    pain: boolean;
    notes: boolean;
    sleep: boolean;
    fatigue: boolean;
  };
  configuredAt: string | null;
};

export type Preferences = {
  team: string;
  appearanceMode: AppearanceMode;
  aiEnabled: boolean;
  demoMode: boolean;
  userName: string;
  medicalCondition: string;
  profileAvatar: string;
  displayNameTheme: string;
  trackingProfile: TrackingProfile;
  tutorialSeen: boolean;
  replayTutorial: boolean;
  firstRunWizardCompletedAt: string | null;
  simpleMode: boolean;
  dateFormat: DateFormatPref;
  firstDayOfWeek: number;
  localeDefaultsApplied: boolean;
  weightUnitSource: WeightUnitSource;
  cookieConsent: boolean;
  cookieConsentAt: string | null;
  pushNotificationsEnabled: boolean;
  pushNotificationsEnabledAt: string | null;
  contributeAnonDataAt: string | null;
  aiModelDownloadConsentAt: string | null;
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
    smartMissedNudgeDate: string | null;
    medDoseReminderNotifiedAt: Record<string, string>;
    medDoseSnoozeUntil: Record<string, string>;
    flareRiskNudgeWeek: string | null;
    lastActiveAt: string | null;
    reEngagementNudgeAt: string | null;
    reEngagementNudgesEnabled: boolean;
    streakReminderNudgeDate: string | null;
    streakReminderNudgesEnabled: boolean;
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
    llmCoachPersona: LlmCoachPersona;
  };
  accessibility: {
    textScale: number;
    largeTextEnabled: boolean;
    ttsEnabled: boolean;
    ttsReadModeEnabled: boolean;
    plainLanguageEnabled: boolean;
    chartPaletteMode: string;
    colorblindMode: string;
  };
  logFavorites: {
    meals: string[];
    exercises: string[];
    medCombos: string[];
  };
  symptomTemplates: Array<{ condition: string; chips: string[] }>;
  medSchedule: Array<{ id: string; drug: string; dose: string; times: string[]; enabled: boolean }>;
  cycleModuleEnabled: boolean;
  digestiveModuleEnabled: boolean;
  barcodeFoodLoggingEnabled: boolean;
  healthConnectEnabled: boolean;
  glucoseUnit: 'mmol' | 'mgdl';
  temperatureUnit: 'celsius' | 'fahrenheit';
  heightCm: number | null;
  bodyWeightUnit: 'kg' | 'lbs';
  localOnlyMode: boolean;
  sessionRecording: boolean;
  sessionRecordingAt: string | null;
  sessionRecordingDisclosureAt: string | null;
  appLockEnabled: boolean;
  processingActivityLog: Array<{ type: string; at: string; detail?: string }>;
  cloudAutoSyncOnOpen: boolean;
  cloudAutoSyncDailyTime: string | null;
  caregiverModeEnabled: boolean;
  caregiverDependentName: string;
  caregiverRelationship: 'parent' | 'guardian' | 'other';
  customChartMetrics: CustomChartMetric[];
  homeStreakCardDismissed: boolean;
  weatherStripEnabled: boolean;
  weatherLat: number | null;
  weatherLon: number | null;
  weatherCache: {
    tempC: number | null;
    pressureHpa: number | null;
    usAqi: number | null;
    fetchedAt: number;
  } | null;
  nextAppointmentDate: string | null;
  treatmentStarts: Array<{ date: string; label: string }>;
  homeGapQuestionCache: { date: string; gapId: string } | null;
  homeQuestionAnswerState: { date: string; count: number } | null;
  weeklyReviewDismissedWeek: string | null;
  homeWelcomeCardDismissed: boolean;
  goalsModalSeenCount: number;
  firstOpenDate: string | null;
  weeklyReviewCompletedAt: string | null;
  personalBestDismissedAt: string | null;
  achievements: {
    achievements: Record<string, { notifiedAt?: string; seenAt?: string }>;
    updatedAt: string | null;
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
    profileAvatar: 'leaf',
    displayNameTheme: 'mint',
    trackingProfile: normalizeTrackingProfile(null),
    tutorialSeen: false,
    replayTutorial: false,
    firstRunWizardCompletedAt: null,
    simpleMode: false,
    dateFormat: 'locale',
    firstDayOfWeek: 1,
    localeDefaultsApplied: false,
    weightUnitSource: 'default',
    cookieConsent: false,
    cookieConsentAt: null,
    pushNotificationsEnabled: false,
    pushNotificationsEnabledAt: null,
    contributeAnonDataAt: null,
    aiModelDownloadConsentAt: null,
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
      smartMissedNudgeDate: null,
      medDoseReminderNotifiedAt: {},
      medDoseSnoozeUntil: {},
      flareRiskNudgeWeek: null,
      lastActiveAt: null,
      reEngagementNudgeAt: null,
      reEngagementNudgesEnabled: true,
      streakReminderNudgeDate: null,
      streakReminderNudgesEnabled: true,
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
      llmCoachPersona: 'encouraging',
    },
    accessibility: {
      textScale: 1,
      largeTextEnabled: false,
      ttsEnabled: false,
      ttsReadModeEnabled: false,
      plainLanguageEnabled: false,
      chartPaletteMode: 'standard',
      colorblindMode: 'none',
    },
    logFavorites: normalizeLogFavorites(null),
    symptomTemplates: [],
    medSchedule: [],
    cycleModuleEnabled: false,
    digestiveModuleEnabled: false,
    barcodeFoodLoggingEnabled: false,
    healthConnectEnabled: false,
    glucoseUnit: 'mmol',
    temperatureUnit: 'celsius',
    heightCm: null,
    bodyWeightUnit: 'kg',
    localOnlyMode: false,
    sessionRecording: true,
    sessionRecordingAt: null,
    sessionRecordingDisclosureAt: null,
    appLockEnabled: false,
    processingActivityLog: [],
    cloudAutoSyncOnOpen: false,
    cloudAutoSyncDailyTime: null,
    caregiverModeEnabled: false,
    caregiverDependentName: '',
    caregiverRelationship: 'parent',
    customChartMetrics: [],
    homeStreakCardDismissed: false,
    weatherStripEnabled: false,
    weatherLat: null,
    weatherLon: null,
    weatherCache: null,
    nextAppointmentDate: null,
    treatmentStarts: [],
    homeGapQuestionCache: null,
    homeQuestionAnswerState: null,
    weeklyReviewDismissedWeek: null,
    homeWelcomeCardDismissed: false,
    goalsModalSeenCount: 0,
    firstOpenDate: null,
    weeklyReviewCompletedAt: null,
    personalBestDismissedAt: null,
    achievements: normalizeAchievementState(null) as Preferences['achievements'],
  };
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const tutorialFlag = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
    if (!raw) {
      const d = getDefaultPreferences();
      return applyLocaleDefaultsToPrefs(d, d.uiLocale) as Preferences;
    }
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    const d = getDefaultPreferences();
    const appearanceMode =
      parsed.appearanceMode === 'light' || parsed.appearanceMode === 'dark' || parsed.appearanceMode === 'system'
        ? parsed.appearanceMode
        : d.appearanceMode;
    const textScaleRaw = parsed.accessibility?.textScale ?? d.accessibility.textScale;
    const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, Number(textScaleRaw))) : d.accessibility.textScale;
    const base: Preferences = {
      team: typeof parsed.team === 'string' ? parsed.team : d.team,
      appearanceMode,
      aiEnabled: parsed.aiEnabled !== false,
      demoMode: parsed.demoMode === true,
      userName: typeof parsed.userName === 'string' ? parsed.userName : d.userName,
      medicalCondition: typeof parsed.medicalCondition === 'string' ? parsed.medicalCondition : d.medicalCondition,
      profileAvatar: normalizeProfileAvatar(parsed.profileAvatar),
      displayNameTheme: normalizeDisplayNameTheme(parsed.displayNameTheme),
      trackingProfile: normalizeTrackingProfile(parsed.trackingProfile),
      tutorialSeen: parsed.tutorialSeen === true || tutorialFlag === '1',
      replayTutorial: parsed.replayTutorial === true,
      firstRunWizardCompletedAt:
        typeof parsed.firstRunWizardCompletedAt === 'string' ? parsed.firstRunWizardCompletedAt : d.firstRunWizardCompletedAt,
      simpleMode: parsed.simpleMode === true,
      dateFormat:
        parsed.dateFormat === 'DMY' || parsed.dateFormat === 'MDY' || parsed.dateFormat === 'YMD' || parsed.dateFormat === 'locale'
          ? parsed.dateFormat
          : d.dateFormat,
      firstDayOfWeek: parsed.firstDayOfWeek === 0 || parsed.firstDayOfWeek === 1 || parsed.firstDayOfWeek === 6
        ? parsed.firstDayOfWeek
        : d.firstDayOfWeek,
      localeDefaultsApplied: parsed.localeDefaultsApplied === true,
      weightUnitSource:
        parsed.weightUnitSource === 'locale' || parsed.weightUnitSource === 'user' || parsed.weightUnitSource === 'default'
          ? parsed.weightUnitSource
          : d.weightUnitSource,
      cookieConsent: parsed.cookieConsent === true,
      cookieConsentAt: typeof parsed.cookieConsentAt === 'string' ? parsed.cookieConsentAt : d.cookieConsentAt,
      pushNotificationsEnabled: parsed.pushNotificationsEnabled === true || parsed.notifications?.enabled === true,
      pushNotificationsEnabledAt:
        typeof parsed.pushNotificationsEnabledAt === 'string' ? parsed.pushNotificationsEnabledAt : d.pushNotificationsEnabledAt,
      contributeAnonDataAt:
        typeof parsed.contributeAnonDataAt === 'string' ? parsed.contributeAnonDataAt : d.contributeAnonDataAt,
      aiModelDownloadConsentAt:
        typeof parsed.aiModelDownloadConsentAt === 'string' ? parsed.aiModelDownloadConsentAt : d.aiModelDownloadConsentAt,
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
        smartMissedNudgeDate:
          typeof parsed.notifications?.smartMissedNudgeDate === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(parsed.notifications.smartMissedNudgeDate)
            ? parsed.notifications.smartMissedNudgeDate
            : d.notifications.smartMissedNudgeDate,
        medDoseReminderNotifiedAt:
          parsed.notifications?.medDoseReminderNotifiedAt &&
          typeof parsed.notifications.medDoseReminderNotifiedAt === 'object'
            ? parsed.notifications.medDoseReminderNotifiedAt
            : d.notifications.medDoseReminderNotifiedAt,
        medDoseSnoozeUntil:
          parsed.notifications?.medDoseSnoozeUntil && typeof parsed.notifications.medDoseSnoozeUntil === 'object'
            ? parsed.notifications.medDoseSnoozeUntil
            : d.notifications.medDoseSnoozeUntil,
        flareRiskNudgeWeek:
          typeof parsed.notifications?.flareRiskNudgeWeek === 'string' &&
          /^\d{4}-W\d{2}$/.test(parsed.notifications.flareRiskNudgeWeek)
            ? parsed.notifications.flareRiskNudgeWeek
            : d.notifications.flareRiskNudgeWeek,
        lastActiveAt:
          typeof parsed.notifications?.lastActiveAt === 'string' ? parsed.notifications.lastActiveAt : d.notifications.lastActiveAt,
        reEngagementNudgeAt:
          typeof parsed.notifications?.reEngagementNudgeAt === 'string'
            ? parsed.notifications.reEngagementNudgeAt
            : d.notifications.reEngagementNudgeAt,
        reEngagementNudgesEnabled:
          parsed.notifications?.reEngagementNudgesEnabled === false ? false : d.notifications.reEngagementNudgesEnabled,
        streakReminderNudgeDate:
          typeof parsed.notifications?.streakReminderNudgeDate === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(parsed.notifications.streakReminderNudgeDate)
            ? parsed.notifications.streakReminderNudgeDate
            : d.notifications.streakReminderNudgeDate,
        streakReminderNudgesEnabled:
          parsed.notifications?.streakReminderNudgesEnabled === false
            ? false
            : d.notifications.streakReminderNudgesEnabled,
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
        llmCoachPersona:
          parsed.performance?.llmCoachPersona === 'clinical' ||
          parsed.performance?.llmCoachPersona === 'minimal' ||
          parsed.performance?.llmCoachPersona === 'encouraging'
            ? parsed.performance.llmCoachPersona
            : d.performance.llmCoachPersona,
      },
      accessibility: {
        textScale,
        largeTextEnabled: parsed.accessibility?.largeTextEnabled === true,
        ttsEnabled: parsed.accessibility?.ttsEnabled === true,
        ttsReadModeEnabled: parsed.accessibility?.ttsReadModeEnabled === true,
        plainLanguageEnabled: parsed.accessibility?.plainLanguageEnabled === true,
        chartPaletteMode:
          parsed.accessibility?.chartPaletteMode === 'high-contrast' ? 'high-contrast' : d.accessibility.chartPaletteMode,
        colorblindMode: typeof parsed.accessibility?.colorblindMode === 'string' ? parsed.accessibility!.colorblindMode : d.accessibility.colorblindMode,
      },
      logFavorites: normalizeLogFavorites(parsed.logFavorites),
      symptomTemplates: normalizeSymptomTemplates(parsed.symptomTemplates),
      medSchedule: normalizeMedSchedule(parsed.medSchedule),
      cycleModuleEnabled: parsed.cycleModuleEnabled === true,
      digestiveModuleEnabled: parsed.digestiveModuleEnabled === true,
      barcodeFoodLoggingEnabled: parsed.barcodeFoodLoggingEnabled === true,
      healthConnectEnabled: parsed.healthConnectEnabled === true,
      glucoseUnit: parsed.glucoseUnit === 'mgdl' ? 'mgdl' : d.glucoseUnit,
      temperatureUnit: parsed.temperatureUnit === 'fahrenheit' ? 'fahrenheit' : d.temperatureUnit,
      heightCm: typeof parsed.heightCm === 'number' && Number.isFinite(parsed.heightCm) ? parsed.heightCm : d.heightCm,
      bodyWeightUnit: parsed.bodyWeightUnit === 'lbs' ? 'lbs' : d.bodyWeightUnit,
      localOnlyMode: parsed.localOnlyMode === true,
      sessionRecording: parsed.sessionRecording === true,
      sessionRecordingAt:
        typeof parsed.sessionRecordingAt === 'string' ? parsed.sessionRecordingAt : d.sessionRecordingAt,
      sessionRecordingDisclosureAt:
        typeof parsed.sessionRecordingDisclosureAt === 'string'
          ? parsed.sessionRecordingDisclosureAt
          : d.sessionRecordingDisclosureAt,
      appLockEnabled: parsed.appLockEnabled === true,
      processingActivityLog: readProcessingActivity(parsed.processingActivityLog),
      cloudAutoSyncOnOpen: parsed.cloudAutoSyncOnOpen === true,
      cloudAutoSyncDailyTime:
        typeof parsed.cloudAutoSyncDailyTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.cloudAutoSyncDailyTime)
          ? parsed.cloudAutoSyncDailyTime
          : null,
      caregiverModeEnabled: parsed.caregiverModeEnabled === true,
      caregiverDependentName: typeof parsed.caregiverDependentName === 'string' ? parsed.caregiverDependentName : '',
      caregiverRelationship:
        parsed.caregiverRelationship === 'guardian' || parsed.caregiverRelationship === 'other'
          ? parsed.caregiverRelationship
          : 'parent',
      customChartMetrics: normalizeCustomChartMetrics(parsed.customChartMetrics),
      achievements: normalizeAchievementState(parsed.achievements) as Preferences['achievements'],
      ...normalizeHomeDashboardPrefs(parsed),
    };
    return applyLocaleDefaultsToPrefs(base, base.uiLocale) as Preferences;
  } catch {
    return getDefaultPreferences();
  }
}

export async function markTutorialSeen(prefs: Preferences): Promise<Preferences> {
  const next = { ...prefs, tutorialSeen: true };
  await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  await savePreferences(next);
  return next;
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

