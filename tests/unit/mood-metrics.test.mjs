import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectMoodReadings,
  summarizeMoodMetrics,
  moodQualitativeKey,
} from '@rianell/shared';

const LOGS = [
  {
    date: '2026-06-10',
    mood: 6,
    subEntries: [{ id: '2026-06-10-AM', period: 'AM', mood: 5 }],
  },
  {
    date: '2026-06-11',
    subEntries: [
      { id: '2026-06-11-AM', period: 'AM', mood: 7 },
      { id: '2026-06-11-PM', period: 'PM', mood: 8 },
    ],
  },
  { date: '2026-06-12', mood: 4 },
];

test('collectMoodReadings gathers daily mood and check-in sub-entries', () => {
  const readings = collectMoodReadings(LOGS, 14, '2026-06-12');
  assert.equal(readings.length, 5);
  assert.ok(readings.some((r) => r.source === 'daily' && r.mood === 6));
  assert.ok(readings.some((r) => r.source === 'checkin' && r.period === 'PM' && r.mood === 8));
});

test('summarizeMoodMetrics computes average and trend', () => {
  const summary = summarizeMoodMetrics(LOGS, { days: 14, todayStr: '2026-06-12', moodTarget: 6 });
  assert.equal(summary.count, 5);
  assert.ok(summary.average != null && summary.average > 0);
  assert.ok(['up', 'down', 'stable'].includes(summary.trend));
  assert.equal(summary.atTargetCount + summary.belowTargetCount, 5);
  assert.ok(summary.dailyAverages.length >= 3);
});

test('moodQualitativeKey maps score bands', () => {
  assert.equal(moodQualitativeKey(2), 'mood.qualitative.low');
  assert.equal(moodQualitativeKey(9), 'mood.qualitative.good');
});
