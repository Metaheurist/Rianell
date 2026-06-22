/** Plan 04 — extended log entry fields (L7 cycle, L8 sub-entries, L3 med doses). */

import { CYCLE_DAY_MAX } from './cycleTracking.mjs';

const SUB_ENTRY_PERIODS = new Set(['AM', 'midday', 'PM', 'partial']);

function clampInt(raw, min, max) {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return undefined;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizeString(raw, maxLen) {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (typeof maxLen === 'number') return s.slice(0, maxLen);
  return s;
}

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
