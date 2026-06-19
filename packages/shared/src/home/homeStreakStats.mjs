/** Plan 10 H3 — non-gamified good-day streak + flare-free counter. */

function parseMood(log) {
  if (log?.mood == null || log.mood === '') return null;
  const n = typeof log.mood === 'number' ? log.mood : parseInt(String(log.mood), 10);
  return Number.isFinite(n) ? n : null;
}

/** Good day = no flare and mood ≥ 6 (or mood not logged). */
export function isGoodDayLog(log) {
  if (!log || typeof log !== 'object') return false;
  const noFlare = log.flare !== 'Yes';
  const mood = parseMood(log);
  const moodOk = mood == null || mood >= 6;
  return noFlare && moodOk;
}

function logsNewestFirst(logs) {
  return [...(Array.isArray(logs) ? logs : [])].sort((a, b) =>
    String(b?.date || '').localeCompare(String(a?.date || ''))
  );
}

/** Consecutive recent logs (from today backward) that qualify as good days. */
export function computeGoodDayStreak(logs) {
  const sorted = logsNewestFirst(logs);
  let streak = 0;
  for (const log of sorted) {
    if (isGoodDayLog(log)) streak += 1;
    else break;
  }
  return streak;
}

/** Consecutive recent days without a flare (from most recent log backward). */
export function computeFlareFreeDays(logs) {
  const sorted = logsNewestFirst(logs);
  let count = 0;
  for (const log of sorted) {
    if (log?.flare === 'Yes') break;
    if (log?.date) count += 1;
  }
  return count;
}

/**
 * @param {Array<Record<string, unknown>>} logs
 * @param {{ dismissed?: boolean, minStreak?: number }} [options]
 */
export function computeHomeStreakSnapshot(logs, options = {}) {
  const dismissed = options.dismissed === true;
  const minStreak = typeof options.minStreak === 'number' ? options.minStreak : 2;
  const goodDayStreak = computeGoodDayStreak(logs);
  const flareFreeDays = computeFlareFreeDays(logs);
  const showCard =
    !dismissed && (goodDayStreak >= minStreak || flareFreeDays >= minStreak);
  return { goodDayStreak, flareFreeDays, showCard };
}
