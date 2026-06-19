import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listTodayMedDoseReminders,
  shouldFireMedDoseReminder,
  hasEnabledMedSchedule,
  medDoseReminderNotificationId,
  evaluateFatigueWeekAnomaly,
  shouldFireFlareRiskNudge,
  isoWeekKey,
} from '@rianell/shared';

const TODAY = '2026-06-19';
const SCHEDULE = [{ id: 'm1', drug: 'Ibuprofen', dose: '200mg', times: ['08:00', '20:00'], enabled: true }];

test('hasEnabledMedSchedule detects active L3 schedule', () => {
  assert.equal(hasEnabledMedSchedule(SCHEDULE), true);
  assert.equal(hasEnabledMedSchedule([{ id: 'x', drug: 'A', dose: '', times: [], enabled: true }]), false);
});

test('shouldFireMedDoseReminder fires within due window', () => {
  const dose = { drug: 'Ibuprofen', scheduledAt: `${TODAY}T08:00`, status: 'pending' };
  const now = new Date(`${TODAY}T08:00:30`);
  const result = shouldFireMedDoseReminder(dose, now, { todayStr: TODAY });
  assert.equal(result.fire, true);
  assert.equal(result.reason, 'due-now');
});

test('listTodayMedDoseReminders marks upcoming doses for scheduling', () => {
  const now = new Date(`${TODAY}T07:30:00`);
  const items = listTodayMedDoseReminders(SCHEDULE, [], now, { todayStr: TODAY });
  assert.equal(items.length, 2);
  assert.equal(items[0].schedule, true);
  assert.equal(items[0].fire, false);
});

test('medDoseReminderNotificationId is stable', () => {
  assert.equal(medDoseReminderNotificationId('2026-06-19T08:00'), 'rianell-med-dose-20260619T0800');
});

function buildFatigueSpikeLogs() {
  const logs = [];
  for (let d = 1; d <= 10; d += 1) {
    logs.push({ date: `2026-05-${String(d + 10).padStart(2, '0')}`, fatigue: 3 + (d % 2) });
  }
  for (let d = 12; d <= 19; d += 1) {
    logs.push({ date: `2026-06-${String(d).padStart(2, '0')}`, fatigue: 9 });
  }
  return logs;
}

test('evaluateFatigueWeekAnomaly detects elevated fatigue week', () => {
  const evalResult = evaluateFatigueWeekAnomaly(buildFatigueSpikeLogs());
  assert.equal(evalResult.elevated, true);
  assert.ok(evalResult.severity === 'high' || evalResult.severity === 'medium');
});

test('shouldFireFlareRiskNudge fires once per ISO week', () => {
  const logs = buildFatigueSpikeLogs();
  const now = new Date(`${TODAY}T12:00:00`);
  const week = isoWeekKey(now);
  const first = shouldFireFlareRiskNudge(logs, now, {});
  assert.equal(first.fire, true);
  assert.equal(first.week, week);
  const second = shouldFireFlareRiskNudge(logs, now, { lastNudgeWeek: week });
  assert.equal(second.fire, false);
});
