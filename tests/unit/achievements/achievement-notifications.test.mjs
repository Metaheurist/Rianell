import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAchievementUnlockNotificationContent,
  shouldFireAchievementUnlockNotification,
} from '@rianell/shared';

test('shouldFireAchievementUnlockNotification respects enabled and notifiedAt', () => {
  assert.deepEqual(
    shouldFireAchievementUnlockNotification({ id: 'food_logging', unlocked: true }, { notificationsEnabled: false }),
    { fire: false, reason: 'disabled' },
  );
  assert.deepEqual(
    shouldFireAchievementUnlockNotification(
      { id: 'food_logging', unlocked: true, notifiedAt: '2026-01-01T00:00:00.000Z' },
      { notificationsEnabled: true },
    ),
    { fire: false, reason: 'already-notified' },
  );
  assert.deepEqual(
    shouldFireAchievementUnlockNotification({ id: 'food_logging', unlocked: false }, { notificationsEnabled: true }),
    { fire: false, reason: 'locked' },
  );
  const ok = shouldFireAchievementUnlockNotification({ id: 'food_logging', unlocked: true }, { notificationsEnabled: true });
  assert.equal(ok.fire, true);
  assert.equal(ok.achievementId, 'food_logging');
});

test('buildAchievementUnlockNotificationContent returns food copy', () => {
  const content = buildAchievementUnlockNotificationContent('food_logging');
  assert.match(content.title, /Food logging unlocked/i);
  assert.match(content.body, /meals/i);
  assert.equal(content.achievementId, 'food_logging');
});
