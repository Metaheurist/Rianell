/** Plan 04 + Plan 16 — extended log entry fields. */

import { CYCLE_DAY_MAX } from './cycleTracking.mjs';

const SUB_ENTRY_PERIODS = new Set(['AM', 'midday', 'PM', 'partial']);
const PAIN_REGIONS = new Set([
  'head', 'neck', 'shoulders-L', 'shoulders-R', 'chest', 'upper-back', 'lower-back', 'abdomen',
  'hips', 'knees-L', 'knees-R', 'ankles-L', 'ankles-R', 'hands-L', 'hands-R',
]);
const COMMON_SUPPLEMENTS = new Set([
  'Vitamin D', 'Magnesium', 'Omega-3', 'Zinc', 'B12', 'Iron', 'Melatonin', 'Probiotics', 'Ashwagandha', 'CoQ10',
]);

function clampInt(raw, min, max) {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return undefined;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampFloat(raw, min, max, decimals = 1) {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.max(min, Math.min(max, n));
  return Number(clamped.toFixed(decimals));
}

function normalizeString(raw, maxLen) {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (typeof maxLen === 'number') return s.slice(0, maxLen);
  return s;
}

export function mmolToMgdl(mmol) {
  return Number((mmol * 18.02).toFixed(1));
}

export function mgdlToMmol(mgdl) {
  return Number((mgdl / 18.02).toFixed(2));
}

export function lbsToKg(lbs) {
  return Number((lbs * 0.453592).toFixed(2));
}

export function kgToLbs(kg) {
  return Number((kg / 0.453592).toFixed(1));
}

export function computeBmiKg(weightKg, heightCm) {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) return undefined;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function normalizePainLocation(value) {
  const v = value && typeof value === 'object' ? value : {};
  const region = typeof v.region === 'string' && PAIN_REGIONS.has(v.region) ? v.region : undefined;
  const intensity = clampInt(v.intensity, 0, 10);
  if (!region) return undefined;
  return { region, intensity: intensity ?? 0 };
}

export function normalizePainLocations(raw) {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((x) => normalizePainLocation(x)).filter(Boolean);
  return items.length ? items.slice(0, 15) : undefined;
}

export function normalizeSupplementEntry(value) {
  const v = value && typeof value === 'object' ? value : {};
  const name = normalizeString(v.name, 120);
  if (!name) return undefined;
  return {
    name,
    dose: normalizeString(v.dose, 40),
    unit: normalizeString(v.unit, 20),
    brand: normalizeString(v.brand, 80),
  };
}

export function normalizeSupplements(raw) {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((x) => normalizeSupplementEntry(x)).filter(Boolean);
  return items.length ? items.slice(0, 20) : undefined;
}

export function normalizePhotoAttachment(value) {
  const v = value && typeof value === 'object' ? value : {};
  const url = normalizeString(v.url, 500);
  if (!url || (!/^https?:\/\//i.test(url) && !/^health-photos\//i.test(url))) return undefined;
  return { url, caption: normalizeString(v.caption, 200) };
}

export function normalizePhotoAttachments(raw) {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((x) => normalizePhotoAttachment(x)).filter(Boolean);
  return items.length ? items.slice(0, 6) : undefined;
}

export function normalizeBloodGlucose(value, unitPref) {
  const v = value && typeof value === 'object' ? value : { value };
  const raw = typeof v === 'number' ? v : v.value ?? v.bloodGlucose;
  const unit = v.unit === 'mgdl' || v.bloodGlucoseUnit === 'mgdl' || unitPref === 'mgdl' ? 'mgdl' : 'mmol';
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw || ''));
  if (!Number.isFinite(n)) return undefined;
  const mmol = unit === 'mgdl' ? mgdlToMmol(n) : clampFloat(n, 1, 35, 2);
  if (mmol === undefined) return undefined;
  return { bloodGlucose: mmol, bloodGlucoseUnit: 'mmol' };
}

export function normalizeBodyWeight(value, unitPref) {
  const v = value && typeof value === 'object' ? value : { value };
  const raw = typeof v === 'number' ? v : v.value ?? v.bodyWeight;
  const unit = v.unit === 'lbs' || v.bodyWeightUnit === 'lbs' || unitPref === 'lbs' ? 'lbs' : 'kg';
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw || ''));
  if (!Number.isFinite(n)) return undefined;
  const kg = unit === 'lbs' ? lbsToKg(n) : clampFloat(n, 20, 300, 2);
  if (kg === undefined) return undefined;
  return { bodyWeight: kg, bodyWeightUnit: 'kg' };
}

export const LEGACY_BODY_REGION_TO_PAIN_LOCATION = {
  head: 'head',
  neck: 'neck',
  left_shoulder: 'shoulders-L',
  right_shoulder: 'shoulders-R',
  chest: 'chest',
  abdomen: 'abdomen',
  left_hip: 'hips',
  right_hip: 'hips',
  left_knee: 'knees-L',
  right_knee: 'knees-R',
  left_ankle: 'ankles-L',
  right_ankle: 'ankles-R',
  left_hand: 'hands-L',
  right_hand: 'hands-R',
  left_upper_arm: 'upper-back',
  right_upper_arm: 'upper-back',
  left_lower_leg: 'lower-back',
  right_lower_leg: 'lower-back',
};

export function painBodyStateToLocations(state, intensityMap = { 1: 4, 2: 8 }) {
  if (!state || typeof state !== 'object') return undefined;
  const items = [];
  Object.keys(state).forEach((legacyId) => {
    const level = state[legacyId];
    if (!level) return;
    const region = LEGACY_BODY_REGION_TO_PAIN_LOCATION[legacyId];
    if (!region) return;
    const intensity = intensityMap[level] ?? clampInt(level, 0, 10) ?? 0;
    const existing = items.find((x) => x.region === region);
    if (existing) existing.intensity = Math.max(existing.intensity, intensity);
    else items.push({ region, intensity });
  });
  return normalizePainLocations(items);
}

function normalizeBbtCelsius(raw, unitPref) {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  if (!Number.isFinite(n)) return undefined;
  const celsius = unitPref === 'fahrenheit' ? ((n - 32) * 5) / 9 : n;
  return clampFloat(celsius, 35, 38.5, 2);
}

export function normalizeVitalMetrics(value, options = {}) {
  const v = value && typeof value === 'object' ? value : {};
  const glucose = normalizeBloodGlucose(
    { value: v.bloodGlucose, unit: v.bloodGlucoseUnit },
    options.glucoseUnit,
  );
  const weight = normalizeBodyWeight(
    {
      value: v.bodyWeight ?? (v.weight != null ? parseFloat(String(v.weight)) : undefined),
      unit: v.bodyWeightUnit,
    },
    options.weightUnit,
  );
  const bristolRaw = typeof v.bristol === 'number' ? v.bristol : parseInt(String(v.bristol ?? ''), 10);
  const bristol = Number.isFinite(bristolRaw) && bristolRaw >= 1 && bristolRaw <= 7 ? bristolRaw : undefined;
  const tempUnit = v.bbtUnit === 'fahrenheit' || options.temperatureUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  const out = {
    bloodPressureSystolic: clampInt(v.bloodPressureSystolic, 60, 250),
    bloodPressureDiastolic: clampInt(v.bloodPressureDiastolic, 40, 150),
    bloodGlucose: glucose?.bloodGlucose,
    bloodGlucoseUnit: glucose?.bloodGlucoseUnit,
    spO2: clampInt(v.spO2, 70, 100),
    hrv: clampInt(v.hrv, 0, 300),
    bodyWeight: weight?.bodyWeight,
    bodyWeightUnit: weight?.bodyWeightUnit,
    bristol,
    painLocations: normalizePainLocations(v.painLocations),
    gratitude: normalizeString(v.gratitude, 500),
    bbt: normalizeBbtCelsius(v.bbt, tempUnit),
    photoAttachments: normalizePhotoAttachments(v.photoAttachments),
    supplements: normalizeSupplements(v.supplements),
  };
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined || (Array.isArray(out[k]) && out[k].length === 0)) delete out[k];
  });
  return Object.keys(out).length ? out : undefined;
}

export { COMMON_SUPPLEMENTS, PAIN_REGIONS };

export function normalizeCycleFields(value) {
  const v = value && typeof value === 'object' ? value : {};
  const phase =
    v.phase === 'menstrual' || v.phase === 'follicular' || v.phase === 'ovulation' || v.phase === 'luteal'
      ? v.phase
      : undefined;
  const flow = v.flow === 'none' || v.flow === 'light' || v.flow === 'medium' || v.flow === 'heavy' ? v.flow : undefined;
  const cycleDay = clampInt(v.cycleDay, 1, CYCLE_DAY_MAX);
  const periodStart = v.periodStart === true ? true : undefined;
  const pmsSymptoms = Array.isArray(v.pmsSymptoms)
    ? v.pmsSymptoms.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, 20)
    : undefined;
  const out = { cycleDay, periodStart, phase, flow, pmsSymptoms };
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined || (Array.isArray(out[k]) && out[k].length === 0)) delete out[k];
  });
  return Object.keys(out).length ? out : undefined;
}

export function normalizeSubEntry(value) {
  const v = value && typeof value === 'object' ? value : {};
  const period = SUB_ENTRY_PERIODS.has(v.period) ? v.period : 'partial';
  const id = typeof v.id === 'string' && v.id.trim() ? v.id.trim().slice(0, 40) : `${period}-${Date.now()}`;
  const entry = {
    id,
    period,
    mood: clampInt(v.mood, 0, 10),
    fatigue: clampInt(v.fatigue, 0, 10),
    sleep: clampInt(v.sleep, 0, 10),
    jointPain: clampInt(v.jointPain, 0, 10),
    notes: normalizeString(v.notes, 500),
    savedAt: typeof v.savedAt === 'string' ? v.savedAt : new Date().toISOString(),
  };
  Object.keys(entry).forEach((k) => {
    if (entry[k] === undefined) delete entry[k];
  });
  return entry;
}

export function normalizeSubEntries(raw) {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((x) => normalizeSubEntry(x)).filter((x) => Object.keys(x).length > 1);
  return items.length ? items.slice(0, 8) : undefined;
}

export function normalizeMedicationDose(value) {
  const v = value && typeof value === 'object' ? value : {};
  const status = v.status === 'taken' || v.status === 'skipped' || v.status === 'missed' ? v.status : undefined;
  const drug = normalizeString(v.drug, 120);
  const scheduledAt = typeof v.scheduledAt === 'string' ? v.scheduledAt.slice(0, 40) : undefined;
  if (!drug && !status) return undefined;
  return { drug: drug || 'Medication', status: status || 'taken', scheduledAt };
}

export function normalizeMedicationDoses(raw) {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((x) => normalizeMedicationDose(x)).filter(Boolean);
  return items.length ? items.slice(0, 24) : undefined;
}

export function mergeLogEntriesForDate(existing, incoming) {
  const base = { ...existing, ...incoming, date: existing.date || incoming.date };
  const subA = normalizeSubEntries(existing.subEntries) || [];
  const subB = normalizeSubEntries(incoming.subEntries) || [];
  if (subA.length || subB.length) {
    const byId = new Map();
    [...subA, ...subB].forEach((s) => byId.set(s.id, s));
    base.subEntries = [...byId.values()];
  }
  if (incoming.cycle) base.cycle = normalizeCycleFields(incoming.cycle) || base.cycle;
  if (incoming.medicationDoses) {
    const doses = normalizeMedicationDoses([...(normalizeMedicationDoses(existing.medicationDoses) || []), ...(normalizeMedicationDoses(incoming.medicationDoses) || [])]);
    if (doses) base.medicationDoses = doses;
  }
  return base;
}
