import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldFireStreakReminderNudge,
  buildStreakReminderNotificationContent,
  STREAK_REMINDER_MIN_STREAK,
  isGoodDayLog,
} from '@rianell/shared';

const TODAY = '2026-06-19';
const YESTERDAY = '2026-06-18';
const DAY_BEFORE = '2026-06-17';

function goodLog(date) {
  return { date, flare: 'No', mood: 7, savedAt: `${date}T09:00:00.000Z` };
}

test('shouldFireStreakReminderNudge fires after nudge time with active good-day streak', () => {
  const logs = [goodLog(YESTERDAY), goodLog(DAY_BEFORE)];
  const now = new Date(`${TODAY}T21:00:00`);
  const result = shouldFireStreakReminderNudge(logs, now, {
    enabled: true,
    fallbackHHMM: '20:00',
    todayStr: TODAY,
  });
  assert.equal(result.fire, true);
  assert.equal(result.goodDayStreak, 2);
  assert.equal(STREAK_REMINDER_MIN_STREAK, 2);
});

test('shouldFireStreakReminderNudge skips when H3 streak card dismissed', () => {
  const logs = [goodLog(YESTERDAY), goodLog(DAY_BEFORE)];
  const now = new Date(`${TODAY}T21:00:00`);
  const result = shouldFireStreakReminderNudge(logs, now, {
    enabled: true,
    homeStreakCardDismissed: true,
    todayStr: TODAY,
  });
  assert.equal(result.fire, false);
  assert.equal(result.reason, 'h3-dismissed');
});

test('shouldFireStreakReminderNudge prefers streak message over generic once per day', () => {
  const logs = [goodLog(YESTERDAY), goodLog(DAY_BEFORE)];
  const now = new Date(`${TODAY}T21:00:00`);
  const second = shouldFireStreakReminderNudge(logs, now, {
    enabled: true,
    lastNudgeDate: TODAY,
    todayStr: TODAY,
  });
  assert.equal(second.fire, false);
  assert.equal(second.reason, 'already-nudged');
});

test('shouldFireStreakReminderNudge respects user disable', () => {
  const logs = [goodLog(YESTERDAY), goodLog(DAY_BEFORE)];
  const result = shouldFireStreakReminderNudge(logs, new Date(`${TODAY}T21:00:00`), {
    enabled: false,
    todayStr: TODAY,
  });
  assert.equal(result.fire, false);
  assert.equal(result.reason, 'disabled');
});

test('buildStreakReminderNotificationContent stays achievement-free', () => {
  const content = buildStreakReminderNotificationContent({ goodDayStreak: 3, flareFreeDays: 4 });
  assert.match(content.title, /patterns/i);
  assert.match(content.body, /no scores/i);
  assert.equal(content.url, '/?quick=true');
});

test('isGoodDayLog qualifies calm days for streak pairing', () => {
  assert.equal(isGoodDayLog({ flare: 'No', mood: 7 }), true);
  assert.equal(isGoodDayLog({ flare: 'Yes', mood: 8 }), false);
});
