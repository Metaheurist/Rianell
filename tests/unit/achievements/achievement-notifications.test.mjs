import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAchievementUnlockNotificationContent,
  enqueueAchievementToast,
  getAchievementToastQueueLength,
  isAchievementToastShowing,
  markAchievementToastDismissed,
  registerAchievementToastPresenter,
  resetAchievementToastQueue,
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

test('buildAchievementUnlockNotificationContent returns milestone copy', () => {
  const content = buildAchievementUnlockNotificationContent('milestone_30');
  assert.match(content.title, /30-day/i);
  assert.equal(content.achievementId, 'milestone_30');
});

test('achievement toast queue presents items sequentially', () => {
  resetAchievementToastQueue();
  const shown = [];
  registerAchievementToastPresenter((item) => {
    shown.push(item.id);
  });
  enqueueAchievementToast({ id: 'food_logging', title: 'A', body: 'a' });
  enqueueAchievementToast({ id: 'milestone_3', title: 'B', body: 'b' });
  assert.deepEqual(shown, ['food_logging']);
  assert.equal(isAchievementToastShowing(), true);
  assert.equal(getAchievementToastQueueLength(), 1);
  markAchievementToastDismissed();
  assert.deepEqual(shown, ['food_logging', 'milestone_3']);
  assert.equal(getAchievementToastQueueLength(), 0);
  resetAchievementToastQueue();
});

test('enqueueAchievementToast ignores invalid items', () => {
  resetAchievementToastQueue();
  const shown = [];
  registerAchievementToastPresenter((item) => shown.push(item.id));
  enqueueAchievementToast({ id: '', title: 'x', body: 'y' });
  assert.equal(shown.length, 0);
  resetAchievementToastQueue();
});
