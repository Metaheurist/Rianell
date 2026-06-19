import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeCustomMetricLabel,
  normalizeCustomChartMetrics,
  normalizeCustomMetricValues,
  customMetricFieldKey,
} from '@rianell/shared';
import { buildBalanceRadarData } from '@rianell/ai-engine';

test('sanitizeCustomMetricLabel strips HTML and unsafe chars', () => {
  assert.equal(sanitizeCustomMetricLabel('<b>Pain</b>'), 'Pain');
  assert.equal(sanitizeCustomMetricLabel('A & B'), 'A  B');
});

test('normalizeCustomChartMetrics caps count and validates ids', () => {
  const defs = normalizeCustomChartMetrics([
    { id: 'brain-fog', label: 'Brain fog', type: 'scale' },
    { id: 'BAD ID!', label: 'Bad', type: 'scale' },
    { id: 'flare-risk', label: 'Flare risk', type: 'boolean' },
  ]);
  assert.equal(defs.length, 2);
  assert.equal(defs[0].id, 'brain-fog');
  assert.equal(defs[1].type, 'boolean');
});

test('normalizeCustomMetricValues clamps scale and accepts booleans', () => {
  const vals = normalizeCustomMetricValues({ fog: 12, ok: true, bad: 'nope' });
  assert.equal(vals.fog, 10);
  assert.equal(vals.ok, true);
  assert.equal(vals.bad, undefined);
});

test('buildBalanceRadarData returns spider series with custom metrics', () => {
  const logs = [
    { date: '2026-06-01', mood: 6, sleep: 7, fatigue: 4, customMetrics: { fog: 5 } },
    { date: '2026-06-02', mood: 5, sleep: 6, fatigue: 5, customMetrics: { fog: 7 } },
    { date: '2026-06-03', mood: 7, sleep: 8, fatigue: 3, customMetrics: { fog: 6 } },
  ];
  const custom = [{ id: 'fog', label: 'Brain fog', type: 'scale', color: '#9c27b0' }];
  const radar = buildBalanceRadarData(logs, {
    selectedFields: ['mood', 'sleep', 'fatigue', customMetricFieldKey('fog')],
    customMetrics: custom,
  });
  assert.ok(radar.labels.length >= 3);
  assert.equal(radar.values.length, radar.labels.length);
  assert.ok(radar.metrics.some((m) => m.field === 'custom_fog'));
});
