import { kgToLbs, lbsToKg, mgdlToMmol, mmolToMgdl } from './logSchema.mjs';

export const VITAL_SUGGESTION_LOOKBACK_DAYS = 90;

export const VITAL_SUGGESTION_FIELD_IDS = [
  'bpm',
  'weight',
  'bloodPressure',
  'bloodGlucose',
  'spO2',
  'hrv',
  'bodyWeight',
];

function parsePositiveNumber(raw) {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePositiveInt(raw) {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function daysBetween(fromIso, toIso) {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso + 'T12:00:00');
  const to = new Date(toIso + 'T12:00:00');
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function sortLogsDesc(logs) {
  return [...(logs || [])]
    .filter((log) => log && typeof log.date === 'string' && log.date)
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

function logHasVitalField(log, fieldId) {
  switch (fieldId) {
    case 'bpm':
      return parsePositiveInt(log.bpm) != null;
    case 'weight':
      return parsePositiveNumber(log.weight) != null;
    case 'bloodPressure':
      return parsePositiveInt(log.bloodPressureSystolic) != null && parsePositiveInt(log.bloodPressureDiastolic) != null;
    case 'bloodGlucose':
      return parsePositiveNumber(log.bloodGlucose) != null;
    case 'spO2':
      return parsePositiveInt(log.spO2) != null;
    case 'hrv':
      return parsePositiveInt(log.hrv) != null;
    case 'bodyWeight':
      return parsePositiveNumber(log.bodyWeight) != null;
    default:
      return false;
  }
}

function extractVitalValues(log, fieldId, unitPrefs = {}) {
  switch (fieldId) {
    case 'bpm': {
      const bpm = parsePositiveInt(log.bpm);
      return bpm != null ? { bpm } : null;
    }
    case 'weight': {
      const kg = parsePositiveNumber(log.weight);
      if (kg == null) return null;
      const unit = unitPrefs.weightUnit === 'lb' ? 'lb' : 'kg';
      const value = unit === 'lb' ? kgToLbs(kg) : kg;
      return { weight: Number(value.toFixed(1)), weightUnit: unit };
    }
    case 'bloodPressure': {
      const systolic = parsePositiveInt(log.bloodPressureSystolic);
      const diastolic = parsePositiveInt(log.bloodPressureDiastolic);
      if (systolic == null || diastolic == null) return null;
      return { bloodPressureSystolic: systolic, bloodPressureDiastolic: diastolic };
    }
    case 'bloodGlucose': {
      const raw = parsePositiveNumber(log.bloodGlucose);
      if (raw == null) return null;
      const storedUnit = log.bloodGlucoseUnit === 'mgdl' ? 'mgdl' : 'mmol';
      const targetUnit = unitPrefs.glucoseUnit === 'mgdl' ? 'mgdl' : 'mmol';
      let mmol = storedUnit === 'mgdl' ? mgdlToMmol(raw) : raw;
      if (mmol == null) return null;
      const value = targetUnit === 'mgdl' ? mmolToMgdl(mmol) : mmol;
      if (value == null) return null;
      return {
        bloodGlucose: Number(Number(value).toFixed(targetUnit === 'mgdl' ? 0 : 1)),
        bloodGlucoseUnit: targetUnit,
      };
    }
    case 'spO2': {
      const spO2 = parsePositiveInt(log.spO2);
      return spO2 != null ? { spO2 } : null;
    }
    case 'hrv': {
      const hrv = parsePositiveInt(log.hrv);
      return hrv != null ? { hrv } : null;
    }
    case 'bodyWeight': {
      const raw = parsePositiveNumber(log.bodyWeight);
      if (raw == null) return null;
      const storedUnit = log.bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
      const targetUnit = unitPrefs.bodyWeightUnit === 'lbs' ? 'lbs' : 'kg';
      let kg = storedUnit === 'lbs' ? lbsToKg(raw) : raw;
      if (kg == null) return null;
      const value = targetUnit === 'lbs' ? kgToLbs(kg) : kg;
      if (value == null) return null;
      return { bodyWeight: Number(Number(value).toFixed(1)), bodyWeightUnit: targetUnit };
    }
    default:
      return null;
  }
}

export function formatVitalSuggestionDisplay(fieldId, values, unitPrefs = {}) {
  if (!values) return '';
  switch (fieldId) {
    case 'bpm':
      return `${values.bpm} bpm`;
    case 'weight':
      return `${values.weight} ${values.weightUnit || unitPrefs.weightUnit || 'kg'}`;
    case 'bloodPressure':
      return `${values.bloodPressureSystolic}/${values.bloodPressureDiastolic} mmHg`;
    case 'bloodGlucose':
      return `${values.bloodGlucose} ${values.bloodGlucoseUnit === 'mgdl' ? 'mg/dL' : 'mmol/L'}`;
    case 'spO2':
      return `${values.spO2}%`;
    case 'hrv':
      return `${values.hrv} ms`;
    case 'bodyWeight':
      return `${values.bodyWeight} ${values.bodyWeightUnit === 'lbs' ? 'lb' : 'kg'}`;
    default:
      return '';
  }
}

export function findLatestVitalSuggestion(logs, fieldId, targetDateIso, options = {}) {
  if (!fieldId || !VITAL_SUGGESTION_FIELD_IDS.includes(fieldId)) return null;
  const lookbackDays = options.lookbackDays ?? VITAL_SUGGESTION_LOOKBACK_DAYS;
  const excludeSameDate = options.excludeSameDate !== false;
  const unitPrefs = options.unitPrefs && typeof options.unitPrefs === 'object' ? options.unitPrefs : {};

  for (const log of sortLogsDesc(logs)) {
    if (!log.date) continue;
    if (targetDateIso && log.date >= targetDateIso) continue;
    if (excludeSameDate && targetDateIso && log.date === targetDateIso) continue;
    if (lookbackDays != null && targetDateIso) {
      const age = daysBetween(log.date, targetDateIso);
      if (age == null || age > lookbackDays) continue;
    }
    if (!logHasVitalField(log, fieldId)) continue;
    const values = extractVitalValues(log, fieldId, unitPrefs);
    if (!values) continue;
    return {
      fieldId,
      fromDate: log.date,
      values,
      displayValue: formatVitalSuggestionDisplay(fieldId, values, unitPrefs),
    };
  }
  return null;
}

export function buildVitalSuggestions(logs, targetDateIso, options = {}) {
  const out = {};
  VITAL_SUGGESTION_FIELD_IDS.forEach((fieldId) => {
    const row = findLatestVitalSuggestion(logs, fieldId, targetDateIso, options);
    if (row) out[fieldId] = row;
  });
  return out;
}
