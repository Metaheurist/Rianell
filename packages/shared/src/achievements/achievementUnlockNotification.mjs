/** One-shot local notification when a logging achievement unlocks. */

import { LOGGING_ACHIEVEMENTS } from './achievements.mjs';

const DEFAULT_STRINGS = {
  'achievements.food.notificationTitle': 'Food logging unlocked',
  'achievements.food.notificationBody': 'You can now log meals in the daily wizard.',
  'achievements.exercise.notificationTitle': 'Exercise logging unlocked',
  'achievements.exercise.notificationBody': 'You can now log activity in the daily wizard.',
  'achievements.medication.notificationTitle': 'Medication logging unlocked',
  'achievements.medication.notificationBody': 'You can now log medications in the daily wizard.',
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
  const def = LOGGING_ACHIEVEMENTS.find((a) => a.id === achievementId);
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
