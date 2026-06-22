import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCycleDayFromPeriodStart,
  daysSincePeriodStart,
  findLatestPeriodStart,
  isCycleDayLate,
  normalizeCycleFields,
  suggestCycleForDate,
} from '@rianell/shared';

test('findLatestPeriodStart prefers explicit periodStart over legacy cycleDay anchor', () => {
  const logs = [
    { date: '2026-06-12', cycle: { cycleDay: 12, phase: 'follicular' } },
    { date: '2026-06-01', cycle: { periodStart: true, cycleDay: 1, phase: 'menstrual' } },
  ];
  const start = findLatestPeriodStart(logs);
  assert.equal(start?.date, '2026-06-01');
  assert.equal(start?.explicit, true);
});

test('findLatestPeriodStart accepts backward-compat day 1 menstrual', () => {
  const logs = [{ date: '2026-05-20', cycle: { cycleDay: 1, phase: 'menstrual', flow: 'light' } }];
  assert.equal(findLatestPeriodStart(logs)?.date, '2026-05-20');
});

test('computeCycleDayFromPeriodStart counts day 1 on start date', () => {
  assert.equal(computeCycleDayFromPeriodStart('2026-06-01', '2026-06-01'), 1);
  assert.equal(computeCycleDayFromPeriodStart('2026-06-01', '2026-06-10'), 10);
  assert.equal(computeCycleDayFromPeriodStart('2026-06-10', '2026-06-01'), null);
});

test('daysSincePeriodStart returns whole days since anchor', () => {
  assert.equal(daysSincePeriodStart('2026-06-01', '2026-06-01'), 0);
  assert.equal(daysSincePeriodStart('2026-06-01', '2026-06-10'), 9);
});

test('isCycleDayLate uses ACOG-style 35-day threshold', () => {
  assert.equal(isCycleDayLate(35), false);
  assert.equal(isCycleDayLate(36), true);
});

test('suggestCycleForDate uses period start when both anchors exist', () => {
  const logs = [
    { date: '2026-06-10', cycle: { cycleDay: 5, phase: 'menstrual' } },
    { date: '2026-06-01', cycle: { periodStart: true, cycleDay: 1, phase: 'menstrual' } },
  ];
  const result = suggestCycleForDate(logs, '2026-06-15');
  assert.equal(result?.cycleDay, 15);
  assert.equal(result?.periodStartDate, '2026-06-01');
  assert.equal(result?.fromDate, '2026-06-01');
});

test('suggestCycleForDate legacy path without periodStart', () => {
  const logs = [{ date: '2026-06-10', cycle: { cycleDay: 5, phase: 'menstrual' } }];
  const result = suggestCycleForDate(logs, '2026-06-15');
  assert.equal(result?.cycleDay, 10);
  assert.equal(result?.fromDate, '2026-06-10');
  assert.equal(result?.periodStartDate, undefined);
});

test('suggestCycleForDate marks late cycles above normal max', () => {
  const logs = [{ date: '2026-06-01', cycle: { periodStart: true, cycleDay: 1, phase: 'menstrual' } }];
  const result = suggestCycleForDate(logs, '2026-07-10');
  assert.equal(result?.cycleDay, 40);
  assert.equal(result?.late, true);
});

test('normalizeCycleFields preserves periodStart when true', () => {
  const out = normalizeCycleFields({ periodStart: true, cycleDay: 1, phase: 'menstrual' });
  assert.equal(out?.periodStart, true);
  assert.equal(out?.cycleDay, 1);
});

test('normalizeCycleFields omits periodStart when false', () => {
  const out = normalizeCycleFields({ periodStart: false, cycleDay: 3, phase: 'menstrual' });
  assert.equal(out?.periodStart, undefined);
});
