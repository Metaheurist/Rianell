import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOG_CSV_ENGLISH_HEADERS,
  logsToCsv,
  parseLogsCsv,
  normalizeLogEntry,
} from '@rianell/shared';

test('logsToCsv and parseLogsCsv round-trip core fields', () => {
  const logs = [
    normalizeLogEntry({
      date: '2026-06-18',
      bpm: 72,
      mood: 7,
      notes: 'felt ok',
    }),
  ];
  const csv = logsToCsv(logs, (id) => LOG_CSV_ENGLISH_HEADERS[id] || id);
  assert.match(csv, /^Date,BPM/);
  const parsed = parseLogsCsv(csv, LOG_CSV_ENGLISH_HEADERS);
  assert.equal(parsed.length, 1);
  const entry = normalizeLogEntry(parsed[0]);
  assert.equal(entry.date, '2026-06-18');
  assert.equal(entry.bpm, 72);
  assert.equal(entry.mood, 7);
  assert.equal(entry.notes, 'felt ok');
});

test('parseLogsCsv accepts localized header aliases', () => {
  const csv = 'Datum,BPM,Stimmung\n2026-06-01,80,6\n';
  const aliasMap = {
    date: ['Date', 'Datum'],
    bpm: ['BPM'],
    mood: ['Mood', 'Stimmung'],
  };
  const parsed = parseLogsCsv(csv, aliasMap);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].date, '2026-06-01');
  assert.equal(parsed[0].bpm, '80');
});
