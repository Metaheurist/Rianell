import { filterLogsByRange } from './summarize.mjs';
import { compareTreatmentWindows } from './treatmentTimeline.mjs';
import {
  customMetricFieldKey,
  isCustomMetricField,
  readCustomMetricRadarValue,
} from '@rianell/shared';

const METRIC_PAIRS = [
  { metric1: 'mood', metric2: 'sleep', label1: 'Mood', label2: 'Sleep' },
  { metric1: 'sleep', metric2: 'fatigue', label1: 'Sleep', label2: 'Fatigue' },
  { metric1: 'mood', metric2: 'fatigue', label1: 'Mood', label2: 'Fatigue' },
];

const TRACKED_METRICS = [
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'fatigue', label: 'Fatigue' },
];

function pearson(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  const avgX = xs.reduce((a, b) => a + b, 0) / n;
  const avgY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - avgX;
    const dy = ys[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** @param {number} coef */
export function correlationConfidenceLevel(coef) {
  const abs = Math.abs(coef);
  if (abs >= 0.7) return 'high';
  if (abs >= 0.5) return 'medium';
  if (abs >= 0.35) return 'low';
  return null;
}

/**
 * Plan 09 C1 — structured correlation cards from deterministic pearson pairs (A3/summary parity).
 * @param {Array<Record<string, unknown>>} logs
 * @param {14|30|90|'all'|number} [range]
 */
export function buildCorrelationCards(logs, range = 30) {
  const selected = filterLogsByRange(logs, range);
  const cards = [];
  for (const pair of METRIC_PAIRS) {
    const rows = selected.filter(
      (x) => x[pair.metric1] != null && x[pair.metric2] != null,
    );
    if (rows.length < 3) continue;
    const coef = pearson(
      rows.map((r) => Number(r[pair.metric1])),
      rows.map((r) => Number(r[pair.metric2])),
    );
    if (coef == null) continue;
    const confidence = correlationConfidenceLevel(coef);
    if (!confidence) continue;
    const direction = coef > 0 ? 'positive' : 'negative';
    cards.push({
      id: `${pair.metric1}_${pair.metric2}`,
      metric1: pair.metric1,
      metric2: pair.metric2,
      label1: pair.label1,
      label2: pair.label2,
      coefficient: Number(coef.toFixed(2)),
      confidence,
      direction,
      sampleSize: rows.length,
    });
  }
  return cards.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

function byDateAsc(a, b) {
  return String(a.date).localeCompare(String(b.date));
}

/**
 * Plan 09 C2 — 7-day before/after flare post-mortem with diverging wellness metrics.
 * @param {Array<Record<string, unknown>>} logs
 * @param {{ windowDays?: number, minDelta?: number, flareDate?: string }} [options]
 */
export function buildFlarePostMortem(logs, options = {}) {
  const windowDays = options.windowDays ?? 7;
  const minDelta = options.minDelta ?? 0.75;
  const sorted = [...(Array.isArray(logs) ? logs : [])].sort(byDateAsc);
  if (!sorted.length) return null;

  let flareIndex = -1;
  if (options.flareDate) {
    flareIndex = sorted.findIndex((l) => l.date === options.flareDate && l.flare === 'Yes');
  }
  if (flareIndex < 0) {
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      if (sorted[i].flare === 'Yes') {
        flareIndex = i;
        break;
      }
    }
  }
  if (flareIndex < 0) return null;

  const flareDate = sorted[flareIndex].date;
  const before = sorted.slice(Math.max(0, flareIndex - windowDays), flareIndex);
  const after = sorted.slice(flareIndex + 1, flareIndex + 1 + windowDays);

  const metrics = TRACKED_METRICS.map(({ key, label }) => {
    const beforeVals = before
      .map((l) => l[key])
      .filter((v) => typeof v === 'number' && Number.isFinite(v));
    const afterVals = after
      .map((l) => l[key])
      .filter((v) => typeof v === 'number' && Number.isFinite(v));
    const beforeAvg = mean(beforeVals);
    const afterAvg = mean(afterVals);
    const delta =
      beforeAvg != null && afterAvg != null ? Number((afterAvg - beforeAvg).toFixed(2)) : null;
    return {
      key,
      label,
      beforeAvg: beforeAvg != null ? Number(beforeAvg.toFixed(2)) : null,
      afterAvg: afterAvg != null ? Number(afterAvg.toFixed(2)) : null,
      delta,
      diverged: delta != null && Math.abs(delta) >= minDelta,
    };
  });

  return {
    flareDate,
    windowDays,
    beforeDays: before.length,
    afterDays: after.length,
    metrics,
    diverging: metrics.filter((m) => m.diverged),
  };
}

export const CYCLE_PHASE_COLORS = {
  menstrual: '#e91e63',
  follicular: '#81c784',
  ovulation: '#ffd54f',
  luteal: '#9575cd',
};

const CYCLE_PHASES = new Set(['menstrual', 'follicular', 'ovulation', 'luteal']);

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function monthWindow(refDateStr, offsetMonths = 0) {
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(refDateStr) ? new Date(`${refDateStr}T12:00:00`) : new Date();
  const start = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths, 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths + 1, 0);
  const label = start.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
  return { startDate: toDateStr(start), endDate: toDateStr(end), label };
}

function summarizeMetricWindow(logs, startDate, endDate) {
  const rows = logs.filter((l) => l.date >= startDate && l.date <= endDate);
  const mood = mean(rows.map((l) => l.mood).filter((v) => typeof v === 'number'));
  const sleep = mean(rows.map((l) => l.sleep).filter((v) => typeof v === 'number'));
  const fatigue = mean(rows.map((l) => l.fatigue).filter((v) => typeof v === 'number'));
  const flareDays = rows.filter((l) => l.flare === 'Yes').length;
  return {
    logDays: rows.length,
    moodAvg: mood != null ? Number(mood.toFixed(2)) : null,
    sleepAvg: sleep != null ? Number(sleep.toFixed(2)) : null,
    fatigueAvg: fatigue != null ? Number(fatigue.toFixed(2)) : null,
    flareDays,
  };
}

/**
 * Plan 09 C4 — cycle phase bands for chart overlays (requires L7 cycle logs).
 * @param {Array<Record<string, unknown>>} logs
 */
export function buildCyclePhaseBands(logs) {
  const sorted = [...(Array.isArray(logs) ? logs : [])]
    .filter((l) => l?.cycle?.phase && CYCLE_PHASES.has(l.cycle.phase))
    .sort(byDateAsc);
  if (!sorted.length) return { bands: [], markers: [] };

  const bands = [];
  let runPhase = sorted[0].cycle.phase;
  let runStart = sorted[0].date;
  let runEnd = sorted[0].date;

  for (let i = 1; i < sorted.length; i += 1) {
    const log = sorted[i];
    const phase = log.cycle.phase;
    const prev = sorted[i - 1];
    const gapDays = (new Date(log.date) - new Date(prev.date)) / (86400000);
    if (phase === runPhase && gapDays <= 2) {
      runEnd = log.date;
      continue;
    }
    bands.push({
      phase: runPhase,
      label: runPhase,
      startDate: runStart,
      endDate: runEnd,
      color: CYCLE_PHASE_COLORS[runPhase] || '#78909c',
    });
    runPhase = phase;
    runStart = log.date;
    runEnd = log.date;
  }
  bands.push({
    phase: runPhase,
    label: runPhase,
    startDate: runStart,
    endDate: runEnd,
    color: CYCLE_PHASE_COLORS[runPhase] || '#78909c',
  });

  const markers = sorted.map((l) => ({
    date: l.date,
    phase: l.cycle.phase,
    cycleDay: l.cycle.cycleDay ?? null,
  }));

  return { bands, markers };
}

/** ApexCharts xaxis region annotations from cycle bands. */
export function cycleBandsToApexAnnotations(bands) {
  if (!Array.isArray(bands) || !bands.length) return [];
  return bands.map((b) => ({
    x: new Date(`${b.startDate}T00:00:00`).getTime(),
    x2: new Date(`${b.endDate}T23:59:59`).getTime(),
    fillColor: b.color,
    opacity: 0.14,
    borderWidth: 0,
    label: {
      text: b.label,
      style: { fontSize: '10px', background: 'transparent', color: b.color },
    },
  }));
}

/**
 * Plan 09 C5 — compare this month vs last month (+ optional A4 treatment windows).
 * @param {Array<Record<string, unknown>>} logs
 * @param {{ refDate?: string, treatmentStarts?: Array<{ date: string, label?: string }> }} [options]
 */
export function compareChartPeriods(logs, options = {}) {
  const sorted = [...(Array.isArray(logs) ? logs : [])].sort(byDateAsc);
  if (!sorted.length) return null;
  const refDate = options.refDate || sorted[sorted.length - 1].date;
  const current = monthWindow(refDate, 0);
  const previous = monthWindow(refDate, -1);
  const currentStats = summarizeMetricWindow(sorted, current.startDate, current.endDate);
  const previousStats = summarizeMetricWindow(sorted, previous.startDate, previous.endDate);

  const delta = (cur, prev) =>
    cur != null && prev != null ? Number((cur - prev).toFixed(2)) : null;

  const treatmentMarkers = compareTreatmentWindows(sorted, options.treatmentStarts || []);

  return {
    mode: 'month',
    current: { ...current, stats: currentStats },
    previous: { ...previous, stats: previousStats },
    deltas: {
      mood: delta(currentStats.moodAvg, previousStats.moodAvg),
      sleep: delta(currentStats.sleepAvg, previousStats.sleepAvg),
      fatigue: delta(currentStats.fatigueAvg, previousStats.fatigueAvg),
      flareDays: currentStats.flareDays - previousStats.flareDays,
    },
    treatmentMarkers,
  };
}

function exerciseSpoonLoad(log) {
  if (!Array.isArray(log?.exercise)) return 0;
  return log.exercise.reduce((sum, ex) => {
    const dur = typeof ex?.duration === 'number' && Number.isFinite(ex.duration) ? ex.duration : 15;
    return sum + Math.min(3, dur / 15);
  }, 0);
}

function plannedSpoonsForIndex(sorted, index) {
  const prior = sorted.slice(Math.max(0, index - 7), index);
  const fatigueVals = prior.map((l) => l.fatigue).filter((v) => typeof v === 'number');
  const avgFatigue = mean(fatigueVals) ?? 5;
  return Math.max(1, Math.min(10, Math.round(10 - avgFatigue)));
}

/**
 * Plan 09 C9 — spoon/pacing series: planned capacity vs actual activity vs fatigue.
 * @param {Array<Record<string, unknown>>} logs
 * @param {14|30|90|'all'|number} [range]
 */
/** Built-in balance radar axes (PWA `createBalanceChart` parity; steps excluded). */
export const BALANCE_RADAR_BUILTIN = [
  { field: 'fatigue', label: 'Fatigue', max: 10 },
  { field: 'stiffness', label: 'Stiffness', max: 10 },
  { field: 'backPain', label: 'Back Pain', max: 10 },
  { field: 'sleep', label: 'Sleep Quality', max: 10 },
  { field: 'jointPain', label: 'Joint Pain', max: 10 },
  { field: 'mobility', label: 'Mobility', max: 10 },
  { field: 'dailyFunction', label: 'Daily Function', max: 10 },
  { field: 'swelling', label: 'Swelling', max: 10 },
  { field: 'mood', label: 'Mood', max: 10 },
  { field: 'irritability', label: 'Irritability', max: 10 },
  { field: 'weatherSensitivity', label: 'Weather Sensitivity', max: 10 },
  { field: 'hydration', label: 'Hydration', max: 20, radarMax: 10 },
];

function readBuiltinRadarValue(log, metric) {
  const raw = log[metric.field];
  if (raw === undefined || raw === null || raw === '') return null;
  const val = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!Number.isFinite(val) || val < 0) return null;
  if (metric.field === 'hydration') {
    return Math.min(metric.radarMax ?? 10, Math.max(0, (val / metric.max) * (metric.radarMax ?? 10)));
  }
  return Math.min(10, Math.max(0, val));
}

function metricCatalog(customMetrics = []) {
  const custom = (Array.isArray(customMetrics) ? customMetrics : []).map((def) => ({
    field: customMetricFieldKey(def.id),
    label: def.label,
    max: def.type === 'boolean' ? 1 : 10,
    radarMax: 10,
    customDef: def,
  }));
  return [...BALANCE_RADAR_BUILTIN, ...custom];
}

/**
 * Plan 09 C3 — balance radar/spider series for RN + export.
 * @param {Array<Record<string, unknown>>} logs
 * @param {{ selectedFields?: string[], customMetrics?: Array<{ id: string, label: string, type: string }>, range?: number|'all' }} [options]
 */
export function buildBalanceRadarData(logs, options = {}) {
  const range = options.range ?? 'all';
  const selected =
    range === 'all'
      ? [...(Array.isArray(logs) ? logs : [])].sort(byDateAsc)
      : filterLogsByRange(logs, range).sort(byDateAsc);
  const catalog = metricCatalog(options.customMetrics);
  const selectedFields =
    Array.isArray(options.selectedFields) && options.selectedFields.length
      ? options.selectedFields
      : ['mood', 'sleep', 'fatigue'];
  const metrics = catalog.filter((m) => selectedFields.includes(m.field));
  if (metrics.length < 3) return { labels: [], values: [], metrics: [] };

  const rows = [];
  for (const metric of metrics) {
    const values = selected
      .map((log) => {
        if (metric.customDef) return readCustomMetricRadarValue(log, metric.customDef);
        return readBuiltinRadarValue(log, metric);
      })
      .filter((v) => v != null);
    if (!values.length) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    rows.push({
      field: metric.field,
      label: metric.label,
      value: Number(avg.toFixed(2)),
      isCustom: isCustomMetricField(metric.field),
    });
  }

  if (rows.length < 3) return { labels: [], values: [], metrics: [] };
  return {
    labels: rows.map((r) => r.label),
    values: rows.map((r) => r.value),
    metrics: rows,
  };
}

export function buildPacingChartSeries(logs, range = 30) {
  const selected =
    range === 'all'
      ? [...(Array.isArray(logs) ? logs : [])].sort(byDateAsc)
      : filterLogsByRange(logs, range).sort(byDateAsc);
  return selected.map((log, index) => {
    const planned = plannedSpoonsForIndex(selected, index);
    const rawActual = exerciseSpoonLoad(log);
    const actual = Number(Math.min(planned, rawActual).toFixed(1));
    const fatigue = typeof log.fatigue === 'number' ? log.fatigue : null;
    const overpaced = rawActual > planned;
    return {
      date: log.date,
      planned,
      actual,
      rawActual: Number(rawActual.toFixed(1)),
      fatigue,
      overpaced,
    };
  });
}
