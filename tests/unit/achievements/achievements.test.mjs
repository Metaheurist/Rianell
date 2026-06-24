import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ACHIEVEMENTS,
  computeAchievementSnapshots,
  detectNewlyUnlocked,
  getRequiredDaysForAchievement,
  isKnownAchievementId,
  markAchievementNotified,
  markAchievementSeen,
  mergeAchievementState,
  normalizeAchievementState,
} from '@rianell/shared';

const profileAtDays = (days) => ({
  condition: 'Fibromyalgia',
  fields: { mood: true, pain: true, notes: true, sleep: true, fatigue: true },
  configuredAt: new Date(Date.now() - days * 86400000).toISOString(),
});

test('ALL_ACHIEVEMENTS has 11 entries with tier metadata', () => {
  assert.equal(ALL_ACHIEVEMENTS.length, 11);
  assert.ok(ALL_ACHIEVEMENTS.every((a) => a.tier));
  assert.ok(ALL_ACHIEVEMENTS.some((a) => a.id === 'milestone_30'));
  assert.ok(ALL_ACHIEVEMENTS.some((a) => a.id === 'full_logger'));
});

test('getRequiredDaysForAchievement matches progressive unlock schedule', () => {
  assert.equal(getRequiredDaysForAchievement('food_logging'), 7);
  assert.equal(getRequiredDaysForAchievement('exercise_logging'), 14);
  assert.equal(getRequiredDaysForAchievement('medication_logging'), 21);
  assert.equal(getRequiredDaysForAchievement('milestone_3'), 3);
  assert.equal(getRequiredDaysForAchievement('milestone_30'), 30);
  assert.equal(getRequiredDaysForAchievement('sleep_pioneer'), 3);
  assert.equal(getRequiredDaysForAchievement('full_logger'), 28);
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

test('milestone_3 unlocks at day 3', () => {
  const d2 = computeAchievementSnapshots(profileAtDays(2), {});
  const d3 = computeAchievementSnapshots(profileAtDays(3), {});
  assert.equal(d2.snapshots.find((s) => s.id === 'milestone_3')?.unlocked, false);
  assert.equal(d3.snapshots.find((s) => s.id === 'milestone_3')?.unlocked, true);
});

test('full_logger unlocks when all categories available', () => {
  const d27 = computeAchievementSnapshots(profileAtDays(27), {});
  const d28 = computeAchievementSnapshots(profileAtDays(28), {});
  assert.equal(d27.snapshots.find((s) => s.id === 'full_logger')?.unlocked, false);
  assert.equal(d28.snapshots.find((s) => s.id === 'full_logger')?.unlocked, true);
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

test('markAchievementNotified persists timestamp and rejects unknown ids', () => {
  const state = markAchievementNotified(normalizeAchievementState({}), 'food_logging', '2026-06-21T12:00:00.000Z');
  assert.equal(state.achievements.food_logging.notifiedAt, '2026-06-21T12:00:00.000Z');

  const noop = markAchievementNotified(state, 'not_a_real_achievement');
  assert.equal(noop.achievements.not_a_real_achievement, undefined);
});

test('markAchievementSeen rejects unknown ids', () => {
  assert.equal(isKnownAchievementId('food_logging'), true);
  assert.equal(isKnownAchievementId('bogus'), false);
  const state = markAchievementSeen(normalizeAchievementState({}), 'bogus');
  assert.equal(state.achievements.bogus, undefined);
});
