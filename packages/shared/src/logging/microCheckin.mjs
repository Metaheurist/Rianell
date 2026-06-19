import { mergeLogEntriesForDate, normalizeSubEntry } from './logSchema.mjs';

export const HOME_CHECKIN_PERIODS = ['AM', 'midday', 'PM'];

/** Suggest check-in period from local hour (morning / midday / evening). */
export function periodForHour(hour) {
  const h = typeof hour === 'number' ? hour : new Date().getHours();
  if (h < 11) return 'AM';
  if (h < 17) return 'midday';
  return 'PM';
}

/** @param {Record<string, unknown> | null | undefined} todayLog */
export function completedCheckinPeriods(todayLog) {
  const subs = Array.isArray(todayLog?.subEntries) ? todayLog.subEntries : [];
  return new Set(
    subs
      .map((s) => s?.period)
      .filter((p) => typeof p === 'string' && HOME_CHECKIN_PERIODS.includes(p))
  );
}

function byDateAsc(a, b) {
  return String(a.date).localeCompare(String(b.date));
}

/**
 * Plan 10 H4 — merge AM/midday/PM partial sub-entry without full wizard.
 * @param {Array<Record<string, unknown>>} logs
 * @param {string} todayStr
 * @param {'AM'|'midday'|'PM'} period
 * @param {{ mood?: number, sleep?: number, fatigue?: number }} metrics
 */
export function applyMicroCheckin(logs, todayStr, period, metrics = {}) {
  if (!HOME_CHECKIN_PERIODS.includes(period)) {
    throw new Error(`Invalid check-in period: ${period}`);
  }
  const sub = normalizeSubEntry({
    id: `${todayStr}-${period}`,
    period,
    mood: metrics.mood,
    sleep: metrics.sleep,
    fatigue: metrics.fatigue,
  });
  const incoming = { date: todayStr, flare: 'No', subEntries: [sub] };
  const list = Array.isArray(logs) ? [...logs] : [];
  const idx = list.findIndex((l) => l?.date === todayStr);
  if (idx >= 0) {
    const merged = mergeLogEntriesForDate(list[idx], incoming);
    const next = [...list];
    next[idx] = merged;
    return next.sort(byDateAsc);
  }
  return [...list, { ...incoming }].sort(byDateAsc);
}
