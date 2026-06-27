/** Map Withings measure groups to partial daily log entries. */

const TYPE_WEIGHT = 1;
const TYPE_BPM = 11;
const TYPE_SLEEP = 38;

function toDateFromUnix(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Date(n * 1000).toISOString().slice(0, 10);
}

function pickMeasureValue(measures, type) {
  for (const m of measures || []) {
    if (Number(m.type) !== type) continue;
    const value = Number(m.value);
    const unit = Number(m.unit ?? 0);
    if (!Number.isFinite(value)) continue;
    return value * Math.pow(10, unit);
  }
  return null;
}

export function mapWithingsMeasuresToPartialLogs(groups) {
  const byDate = new Map();
  for (const group of groups || []) {
    const date = toDateFromUnix(group.date ?? group.startdate ?? group.created);
    if (!date) continue;
    const measures = group.measures || group.data || [];
    const partial = byDate.get(date) || { date };
    const weight = pickMeasureValue(measures, TYPE_WEIGHT);
    const bpm = pickMeasureValue(measures, TYPE_BPM);
    const sleepHours = pickMeasureValue(measures, TYPE_SLEEP);
    if (weight != null) partial.weight = String(Math.round(weight * 10) / 10);
    if (bpm != null) partial.bpm = Math.round(bpm);
    if (sleepHours != null) partial.sleep = Math.round(sleepHours * 10) / 10;
    byDate.set(date, partial);
  }
  return [...byDate.values()];
}

export function mapWithingsActivityToPartialLogs(activities) {
  const byDate = new Map();
  for (const row of activities || []) {
    const date = String(row.date || '').slice(0, 10);
    if (!date) continue;
    const partial = byDate.get(date) || { date };
    const steps = Number(row.steps ?? row.data?.steps);
    if (Number.isFinite(steps) && steps > 0) partial.steps = Math.round(steps);
    byDate.set(date, partial);
  }
  return [...byDate.values()];
}

export function mergeWithingsPartialLogs(...lists) {
  const byDate = new Map();
  for (const list of lists) {
    for (const entry of list || []) {
      const date = entry.date;
      if (!date) continue;
      byDate.set(date, { ...(byDate.get(date) || {}), ...entry, date });
    }
  }
  return [...byDate.values()];
}
