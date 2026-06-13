import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeHealthLogs } from '@rianell/shared';

test('mergeHealthLogs prefers local over cloud for same date', () => {
  const local = [{ date: '2026-06-01', mood: 8, notes: 'local' }];
  const cloud = [{ date: '2026-06-01', mood: 3, notes: 'cloud' }];
  const merged = mergeHealthLogs(local, cloud);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].mood, 8);
});

test('mergeHealthLogs unions distinct dates', () => {
  const merged = mergeHealthLogs(
    [{ date: '2026-06-01', mood: 5 }],
    [{ date: '2026-06-02', mood: 6 }]
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[0].date, '2026-06-01');
  assert.equal(merged[1].date, '2026-06-02');
});
