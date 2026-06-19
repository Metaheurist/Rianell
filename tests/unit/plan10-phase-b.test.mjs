import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodayPacingBudget } from '@rianell/ai-engine';
import {
  applyMicroCheckin,
  completedCheckinPeriods,
  periodForHour,
  HOME_CHECKIN_PERIODS,
} from '@rianell/shared';
import { computeHomeCardContext, resolveHomeCardOrder } from '@rianell/shared';

const LOGS = [
  { date: '2026-06-16', fatigue: 6, flare: 'No', exercise: [{ name: 'Walk', duration: 30 }] },
  { date: '2026-06-17', fatigue: 7, flare: 'No' },
  { date: '2026-06-18', fatigue: 5, flare: 'Yes', exercise: [{ name: 'Yoga', duration: 45 }] },
];

test('buildTodayPacingBudget returns planned spoons with flare adjustment', () => {
  const budget = buildTodayPacingBudget(LOGS, '2026-06-19');
  assert.ok(budget);
  assert.ok(budget.planned >= 1 && budget.planned <= 10);
  assert.equal(budget.hasTodayLog, false);
});

test('applyMicroCheckin merges sub-entry for today', () => {
  const next = applyMicroCheckin(LOGS, '2026-06-19', 'AM', { mood: 6, sleep: 7, fatigue: 5 });
  const today = next.find((l) => l.date === '2026-06-19');
  assert.ok(today);
  assert.ok(Array.isArray(today.subEntries));
  assert.equal(today.subEntries[0].period, 'AM');
  assert.equal(today.subEntries[0].mood, 6);
});

test('periodForHour maps morning midday evening', () => {
  assert.equal(periodForHour(8), 'AM');
  assert.equal(periodForHour(13), 'midday');
  assert.equal(periodForHour(20), 'PM');
  assert.ok(HOME_CHECKIN_PERIODS.includes('midday'));
});

test('home card order includes pacing and checkin when enabled', () => {
  const ctx = computeHomeCardContext(LOGS, '2026-06-19', {
    hasPacingData: true,
    showCheckin: true,
  });
  const order = resolveHomeCardOrder(ctx);
  assert.ok(order.includes('pacing'));
  assert.ok(order.includes('checkin'));
});

test('completedCheckinPeriods tracks AM midday PM', () => {
  const log = { subEntries: [{ period: 'AM' }, { period: 'midday' }] };
  const done = completedCheckinPeriods(log);
  assert.equal(done.size, 2);
  assert.ok(done.has('AM'));
});
