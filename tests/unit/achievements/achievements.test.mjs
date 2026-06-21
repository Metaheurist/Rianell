import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAchievementSnapshots,
  detectNewlyUnlocked,
  getRequiredDaysForAchievement,
  mergeAchievementState,
  markAchievementNotified,
  normalizeAchievementState,
} from '@rianell/shared';

const profileAtDays = (days) => ({
  condition: 'Fibromyalgia',
  fields: { mood: true, pain: true, notes: true, sleep: true, fatigue: true },
  configuredAt: new Date(Date.now() - days * 86400000).toISOString(),
});

test('getRequiredDaysForAchievement matches progressive unlock schedule', () => {
  assert.equal(getRequiredDaysForAchievement('food_logging'), 7);
  assert.equal(getRequiredDaysForAchievement('exercise_logging'), 14);
  assert.equal(getRequiredDaysForAchievement('medication_logging'), 21);
});

test('computeAchievementSnapshots locks food until day 7', () => {
  const day6 = computeAchievementSnapshots(profileAtDays(6), {});
  const food6 = day6.snapshots.find((s) => s.id === 'food_logging');
  assert.equal(food6?.unlocked, false);
  assert.equal(food6?.daysRemaining, 1);

  const day7 = computeAchievementSnapshots(profileAtDays(7), {});
  const food7 = day7.snapshots.find((s) => s.id === 'food_logging');
  assert.equal(food7?.unlocked, true);
});

test('medications locked at day 13, unlocked at day 21', () => {
  const d13 = computeAchievementSnapshots(profileAtDays(13), {});
  assert.equal(d13.snapshots.find((s) => s.id === 'exercise_logging')?.unlocked, false);
  assert.equal(d13.snapshots.find((s) => s.id === 'food_logging')?.unlocked, true);

  const d21 = computeAchievementSnapshots(profileAtDays(21), {});
  assert.equal(d21.snapshots.find((s) => s.id === 'medication_logging')?.unlocked, true);
});

test('configuredAt null keeps logging achievements locked', () => {
  const result = computeAchievementSnapshots({ condition: 'x', fields: {}, configuredAt: null }, {});
  assert.ok(result.snapshots.every((s) => !s.unlocked));
});

test('mergeAchievementState unions notifiedAt with latest timestamp', () => {
  const merged = mergeAchievementState(
    { achievements: { food_logging: { notifiedAt: '2026-01-01T00:00:00.000Z' } }, updatedAt: '2026-01-01T00:00:00.000Z' },
    { achievements: { food_logging: { notifiedAt: '2026-06-01T00:00:00.000Z' } }, updatedAt: '2026-06-01T00:00:00.000Z' },
  );
  assert.equal(merged.achievements.food_logging.notifiedAt, '2026-06-01T00:00:00.000Z');
});

test('detectNewlyUnlocked fires once when unlock transitions', () => {
  const prev = computeAchievementSnapshots(profileAtDays(6), {}).snapshots;
  const next = computeAchievementSnapshots(profileAtDays(7), {}).snapshots;
  const newly = detectNewlyUnlocked(prev, next);
  assert.equal(newly.length, 1);
  assert.equal(newly[0].id, 'food_logging');

  const again = detectNewlyUnlocked(next, next);
  assert.equal(again.length, 0);

  const withNotified = next.map((s) =>
    s.id === 'food_logging' ? { ...s, notifiedAt: '2026-06-01T00:00:00.000Z' } : s,
  );
  const afterNotify = detectNewlyUnlocked(prev, withNotified);
  assert.equal(afterNotify.length, 0);
});

test('markAchievementNotified persists timestamp', () => {
  const state = markAchievementNotified(normalizeAchievementState({}), 'food_logging', '2026-06-21T12:00:00.000Z');
  assert.equal(state.achievements.food_logging.notifiedAt, '2026-06-21T12:00:00.000Z');
});
