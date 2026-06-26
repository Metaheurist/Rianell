import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMigrationCsv, MIGRATION_SOURCES } from '@rianell/shared';

test('parseMigrationCsv maps Bearable export', () => {
  const csv = 'Date,Mood,Fatigue,Notes\n2026-06-01,7,5,Good day';
  const rows = parseMigrationCsv(csv, 'bearable');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].mood, 7);
});

test('parseMigrationCsv maps Flaredown export', () => {
  const csv = 'date,mood,fatigue,notes\n2026-06-02,6,4,Okay';
  const rows = parseMigrationCsv(csv, 'flaredown');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].fatigue, 4);
});

test('migration sources include plan 25 apps', () => {
  const ids = MIGRATION_SOURCES.map((s) => s.id);
  assert.ok(ids.includes('bearable'));
  assert.ok(ids.includes('flaredown'));
  assert.ok(ids.includes('cara'));
});
