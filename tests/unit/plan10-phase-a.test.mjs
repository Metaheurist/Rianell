import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLoggingStreakBroken,
  computeHomeCardContext,
  resolveHomeCardOrder,
} from '@rianell/shared';

const LOGS = [
  { date: '2026-06-16' },
  { date: '2026-06-17' },
  { date: '2026-06-18' },
];

test('isLoggingStreakBroken when yesterday logged but not today', () => {
  assert.equal(isLoggingStreakBroken(LOGS, '2026-06-19'), true);
  assert.equal(isLoggingStreakBroken(LOGS, '2026-06-18'), false);
});

test('resolveHomeCardOrder promotes goals when logged today', () => {
  const ctx = computeHomeCardContext([...LOGS, { date: '2026-06-19' }], '2026-06-19', {
    aiEnabled: true,
    showGoals: true,
  });
  const order = resolveHomeCardOrder(ctx);
  assert.equal(order[0], 'goals');
  assert.ok(order.includes('hero'));
});

test('resolveHomeCardOrder promotes hero when streak broken (nudge merged into hero status)', () => {
  const ctx = computeHomeCardContext(LOGS, '2026-06-19');
  assert.equal(ctx.streakBroken, true);
  const order = resolveHomeCardOrder(ctx);
  assert.ok(!order.includes('nudge'));
  assert.equal(order[0], 'hero');
});

test('simple mode hides AI questions context flag', () => {
  const ctx = computeHomeCardContext([...LOGS, { date: '2026-06-19' }], '2026-06-19', {
    simpleMode: true,
  });
  assert.equal(ctx.showAiQuestions, false);
});
