import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMigrationCsv } from '../../packages/shared/src/import/migrationAssistants.mjs';

const BEARABLE_CSV = `Date,Mood,Sleep,Note
2026-06-18,5,7,morning`;

const FLAREDOWN_CSV = `date,fatigue,journal
2026-06-18,5,tired`;

test('parseMigrationCsv maps Bearable export', () => {
  const logs = parseMigrationCsv(BEARABLE_CSV, 'bearable');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].date, '2026-06-18');
  assert.equal(logs[0].notes, 'morning');
});

test('parseMigrationCsv maps Flaredown export', () => {
  const logs = parseMigrationCsv(FLAREDOWN_CSV, 'flaredown');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].date, '2026-06-18');
  assert.equal(logs[0].notes, 'tired');
});
