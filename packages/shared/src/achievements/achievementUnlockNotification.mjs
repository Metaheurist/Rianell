/** One-shot local notification when an achievement unlocks. */

import { ALL_ACHIEVEMENTS } from './achievements.mjs';

const DEFAULT_STRINGS = {
  'achievements.food.notificationTitle': 'Food logging unlocked',
  'achievements.food.notificationBody': 'You can now log meals in the daily wizard.',
  'achievements.exercise.notificationTitle': 'Exercise logging unlocked',
  'achievements.exercise.notificationBody': 'You can now log activity in the daily wizard.',
  'achievements.medication.notificationTitle': 'Medication logging unlocked',
  'achievements.medication.notificationBody': 'You can now log medications in the daily wizard.',
  'achievements.milestone3.notificationTitle': '3-day streak',
  'achievements.milestone3.notificationBody': 'You have tracked for three days. Keep going!',
  'achievements.milestone30.notificationTitle': '30-day milestone',
  'achievements.milestone30.notificationBody': 'A full month of consistent tracking.',
  'achievements.milestone60.notificationTitle': '60-day milestone',
  'achievements.milestone60.notificationBody': 'Two months of dedication to your health.',
  'achievements.milestone90.notificationTitle': 'Dedicated tracker',
  'achievements.milestone90.notificationBody': 'Ninety days of consistent tracking.',
  'achievements.milestone180.notificationTitle': 'Half-year journey',
  'achievements.milestone180.notificationBody': 'Six months of tracking your health.',
  'achievements.sleepPioneer.notificationTitle': 'Sleep pioneer',
  'achievements.sleepPioneer.notificationBody': 'Sleep logging is now available.',
  'achievements.cycleTracker.notificationTitle': 'Cycle tracker',
  'achievements.cycleTracker.notificationBody': 'Cycle logging is now available.',
  'achievements.fullLogger.notificationTitle': 'Full logger',
  'achievements.fullLogger.notificationBody': 'Every logging category is unlocked.',
};

export function shouldFireAchievementUnlockNotification(snapshot, opts = {}) {
  if (opts.notificationsEnabled === false) return { fire: false, reason: 'disabled' };
  if (!snapshot?.unlocked) return { fire: false, reason: 'locked' };
  if (snapshot.notifiedAt) return { fire: false, reason: 'already-notified' };
  return { fire: true, reason: 'new-unlock', achievementId: snapshot.id };
}

/**
 * @param {string} achievementId
 * @param {(key: string) => string} [t]
 */
export function buildAchievementUnlockNotificationContent(achievementId, t) {
  const def = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
  const translate =
    typeof t === 'function'
      ? t
      : (key) => DEFAULT_STRINGS[key] || key;
  if (!def) {
    return {
      title: translate('achievements.notification.title'),
      body: translate('achievements.notification.body'),
      url: '/?quick=true',
      achievementId,
    };
  }
  return {
    title: translate(def.i18nNotificationTitle),
    body: translate(def.i18nNotificationBody),
    url: '/?quick=true',
    achievementId: def.id,
  };
}
