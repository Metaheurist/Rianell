/** Plan 10 H1 — adaptive home card registry (PWA + RN parity). */

const HOME_CARDS = [
  { id: 'nudge', basePriority: 40 },
  { id: 'appointment', basePriority: 78 },
  { id: 'weather', basePriority: 48 },
  { id: 'streak', basePriority: 38 },
  { id: 'checkin', basePriority: 70 },
  { id: 'pacing', basePriority: 55 },
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

/**
 * @param {Array<{ date?: string }>} logs
 * @param {string} todayStr YYYY-MM-DD
 */
export function computeHomeCardContext(logs, todayStr, options = {}) {
  const {
    aiEnabled = true,
    simpleMode = false,
    showGoals = true,
    hasPacingData = false,
    showCheckin = true,
    showStreak = false,
    showWeather = false,
    showAppointment = false,
  } = options;
  const loggedToday = Array.isArray(logs) && logs.some((l) => l?.date === todayStr);
  const streakBroken = isLoggingStreakBroken(logs, todayStr);
  const showAiQuestions = aiEnabled && !simpleMode && loggedToday;
  return {
    loggedToday,
    streakBroken,
    aiEnabled: aiEnabled !== false,
    simpleMode: simpleMode === true,
    showGoals: showGoals !== false && aiEnabled !== false,
    showAiQuestions,
    showPacing: hasPacingData === true,
    showCheckin: showCheckin !== false && simpleMode !== true,
    showStreak: showStreak === true,
    showWeather: showWeather === true,
    showAppointment: showAppointment === true,
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
    if (card.id === 'nudge' && (!ctx.streakBroken || ctx.loggedToday)) continue;
    if (card.id === 'goals' && !ctx.showGoals) continue;
    if (card.id === 'pacing' && !ctx.showPacing) continue;
    if (card.id === 'checkin' && !ctx.showCheckin) continue;
    if (card.id === 'streak' && !ctx.showStreak) continue;
    if (card.id === 'weather' && !ctx.showWeather) continue;
    if (card.id === 'appointment' && !ctx.showAppointment) continue;
    let priority = card.basePriority;
    if (ctx.loggedToday && card.id === 'goals') priority += 50;
    if (ctx.loggedToday && card.id === 'checkin') priority += 35;
    if (ctx.loggedToday && card.id === 'pacing') priority += 20;
    if (!ctx.loggedToday && card.id === 'hero') priority += 30;
    if (!ctx.loggedToday && card.id === 'nudge') priority += 80;
    if (ctx.streakBroken && card.id === 'nudge') priority += 20;
    if (ctx.showAppointment && card.id === 'appointment') priority += 25;
    if (ctx.loggedToday && card.id === 'weather') priority += 15;
    scored.push({ id: card.id, priority });
  }

  return scored.sort((a, b) => b.priority - a.priority).map((c) => c.id);
}
