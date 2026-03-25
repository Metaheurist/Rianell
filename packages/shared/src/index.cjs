function identity(value) {
  return value;
}

function readTextFileSync(fs, absPath) {
  return fs.readFileSync(absPath, 'utf8');
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
    colorblindMode: 'none',
  };
}

function normalizeAccessibilitySettings(value) {
  const d = getDefaultAccessibilitySettings();
  const v = value && typeof value === 'object' ? value : {};
  const textScaleRaw = typeof v.textScale === 'number' ? v.textScale : d.textScale;
  const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, textScaleRaw)) : d.textScale;
  const colorblindMode = typeof v.colorblindMode === 'string' ? v.colorblindMode : d.colorblindMode;
  return {
    textScale,
    largeTextEnabled: v.largeTextEnabled === true,
    ttsEnabled: v.ttsEnabled === true,
    ttsReadModeEnabled: v.ttsReadModeEnabled === true,
    colorblindMode,
  };
}

module.exports = {
  identity,
  readTextFileSync,
  existsSync,
  getDefaultAccessibilitySettings,
  normalizeAccessibilitySettings,
  LOGS_STORAGE_KEY_V1: 'healthLogs',
  LOGS_STORAGE_KEY_MOBILE_LEGACY: 'rianell.logs.v1',
  normalizeLogEntry: function normalizeLogEntry(value) {
    const v = value && typeof value === 'object' ? value : {};

    function clampInt(raw, min, max) {
      const n = typeof raw === 'number' ? raw : (typeof raw === 'string' ? parseInt(raw, 10) : NaN);
      if (!Number.isFinite(n)) return undefined;
      return Math.max(min, Math.min(max, Math.trunc(n)));
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
        const val = obj[k];
        if (val === undefined) delete obj[k];
        else if (typeof val === 'string' && val.trim() === '') delete obj[k];
        else if (Array.isArray(val) && val.length === 0) delete obj[k];
      });
      return obj;
    }

    const date =
      typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : new Date().toISOString().slice(0, 10);

    const entry = {
      date,
      bpm: clampInt(v.bpm, 30, 120),
      weight: typeof v.weight === 'string' ? v.weight : (typeof v.weight === 'number' ? v.weight.toFixed(1) : undefined),
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
      weatherSensitivity: clampInt(v.weatherSensitivity, 1, 10),
      painLocation: normalizeString(v.painLocation, 150),
      steps: typeof v.steps === 'number' ? v.steps : (typeof v.steps === 'string' ? parseInt(v.steps, 10) : undefined),
      hydration: typeof v.hydration === 'number' ? v.hydration : (typeof v.hydration === 'string' ? parseFloat(v.hydration) : undefined),
      medications: Array.isArray(v.medications) ? v.medications : undefined,
    };

    if (entry.steps != null && !Number.isFinite(entry.steps)) entry.steps = undefined;
    if (entry.hydration != null && !Number.isFinite(entry.hydration)) entry.hydration = undefined;

    return omitEmpty(entry);
  },
  createSampleLogEntry: function createSampleLogEntry() {
    return module.exports.normalizeLogEntry({
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
  },
};

