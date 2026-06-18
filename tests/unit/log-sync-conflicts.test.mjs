import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findLogSyncConflicts,
  mergeHealthLogsWithConflictPolicy,
} from '@rianell/shared';

test('findLogSyncConflicts detects same-date divergence', () => {
  const local = [{ date: '2026-06-18', mood: 3, bpm: 70 }];
  const cloud = [{ date: '2026-06-18', mood: 8, bpm: 70 }];
  const conflicts = findLogSyncConflicts(local, cloud);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].date, '2026-06-18');
});

test('mergeHealthLogsWithConflictPolicy picks local or cloud', () => {
  const local = [{ date: '2026-06-18', mood: 3 }];
  const cloud = [{ date: '2026-06-18', mood: 8 }];
  const keepLocal = mergeHealthLogsWithConflictPolicy(local, cloud, 'local');
  assert.equal(keepLocal.length, 1);
  assert.equal(keepLocal[0].mood, 3);
  const keepCloud = mergeHealthLogsWithConflictPolicy(local, cloud, 'cloud');
  assert.equal(keepCloud[0].mood, 8);
});
