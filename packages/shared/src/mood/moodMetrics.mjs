/** Mood metrics from daily log mood + AM/midday/PM check-in sub-entries. */

import { HOME_CHECKIN_PERIODS } from '../logging/microCheckin.mjs';

export const MOOD_CHECKIN_PERIODS = HOME_CHECKIN_PERIODS;

const PERIOD_ORDER = { AM: 0, midday: 1, PM: 2 };

function clampMood(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(10, Math.max(0, Math.round(n)));
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

/** @param {Array<{ date?: string }>} logs */
export function filterLogsByDays(logs, days, todayStr) {
  const list = Array.isArray(logs) ? logs : [];
  const end = /^\d{4}-\d{2}-\d{2}$/.test(todayStr || '')
    ? new Date(`${todayStr}T12:00:00`)
    : new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (Math.max(1, days) - 1));
  const startStr = toDateStr(start);
  const endStr = todayStr || toDateStr(end);
  return list.filter((l) => l?.date && l.date >= startStr && l.date <= endStr);
}

/**
 * @returns {Array<{ date: string, period: string|null, mood: number, source: 'daily'|'checkin' }>}
 */
export function collectMoodReadings(logs, days = 14, todayStr) {
  const rangeLogs = filterLogsByDays(logs, days, todayStr).sort((a, b) =>
    String(b.date).localeCompare(String(a.date)),
  );
  const out = [];
  for (const log of rangeLogs) {
    const daily = clampMood(log.mood);
    if (daily != null) {
      out.push({ date: log.date, period: null, mood: daily, source: 'daily' });
    }
    const subs = Array.isArray(log.subEntries) ? log.subEntries : [];
    for (const sub of subs) {
      const m = clampMood(sub?.mood);
      if (m == null) continue;
      const period = typeof sub.period === 'string' ? sub.period : null;
      out.push({ date: log.date, period, mood: m, source: 'checkin' });
    }
  }
  out.sort((a, b) => {
    const dc = String(b.date).localeCompare(String(a.date));
    if (dc !== 0) return dc;
    const pa = a.period ? (PERIOD_ORDER[a.period] ?? 9) : 10;
    const pb = b.period ? (PERIOD_ORDER[b.period] ?? 9) : 10;
    return pa - pb;
  });
  return out;
}

export function summarizeMoodMetrics(logs, opts = {}) {
  const days = opts.days ?? 14;
  const todayStr = opts.todayStr;
  const moodTarget = opts.moodTarget ?? 7;
  const readings = collectMoodReadings(logs, days, todayStr);
  if (!readings.length) {
    return {
      days,
      count: 0,
      average: null,
      latest: null,
      trend: null,
      atTargetCount: 0,
      belowTargetCount: 0,
      moodTarget,
      readings: [],
      dailyAverages: [],
    };
  }
  const sum = readings.reduce((s, r) => s + r.mood, 0);
  const avg = Math.round((sum / readings.length) * 10) / 10;
  const latest = readings[0];

  const chronological = [...readings].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const mid = Math.floor(chronological.length / 2);
  const firstHalf = chronological.slice(0, mid || 1);
  const secondHalf = chronological.slice(mid || 1);
  const avgFirst = firstHalf.reduce((s, r) => s + r.mood, 0) / firstHalf.length;
  const avgSecond = secondHalf.length
    ? secondHalf.reduce((s, r) => s + r.mood, 0) / secondHalf.length
    : avgFirst;
  let trend = 'stable';
  if (avgSecond - avgFirst >= 0.5) trend = 'up';
  else if (avgFirst - avgSecond >= 0.5) trend = 'down';

  const atTarget = readings.filter((r) => r.mood >= moodTarget).length;

  const byDate = new Map();
  for (const r of readings) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date).push(r.mood);
  }
  const dailyAverages = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, moods]) => ({
      date,
      average: Math.round((moods.reduce((s, m) => s + m, 0) / moods.length) * 10) / 10,
      count: moods.length,
    }));

  return {
    days,
    count: readings.length,
    average: avg,
    latest,
    trend,
    atTargetCount: atTarget,
    belowTargetCount: readings.length - atTarget,
    moodTarget,
    readings: readings.slice(0, 30),
    dailyAverages,
  };
}

export function moodQualitativeKey(score) {
  const n = clampMood(score);
  if (n == null) return 'mood.qualitative.none';
  if (n <= 3) return 'mood.qualitative.low';
  if (n <= 5) return 'mood.qualitative.moderate';
  if (n <= 7) return 'mood.qualitative.okay';
  return 'mood.qualitative.good';
}
