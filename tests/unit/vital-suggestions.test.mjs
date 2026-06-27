import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

describe('vitalSuggestions', () => {
  test('findLatestVitalSuggestion returns most recent past log for bpm', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [
      { date: '2026-06-01', bpm: 60 },
      { date: '2026-06-10', bpm: 72 },
      { date: '2026-06-15', bpm: 80 },
    ];
    const row = findLatestVitalSuggestion(logs, 'bpm', '2026-06-20');
    assert.equal(row.fromDate, '2026-06-15');
    assert.equal(row.values.bpm, 80);
    assert.equal(row.displayValue, '80 bpm');
  });

  test('findLatestVitalSuggestion skips same-day log and future logs', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [
      { date: '2026-06-20', bpm: 99 },
      { date: '2026-06-21', bpm: 88 },
      { date: '2026-06-18', bpm: 70 },
    ];
    const row = findLatestVitalSuggestion(logs, 'bpm', '2026-06-20');
    assert.equal(row.fromDate, '2026-06-18');
    assert.equal(row.values.bpm, 70);
  });

  test('findLatestVitalSuggestion converts weight to lb when requested', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [{ date: '2026-06-01', weight: '80' }];
    const row = findLatestVitalSuggestion(logs, 'weight', '2026-06-10', { unitPrefs: { weightUnit: 'lb' } });
    assert.equal(row.values.weightUnit, 'lb');
    assert.ok(row.values.weight > 170 && row.values.weight < 178);
  });

  test('findLatestVitalSuggestion requires both BP values', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [
      { date: '2026-06-01', bloodPressureSystolic: 120 },
      { date: '2026-06-02', bloodPressureSystolic: 118, bloodPressureDiastolic: 76 },
    ];
    const row = findLatestVitalSuggestion(logs, 'bloodPressure', '2026-06-10');
    assert.equal(row.fromDate, '2026-06-02');
    assert.equal(row.displayValue, '118/76 mmHg');
  });
});
