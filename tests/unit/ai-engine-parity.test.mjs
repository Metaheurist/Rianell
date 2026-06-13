import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHealthMetrics, predictFutureValues } from '@rianell/ai-engine';

test('analyzeHealthMetrics returns summary for logs', () => {
  const logs = [
    { date: '2026-06-10', mood: 7, sleep: 6, fatigue: 4, flare: 'No' },
    { date: '2026-06-11', mood: 8, sleep: 7, fatigue: 3, flare: 'No' },
  ];
  const result = analyzeHealthMetrics(logs, 30);
  assert.equal(result.totalLogs, 2);
  assert.ok(result.avgMood != null);
});

test('predictFutureValues returns forecast points', () => {
  const pts = predictFutureValues([5, 6, 7, 6], 2);
  assert.equal(pts.length, 2);
  assert.ok(Number.isFinite(pts[0].value));
});
