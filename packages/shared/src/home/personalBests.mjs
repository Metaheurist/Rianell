import { isGoodDayLog } from './homeStreakStats.mjs';

function logsNewestFirst(logs) {
  return [...(Array.isArray(logs) ? logs : [])].sort((a, b) =>
    String(b?.date || '').localeCompare(String(a?.date || ''))
  );
}

function longestConsecutiveRun(logs, predicate) {
  const sorted = logsNewestFirst(logs);
  let best = 0;
  let current = 0;
  for (const log of sorted) {
    if (predicate(log)) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

function longestFlareFreeRun(logs) {
  const sorted = logsNewestFirst(logs);
  let best = 0;
  let current = 0;
  for (const log of sorted) {
    if (log?.flare === 'Yes') {
      current = 0;
    } else if (log?.date) {
      current += 1;
      if (current > best) best = current;
    }
  }
  return best;
}

/** Personal bests across all logs — for positive reinforcement cards. */
export function computePersonalBests(logs) {
  const list = Array.isArray(logs) ? logs : [];
  return {
    longestGoodRun: longestConsecutiveRun(list, isGoodDayLog),
    longestFlareFreeRun: longestFlareFreeRun(list),
    totalLogs: list.length,
  };
}

/**
 * Whether to show a personal-best celebration on home.
 * @param {ReturnType<typeof computePersonalBests>} bests
 * @param {{ goodDayStreak?: number, flareFreeDays?: number }} current
 */
export function pickPersonalBestHighlight(bests, current = {}) {
  const good = typeof current.goodDayStreak === 'number' ? current.goodDayStreak : 0;
  const flareFree = typeof current.flareFreeDays === 'number' ? current.flareFreeDays : 0;
  if (good >= 2 && good >= bests.longestGoodRun) {
    return { kind: 'goodDays', n: good };
  }
  if (flareFree >= 2 && flareFree >= bests.longestFlareFreeRun) {
    return { kind: 'flareFree', n: flareFree };
  }
  return null;
}
