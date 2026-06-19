import { filterLogsByRange } from './summarize.mjs';

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
