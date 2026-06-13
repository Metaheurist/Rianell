var RianellShared = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/shared/src/index.mjs
  var index_exports = {};
  __export(index_exports, {
    DEFAULT_GOALS: () => DEFAULT_GOALS,
    GOALS_STORAGE_KEY: () => GOALS_STORAGE_KEY,
    LOGS_BACKUP_KEY: () => LOGS_BACKUP_KEY,
    LOGS_STORAGE_KEY_MOBILE_LEGACY: () => LOGS_STORAGE_KEY_MOBILE_LEGACY,
    LOGS_STORAGE_KEY_V1: () => LOGS_STORAGE_KEY_V1,
    OFFLINE_QUEUE_KEY: () => OFFLINE_QUEUE_KEY,
    PREDICTION_STATE_KEY: () => PREDICTION_STATE_KEY,
    PREFS_STORAGE_KEY_MOBILE: () => PREFS_STORAGE_KEY_MOBILE,
    SETTINGS_STORAGE_KEY: () => SETTINGS_STORAGE_KEY,
    createSampleLogEntry: () => createSampleLogEntry,
    existsSync: () => existsSync,
    getDefaultAccessibilitySettings: () => getDefaultAccessibilitySettings,
    getDefaultAppSettingsFields: () => getDefaultAppSettingsFields,
    identity: () => identity,
    mergeHealthLogs: () => mergeHealthLogs,
    normalizeAccessibilitySettings: () => normalizeAccessibilitySettings,
    normalizeGoals: () => normalizeGoals,
    normalizeLogEntry: () => normalizeLogEntry,
    normalizePreferencesPartial: () => normalizePreferencesPartial,
    readTextFileSync: () => readTextFileSync
  });
  function identity(value) {
    return value;
  }
  function readTextFileSync(fs, absPath) {
    return fs.readFileSync(absPath, "utf8");
  }
  function existsSync(fs, absPath) {
    return fs.existsSync(absPath);
  }
  function getDefaultAccessibilitySettings() {
    return {
      textScale: 1,
      largeTextEnabled: false,
      ttsEnabled: false,
      ttsReadModeEnabled: false,
      colorblindMode: "none"
      // reserved
    };
  }
  function normalizeAccessibilitySettings(value) {
    const d = getDefaultAccessibilitySettings();
    const v = value && typeof value === "object" ? value : {};
    const textScaleRaw = typeof v.textScale === "number" ? v.textScale : d.textScale;
    const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, textScaleRaw)) : d.textScale;
    const colorblindMode = typeof v.colorblindMode === "string" ? v.colorblindMode : d.colorblindMode;
    return {
      textScale,
      largeTextEnabled: v.largeTextEnabled === true,
      ttsEnabled: v.ttsEnabled === true,
      ttsReadModeEnabled: v.ttsReadModeEnabled === true,
      colorblindMode
    };
  }
  var LOGS_STORAGE_KEY_V1 = "healthLogs";
  var LOGS_STORAGE_KEY_MOBILE_LEGACY = "rianell.logs.v1";
  var SETTINGS_STORAGE_KEY = "rianellSettings";
  var GOALS_STORAGE_KEY = "rianellGoals";
  var PREDICTION_STATE_KEY = "rianellPredictionState";
  var PREFS_STORAGE_KEY_MOBILE = "rianell.preferences.v1";
  var LOGS_BACKUP_KEY = "healthLogs_backup";
  var OFFLINE_QUEUE_KEY = "healthLogsOfflineQueue";
  var DEFAULT_GOALS = {
    steps: 1e4,
    hydration: 9,
    sleep: 5,
    goodDaysPerWeek: 3
  };
  function normalizeGoals(value) {
    const d = DEFAULT_GOALS;
    const v = value && typeof value === "object" ? value : {};
    return {
      steps: clampInt(v.steps, 0, 1e5) ?? d.steps,
      hydration: clampInt(v.hydration, 0, 30) ?? d.hydration,
      sleep: clampInt(v.sleep, 0, 10) ?? d.sleep,
      goodDaysPerWeek: clampInt(v.goodDaysPerWeek, 0, 7) ?? d.goodDaysPerWeek
    };
  }
  function getDefaultAppSettingsFields() {
    return {
      userName: "",
      weightUnit: "kg",
      medicalCondition: "",
      contributeAnonData: false,
      useOpenData: false,
      backup: true,
      compress: false,
      animations: true,
      lazy: true,
      aiModelDownloadConsent: "deferred"
    };
  }
  function normalizePreferencesPartial(value) {
    const d = getDefaultAppSettingsFields();
    const v = value && typeof value === "object" ? value : {};
    const weightUnit = v.weightUnit === "lb" ? "lb" : "kg";
    const consent = v.aiModelDownloadConsent;
    return {
      userName: typeof v.userName === "string" ? v.userName.slice(0, 120) : d.userName,
      weightUnit,
      medicalCondition: typeof v.medicalCondition === "string" ? v.medicalCondition.slice(0, 200) : d.medicalCondition,
      contributeAnonData: v.contributeAnonData === true,
      useOpenData: v.useOpenData === true,
      backup: v.backup !== false,
      compress: v.compress === true,
      animations: v.animations !== false,
      lazy: v.lazy !== false,
      lazyCharts: v.lazyCharts !== false,
      aiModelDownloadConsent: consent === "granted" || consent === "deferred" ? consent : d.aiModelDownloadConsent
    };
  }
  function mergeHealthLogs(localLogs, cloudLogs) {
    const logsMap = /* @__PURE__ */ new Map();
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
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n)) return void 0;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }
  function normalizeString(raw, maxLen) {
    if (typeof raw !== "string") return void 0;
    const s = raw.trim();
    if (!s) return void 0;
    if (typeof maxLen === "number") return s.slice(0, maxLen);
    return s;
  }
  function omitEmpty(obj) {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v === void 0) delete obj[k];
      else if (typeof v === "string" && v.trim() === "") delete obj[k];
      else if (Array.isArray(v) && v.length === 0) delete obj[k];
    });
    return obj;
  }
  function normalizeLogEntry(value) {
    const v = value && typeof value === "object" ? value : {};
    const date = typeof v.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const entry = {
      date,
      bpm: clampInt(v.bpm, 30, 120),
      weight: typeof v.weight === "string" ? v.weight : typeof v.weight === "number" ? v.weight.toFixed(1) : void 0,
      // stored as kg string (web)
      fatigue: clampInt(v.fatigue, 0, 10),
      stiffness: clampInt(v.stiffness, 0, 10),
      sleep: clampInt(v.sleep, 0, 10),
      jointPain: clampInt(v.jointPain, 0, 10),
      mobility: clampInt(v.mobility, 0, 10),
      dailyFunction: clampInt(v.dailyFunction, 0, 10),
      swelling: clampInt(v.swelling, 0, 10),
      flare: v.flare === "Yes" ? "Yes" : v.flare === "No" ? "No" : "No",
      mood: clampInt(v.mood, 0, 10),
      irritability: clampInt(v.irritability, 0, 10),
      notes: normalizeString(v.notes, 500),
      food: v.food && typeof v.food === "object" ? v.food : void 0,
      exercise: Array.isArray(v.exercise) ? v.exercise : void 0,
      energyClarity: normalizeString(v.energyClarity, 80),
      stressors: Array.isArray(v.stressors) ? v.stressors.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 50) : void 0,
      symptoms: Array.isArray(v.symptoms) ? v.symptoms.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 80) : void 0,
      weatherSensitivity: clampInt(v.weatherSensitivity, 1, 10),
      painLocation: normalizeString(v.painLocation, 150),
      steps: typeof v.steps === "number" ? v.steps : typeof v.steps === "string" ? parseInt(v.steps, 10) : void 0,
      hydration: typeof v.hydration === "number" ? v.hydration : typeof v.hydration === "string" ? parseFloat(v.hydration) : void 0,
      medications: Array.isArray(v.medications) ? v.medications : void 0
    };
    if (entry.steps != null && !Number.isFinite(entry.steps)) entry.steps = void 0;
    if (entry.hydration != null && !Number.isFinite(entry.hydration)) entry.hydration = void 0;
    return omitEmpty(entry);
  }
  function createSampleLogEntry() {
    return normalizeLogEntry({
      date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      flare: "No",
      bpm: 72,
      weight: "75.0",
      sleep: 8,
      mood: 8,
      fatigue: 4,
      steps: 7500,
      hydration: 8,
      notes: "Sample entry",
      food: { breakfast: [], lunch: [], dinner: [], snack: [] },
      exercise: [{ name: "Walking", duration: 20 }]
    });
  }
  return __toCommonJS(index_exports);
})();
