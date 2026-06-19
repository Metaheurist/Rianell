/** Plan 11 R6 — optional achievement-free streak reminder (pairs Plan 10 H3). */

import { computeFlareFreeDays, computeGoodDayStreak } from '../home/homeStreakStats.mjs';
import { hasLoggedToday, localDateStrFromNow, shouldFireMissedLogNudge } from './smartReminder.mjs';

export const STREAK_REMINDER_MIN_STREAK = 2;

export function shouldFireStreakReminderNudge(logs, now = new Date(), opts = {}) {
  if (opts.enabled === false) return { fire: false, reason: 'disabled' };
  if (opts.homeStreakCardDismissed === true) return { fire: false, reason: 'h3-dismissed' };
  const todayStr = opts.todayStr ?? localDateStrFromNow(now);
  const goodDayStreak = computeGoodDayStreak(logs);
  const minStreak = opts.minStreak ?? STREAK_REMINDER_MIN_STREAK;
  if (goodDayStreak < minStreak) {
    return { fire: false, reason: 'streak-too-short', goodDayStreak };
  }
  const timing = shouldFireMissedLogNudge(logs, now, {
    fallbackHHMM: opts.fallbackHHMM,
    lastNudgeDate: opts.lastNudgeDate,
    todayStr,
    now,
  });
  if (!timing.fire) return { ...timing, goodDayStreak };
  return {
    fire: true,
    reason: 'streak-reminder',
    goodDayStreak,
    flareFreeDays: computeFlareFreeDays(logs),
    nudgeHHMM: timing.nudgeHHMM,
  };
}

export function buildStreakReminderNotificationContent(snapshot = {}) {
  const goodDays = snapshot.goodDayStreak ?? 0;
  const flareFree = snapshot.flareFreeDays ?? 0;
  const body =
    goodDays <= 1
      ? 'One calm day in a row. A quick log keeps your picture complete.'
      : `${goodDays} calm day(s) in a row · ${flareFree} flare-free. Still time to log today, no scores, just continuity.`;
  return {
    title: 'Recent patterns',
    body,
    url: '/?quick=true',
  };
}
