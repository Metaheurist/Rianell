import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCyclePhaseBands,
  cycleBandsToApexAnnotations,
  compareChartPeriods,
  buildPacingChartSeries,
} from '@rianell/ai-engine';

const FIXTURE = [
  { date: '2026-05-28', mood: 6, sleep: 7, fatigue: 4, flare: 'No', cycle: { phase: 'follicular', cycleDay: 8 } },
  { date: '2026-05-29', mood: 6, sleep: 7, fatigue: 4, flare: 'No', cycle: { phase: 'follicular', cycleDay: 9 } },
  { date: '2026-05-30', mood: 5, sleep: 6, fatigue: 5, flare: 'No', cycle: { phase: 'ovulation', cycleDay: 14 } },
  { date: '2026-06-01', mood: 4, sleep: 5, fatigue: 7, flare: 'Yes', cycle: { phase: 'luteal', cycleDay: 20 } },
  { date: '2026-06-02', mood: 5, sleep: 6, fatigue: 6, flare: 'No', cycle: { phase: 'luteal', cycleDay: 21 }, exercise: [{ name: 'Walk', duration: 30 }] },
  { date: '2026-06-03', mood: 6, sleep: 7, fatigue: 5, flare: 'No', exercise: [{ name: 'Yoga', duration: 20 }] },
  { date: '2026-06-04', mood: 7, sleep: 8, fatigue: 3, flare: 'No' },
];

test('buildCyclePhaseBands groups consecutive cycle phases', () => {
  const { bands, markers } = buildCyclePhaseBands(FIXTURE);
  assert.ok(bands.length >= 2);
  assert.ok(markers.length >= 4);
  assert.equal(bands[0].phase, 'follicular');
});

test('cycleBandsToApexAnnotations returns xaxis regions', () => {
  const { bands } = buildCyclePhaseBands(FIXTURE);
  const anns = cycleBandsToApexAnnotations(bands);
  assert.ok(anns.length >= 1);
  assert.ok(Number.isFinite(anns[0].x));
});

test('compareChartPeriods compares month windows', () => {
  const cmp = compareChartPeriods(FIXTURE, { refDate: '2026-06-04' });
  assert.ok(cmp);
  assert.ok(cmp.current.stats.logDays >= 1);
  assert.ok(cmp.previous.label);
  assert.ok(typeof cmp.deltas.flareDays === 'number');
});

test('buildPacingChartSeries returns planned vs actual vs fatigue', () => {
  const series = buildPacingChartSeries(FIXTURE, 'all');
  assert.ok(series.length >= 4);
  const withExercise = series.find((s) => s.actual > 0);
  assert.ok(withExercise);
  assert.ok(withExercise.planned >= 1);
});
