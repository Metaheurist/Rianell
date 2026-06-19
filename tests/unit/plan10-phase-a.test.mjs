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

test('resolveHomeCardOrder shows nudge when streak broken', () => {
  const ctx = computeHomeCardContext(LOGS, '2026-06-19');
  const order = resolveHomeCardOrder(ctx);
  assert.equal(order[0], 'nudge');
});

test('simple mode hides AI questions context flag', () => {
  const ctx = computeHomeCardContext([...LOGS, { date: '2026-06-19' }], '2026-06-19', {
    simpleMode: true,
  });
  assert.equal(ctx.showAiQuestions, false);
});
