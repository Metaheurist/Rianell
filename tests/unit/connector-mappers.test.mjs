import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapStravaActivitiesToPartialLogs,
  mapWithingsMeasuresToPartialLogs,
  mergeWithingsPartialLogs,
  rowsToPartialLogs,
  partialLogsToRows,
  mergeSheetRoundTrip,
  parseGoogleSheetId,
  createOAuthState,
  verifyOAuthState,
  OAUTH_CONNECTOR_IDS,
} from '@rianell/shared';

test('mapStravaActivitiesToPartialLogs groups by date', () => {
  const entries = mapStravaActivitiesToPartialLogs([
    { name: 'Morning Run', start_date_local: '2026-06-01T08:00:00', moving_time: 1800 },
    { name: 'Ride', start_date_local: '2026-06-01T18:00:00', moving_time: 3600 },
  ]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].date, '2026-06-01');
  assert.equal(entries[0].exercise.length, 2);
  assert.equal(entries[0].exercise[0].duration, 30);
});

test('mapWithingsMeasuresToPartialLogs maps weight and bpm', () => {
  const entries = mapWithingsMeasuresToPartialLogs([
    { date: 1717200000, measures: [{ type: 1, value: 755, unit: -1 }, { type: 11, value: 72, unit: 0 }] },
  ]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].weight, '75.5');
  assert.equal(entries[0].bpm, 72);
});

test('google sheets round-trip preserves core fields', () => {
  const logs = [{ date: '2026-06-01', bpm: 70, weight: '75', notes: 'ok' }];
  const round = mergeSheetRoundTrip(logs);
  assert.equal(round.length, 1);
  assert.equal(round[0].date, '2026-06-01');
  assert.equal(round[0].bpm, 70);
  assert.equal(round[0].weight, '75');
});

test('parseGoogleSheetId extracts id from URL', () => {
  assert.equal(
    parseGoogleSheetId('https://docs.google.com/spreadsheets/d/abc123_XYZ/edit'),
    'abc123_XYZ',
  );
});

test('oauth state sign and verify', async () => {
  const secret = 'test-secret-key-for-hmac-signing';
  const state = await createOAuthState({ userId: 'u1', provider: 'strava', secret, ttlSec: 60 });
  const payload = await verifyOAuthState(state, secret);
  assert.ok(payload);
  assert.equal(payload.userId, 'u1');
  assert.equal(payload.provider, 'strava');
});

test('OAUTH_CONNECTOR_IDS includes google-sheets slug', () => {
  assert.ok(OAUTH_CONNECTOR_IDS.includes('google-sheets'));
});

test('rowsToPartialLogs respects header map', () => {
  const rows = [
    ['date', 'bpm', 'notes'],
    ['2026-06-02', '68', 'fine'],
  ];
  const logs = rowsToPartialLogs(rows);
  assert.equal(logs[0].date, '2026-06-02');
  assert.equal(logs[0].bpm, 68);
});

test('mergeWithingsPartialLogs merges same date', () => {
  const merged = mergeWithingsPartialLogs(
    [{ date: '2026-06-01', weight: '70' }],
    [{ date: '2026-06-01', bpm: 65 }],
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].weight, '70');
  assert.equal(merged[0].bpm, 65);
});
