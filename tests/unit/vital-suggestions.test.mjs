import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

describe('vitalSuggestions', () => {
  test('findLatestVitalSuggestion returns BP with bpm when available', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [
      { date: '2026-06-01', bloodPressureSystolic: 120, bpm: 65 },
      { date: '2026-06-10', bloodPressureSystolic: 118, bpm: 72 },
    ];
    const row = findLatestVitalSuggestion(logs, 'bloodPressure', '2026-06-20');
    assert.equal(row.fromDate, '2026-06-10');
    assert.equal(row.values.bloodPressureSystolic, 118);
    assert.equal(row.values.bpm, 72);
    assert.equal(row.displayValue, '118 mmHg / 72 bpm');
  });

  test('findLatestVitalSuggestion returns systolic-only BP when bpm missing', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [
      { date: '2026-06-01', bloodPressureSystolic: 120 },
      { date: '2026-06-02', bloodPressureSystolic: 118, bloodPressureDiastolic: 76 },
    ];
    const row = findLatestVitalSuggestion(logs, 'bloodPressure', '2026-06-10');
    assert.equal(row.fromDate, '2026-06-02');
    assert.equal(row.displayValue, '118 mmHg');
  });

  test('findLatestVitalSuggestion converts bodyWeight to lb when requested', async () => {
    const { findLatestVitalSuggestion } = await import('@rianell/shared');
    const logs = [{ date: '2026-06-01', bodyWeight: 80, bodyWeightUnit: 'kg' }];
    const row = findLatestVitalSuggestion(logs, 'bodyWeight', '2026-06-10', { unitPrefs: { bodyWeightUnit: 'lbs' } });
    assert.equal(row.values.bodyWeightUnit, 'lbs');
    assert.ok(row.values.bodyWeight > 170 && row.values.bodyWeight < 178);
  });
});
