/** Plan 10 H1 — adaptive home card registry (PWA + RN parity). */

const HOME_CARDS = [
  { id: 'weeklyReview', basePriority: 68 },
  { id: 'streak', basePriority: 38 },
  { id: 'hero', basePriority: 100 },
  { id: 'goals', basePriority: 60 },
];

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function yesterdayOf(todayStr) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(todayStr) ? new Date(`${todayStr}T12:00:00`) : new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

/** Logged yesterday but not today — gentle nudge, not gamified. */
export function isLoggingStreakBroken(logs, todayStr) {
  if (!Array.isArray(logs) || !todayStr) return false;
  const dates = new Set(logs.map((l) => l?.date).filter(Boolean));
  if (dates.has(todayStr)) return false;
  return dates.has(yesterdayOf(todayStr));
}

/** Missed yesterday and today but logged the day before — compassionate return, not shame. */
export function isLoggingStreakGrace(logs, todayStr) {
  if (!Array.isArray(logs) || !todayStr) return false;
  const dates = new Set(logs.map((l) => l?.date).filter(Boolean));
  const yday = yesterdayOf(todayStr);
  const dayBefore = yesterdayOf(yday);
  return !dates.has(todayStr) && !dates.has(yday) && dates.has(dayBefore);
}

/**
 * @param {Array<{ date?: string }>} logs
 * @param {string} todayStr YYYY-MM-DD
 */
export function computeHomeCardContext(logs, todayStr, options = {}) {
  const {
    aiEnabled = true,
    simpleMode = false,
    showGoals = true,
    showCheckin = true,
    showStreak = false,
    showWeather = false,
    showWeeklyReview = false,
  } = options;
  const loggedToday = Array.isArray(logs) && logs.some((l) => l?.date === todayStr);
  const streakBroken = isLoggingStreakBroken(logs, todayStr);
  const streakGrace = isLoggingStreakGrace(logs, todayStr);
  const showAiQuestions = aiEnabled && !simpleMode && loggedToday;
  return {
    loggedToday,
    streakBroken,
    streakGrace,
    aiEnabled: aiEnabled !== false,
    simpleMode: simpleMode === true,
    showGoals: showGoals !== false && aiEnabled !== false,
    showAiQuestions,
    showCheckin: showCheckin !== false && simpleMode !== true,
    showStreak: showStreak === true,
    showWeather: showWeather === true,
    showWeeklyReview: showWeeklyReview === true,
  };
}

/**
 * @param {ReturnType<typeof computeHomeCardContext>} context
 * @returns {string[]}
 */
export function resolveHomeCardOrder(context) {
  const ctx = context || {};
  const scored = [];

  for (const card of HOME_CARDS) {
    if (card.id === 'goals' && !ctx.showGoals) continue;
    if (card.id === 'streak' && !ctx.showStreak) continue;
    if (card.id === 'weeklyReview' && !ctx.showWeeklyReview) continue;
    let priority = card.basePriority;
    if (ctx.loggedToday && card.id === 'goals') priority += 50;
    if (!ctx.loggedToday && card.id === 'hero') priority += 30;
    if (ctx.streakBroken && !ctx.loggedToday && card.id === 'hero') priority += 80;
    if (ctx.showWeeklyReview && card.id === 'weeklyReview') priority += 40;
    scored.push({ id: card.id, priority });
  }

  return scored.sort((a, b) => b.priority - a.priority).map((c) => c.id);
}

