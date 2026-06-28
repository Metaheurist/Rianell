import {
  normalizeCycleFields,
  normalizeSubEntries,
  normalizeMedicationDoses,
  normalizeVitalMetrics,
} from './logging/logSchema.mjs';
import { normalizeCustomMetricValues } from './charts/customMetrics.mjs';

export function identity(value) {
  return value;
}

export function readTextFileSync(fs, absPath) {
  return fs.readFileSync(absPath, 'utf8');
}

export function existsSync(fs, absPath) {
  return fs.existsSync(absPath);
}

export function getDefaultAccessibilitySettings() {
  return {
    textScale: 1,
    largeTextEnabled: false,
    ttsEnabled: false,
    ttsReadModeEnabled: false,
    plainLanguageEnabled: false,
    chartPaletteMode: 'standard',
    colorblindMode: 'none', // reserved
  };
}

export function normalizeAccessibilitySettings(value) {
  const d = getDefaultAccessibilitySettings();
  const v = value && typeof value === 'object' ? value : {};
  const textScaleRaw = typeof v.textScale === 'number' ? v.textScale : d.textScale;
  const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, textScaleRaw)) : d.textScale;
  const colorblindMode = typeof v.colorblindMode === 'string' ? v.colorblindMode : d.colorblindMode;
  const chartPaletteMode =
    v.chartPaletteMode === 'high-contrast' ? 'high-contrast' : d.chartPaletteMode;
  return {
    textScale,
    largeTextEnabled: v.largeTextEnabled === true,
    ttsEnabled: v.ttsEnabled === true,
    ttsReadModeEnabled: v.ttsReadModeEnabled === true,
    plainLanguageEnabled: v.plainLanguageEnabled === true,
    chartPaletteMode,
    colorblindMode,
  };
}

export const LOGS_STORAGE_KEY_V1 = 'healthLogs';
export const LOGS_STORAGE_KEY_MOBILE_LEGACY = 'rianell.logs.v1';
export const SETTINGS_STORAGE_KEY = 'rianellSettings';
export const GOALS_STORAGE_KEY = 'rianellGoals';
export const PREDICTION_STATE_KEY = 'rianellPredictionState';
export const PREFS_STORAGE_KEY_MOBILE = 'rianell.preferences.v1';
export const LOGS_BACKUP_KEY = 'healthLogs_backup';
export const OFFLINE_QUEUE_KEY = 'healthLogsOfflineQueue';

export const DEFAULT_GOALS = {
  steps: 10000,
  hydration: 9,
  sleep: 5,
  goodDaysPerWeek: 3,
};

export function normalizeGoals(value) {
  const d = DEFAULT_GOALS;
  const v = value && typeof value === 'object' ? value : {};
  return {
    steps: clampInt(v.steps, 0, 100000) ?? d.steps,
    hydration: clampInt(v.hydration, 0, 30) ?? d.hydration,
    sleep: clampInt(v.sleep, 0, 10) ?? d.sleep,
    goodDaysPerWeek: clampInt(v.goodDaysPerWeek, 0, 7) ?? d.goodDaysPerWeek,
  };
}

/** True when a saved goals object has at least one non-zero target. */
export function hasActiveGoals(value) {
  if (!value || typeof value !== 'object') return false;
  const steps = clampInt(value.steps, 0, 100000) ?? 0;
  const hydration = clampInt(value.hydration, 0, 30) ?? 0;
  const sleep = clampInt(value.sleep, 0, 10) ?? 0;
  const goodDays = clampInt(value.goodDaysPerWeek, 0, 7) ?? 0;
  return steps > 0 || hydration > 0 || sleep > 0 || goodDays > 0;
}

export function getDefaultAppSettingsFields() {
  return {
    userName: '',
    weightUnit: 'kg',
    medicalCondition: '',
    contributeAnonData: false,
    useOpenData: false,
    backup: true,
    compress: false,
    animations: true,
    lazy: true,
    aiModelDownloadConsent: 'deferred',
  };
}

export function normalizePreferencesPartial(value) {
  const d = getDefaultAppSettingsFields();
  const v = value && typeof value === 'object' ? value : {};
  const weightUnit = v.weightUnit === 'lb' ? 'lb' : 'kg';
  const consent = v.aiModelDownloadConsent;
  return {
    userName: typeof v.userName === 'string' ? v.userName.slice(0, 120) : d.userName,
    weightUnit,
    medicalCondition: typeof v.medicalCondition === 'string' ? v.medicalCondition.slice(0, 200) : d.medicalCondition,
    contributeAnonData: v.contributeAnonData === true,
    useOpenData: v.useOpenData === true,
    backup: v.backup !== false,
    compress: v.compress === true,
    animations: v.animations !== false,
    lazy: v.lazy !== false,
    lazyCharts: v.lazyCharts !== false,
    aiModelDownloadConsent:
      consent === 'granted' || consent === 'deferred' ? consent : d.aiModelDownloadConsent,
  };
}

/** Merge health logs by date; local entries override cloud for the same date. */
export function mergeHealthLogs(localLogs, cloudLogs) {
  const logsMap = new Map();
  if (Array.isArray(cloudLogs)) {
    cloudLogs.forEach((log) => {
      if (log && log.date) logsMap.set(log.date, log);
    });
  }
  if (Array.isArray(localLogs)) {
    localLogs.forEach((log) => {
      if (log && log.date) logsMap.set(log.date, log);
    });
  }
  const merged = Array.from(logsMap.values());
  merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return merged;
}

function clampInt(raw, min, max) {
  const n = typeof raw === 'number' ? raw : (typeof raw === 'string' ? parseInt(raw, 10) : NaN);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function clampFloat(raw, min, max) {
  const n = typeof raw === 'number' ? raw : (typeof raw === 'string' ? parseFloat(raw) : NaN);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(min, Math.min(max, n));
}

function normalizeString(raw, maxLen) {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (typeof maxLen === 'number') return s.slice(0, maxLen);
  return s;
}

function omitEmpty(obj) {
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v === undefined) delete obj[k];
    else if (typeof v === 'string' && v.trim() === '') delete obj[k];
    else if (Array.isArray(v) && v.length === 0) delete obj[k];
  });
  return obj;
}

export function normalizeLogEntry(value) {
  const v = value && typeof value === 'object' ? value : {};
  const date = typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : new Date().toISOString().slice(0, 10);

  const entry = {
    date,
    bpm: clampInt(v.bpm, 30, 120),
    weight: typeof v.weight === 'string' ? v.weight : (typeof v.weight === 'number' ? v.weight.toFixed(1) : undefined), // stored as kg string (web)
    fatigue: clampInt(v.fatigue, 0, 10),
    stiffness: clampInt(v.stiffness, 0, 10),
    sleep: clampInt(v.sleep, 0, 10),
    jointPain: clampInt(v.jointPain, 0, 10),
    mobility: clampInt(v.mobility, 0, 10),
    dailyFunction: clampInt(v.dailyFunction, 0, 10),
    swelling: clampInt(v.swelling, 0, 10),
    flare: v.flare === 'Yes' ? 'Yes' : (v.flare === 'No' ? 'No' : 'No'),
    mood: clampInt(v.mood, 0, 10),
    irritability: clampInt(v.irritability, 0, 10),
    notes: normalizeString(v.notes, 500),

    food: v.food && typeof v.food === 'object' ? v.food : undefined,
    exercise: Array.isArray(v.exercise) ? v.exercise : undefined,

    energyClarity: normalizeString(v.energyClarity, 80),
    stressors: Array.isArray(v.stressors) ? v.stressors.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, 50) : undefined,
    symptoms: Array.isArray(v.symptoms) ? v.symptoms.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, 80) : undefined,
    weatherSensitivity: clampInt(v.weatherSensitivity, 0, 10),
    painLocation: normalizeString(v.painLocation, 150),
    steps: typeof v.steps === 'number' ? v.steps : (typeof v.steps === 'string' ? parseInt(v.steps, 10) : undefined),
    hydration: typeof v.hydration === 'number' ? v.hydration : (typeof v.hydration === 'string' ? parseFloat(v.hydration) : undefined),
    medications: Array.isArray(v.medications) ? v.medications : undefined,
    subEntries: normalizeSubEntries(v.subEntries),
    cycle: normalizeCycleFields(v.cycle),
    medicationDoses: normalizeMedicationDoses(v.medicationDoses),
    savedAt: typeof v.savedAt === 'string' ? v.savedAt.slice(0, 40) : undefined,
    barcodeFood: typeof v.barcodeFood === 'string' ? v.barcodeFood.slice(0, 200) : undefined,
    customMetrics: normalizeCustomMetricValues(v.customMetrics),
    ...normalizeVitalMetrics(v),
  };

  if (entry.steps != null && !Number.isFinite(entry.steps)) entry.steps = undefined;
  if (entry.hydration != null && !Number.isFinite(entry.hydration)) entry.hydration = undefined;

  return omitEmpty(entry);
}

export * from './privacy/index.mjs';
export * from './i18n/index.mjs';
export * from './settings/index.mjs';
export * from './logging/index.mjs';
export * from './notifications/index.mjs';
export * from './home/index.mjs';
export * from './export/logCsv.mjs';
export * from './export/fhirLite.mjs';
export * from './export/shareReadOnlyLink.mjs';
export * from './export/webdavBackup.mjs';
export * from './import/migrationAssistants.mjs';
export * from './sync/logSyncConflicts.mjs';
export * from './charts/customMetrics.mjs';
export * from './clinician/index.mjs';
export * from './research/index.mjs';
export * from './crossCutting/index.mjs';
export * from './mood/index.mjs';
export * from './analytics/index.mjs';
export * from './onboarding/index.mjs';
export * from './achievements/achievements.mjs';
export * from './achievements/achievementUnlockNotification.mjs';
export * from './achievements/achievementToastQueue.mjs';
export * from './crypto/keyManagement.mjs';
export * from './nutrition/index.mjs';
export * from './api/index.mjs';
export * from './connectors/index.mjs';
export * from './fhir/index.mjs';
export * from './community/index.mjs';
export * from './metrics/sliderWellness.mjs';
export * from './a11y/wcagHelpers.mjs';
export * from './crypto/secureStorage.mjs';

export function createSampleLogEntry() {
  return normalizeLogEntry({
    date: new Date().toISOString().slice(0, 10),
    flare: 'No',
    bpm: 72,
    weight: '75.0',
    sleep: 8,
    mood: 8,
    fatigue: 4,
    steps: 7500,
    hydration: 8,
    notes: 'Sample entry',
    food: { breakfast: [], lunch: [], dinner: [], snack: [] },
    exercise: [{ name: 'Walking', duration: 20 }],
  });
}

