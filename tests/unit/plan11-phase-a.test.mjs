import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMedianLogTimeMinutes,
  resolveSmartReminderTime,
  resolveMissedLogNudgeTimeHHMM,
  shouldFireMissedLogNudge,
  stampLogSavedAtForSave,
  hasLoggedToday,
  addMinutesToHHMM,
  SMART_REMINDER_MIN_SAMPLES,
} from '@rianell/shared';

const TODAY = '2026-06-19';

function logAt(date, hour, minute) {
  const d = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  return { date, savedAt: d.toISOString(), mood: 6 };
}

test('computeMedianLogTimeMinutes needs min samples', () => {
  const logs = [
    logAt('2026-06-17', 19, 0),
    logAt('2026-06-18', 19, 30),
  ];
  assert.equal(computeMedianLogTimeMinutes(logs, { todayStr: TODAY, minSamples: SMART_REMINDER_MIN_SAMPLES }), null);
});

test('resolveSmartReminderTime learns median from savedAt', () => {
  const logs = [
    logAt('2026-06-15', 18, 0),
    logAt('2026-06-16', 19, 0),
    logAt('2026-06-17', 20, 0),
    logAt('2026-06-18', 21, 0),
  ];
  const { time, learned } = resolveSmartReminderTime(logs, '20:00', { todayStr: TODAY });
  assert.equal(learned, true);
  assert.equal(time, '19:30');
});

test('resolveMissedLogNudgeTimeHHMM adds grace minutes', () => {
  const logs = [
    logAt('2026-06-15', 20, 0),
    logAt('2026-06-16', 20, 0),
    logAt('2026-06-17', 20, 0),
  ];
  const { time } = resolveMissedLogNudgeTimeHHMM(logs, '20:00', { todayStr: TODAY, graceMinutes: 30 });
  assert.equal(time, addMinutesToHHMM('20:00', 30));
});

test('shouldFireMissedLogNudge fires after nudge time when not logged', () => {
  const logs = [
    logAt('2026-06-15', 20, 0),
    logAt('2026-06-16', 20, 0),
    logAt('2026-06-17', 20, 0),
  ];
  const before = new Date(`${TODAY}T20:15:00`);
  const after = new Date(`${TODAY}T20:35:00`);
  assert.equal(shouldFireMissedLogNudge(logs, before, { todayStr: TODAY, fallbackHHMM: '20:00' }).fire, false);
  const fired = shouldFireMissedLogNudge(logs, after, { todayStr: TODAY, fallbackHHMM: '20:00' });
  assert.equal(fired.fire, true);
});

test('shouldFireMissedLogNudge skips when logged today', () => {
  const logs = [
    logAt('2026-06-15', 20, 0),
    logAt('2026-06-16', 20, 0),
    logAt('2026-06-17', 20, 0),
    { date: TODAY, mood: 7, savedAt: new Date(`${TODAY}T09:00:00`).toISOString() },
  ];
  const after = new Date(`${TODAY}T21:00:00`);
  assert.equal(shouldFireMissedLogNudge(logs, after, { todayStr: TODAY }).fire, false);
  assert.equal(hasLoggedToday(logs, TODAY), true);
});

test('stampLogSavedAtForSave preserves first save per day', () => {
  const existing = { date: TODAY, savedAt: '2026-06-19T08:00:00.000Z', mood: 6 };
  const next = stampLogSavedAtForSave({ date: TODAY, mood: 7 }, existing);
  assert.equal(next.savedAt, existing.savedAt);
  const fresh = stampLogSavedAtForSave({ date: TODAY, mood: 7 }, null, new Date('2026-06-19T12:00:00Z'));
  assert.equal(fresh.savedAt, '2026-06-19T12:00:00.000Z');
});
