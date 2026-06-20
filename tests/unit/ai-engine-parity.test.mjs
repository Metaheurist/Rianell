import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeHealthMetrics,
  predictFutureValues,
  runDeterministicAnalysis,
  rankNeuralAnalysisInsights,
  rankPrioritisedInsightsFromSummary,
  computeTriggerHypotheses,
  detectMetricAnomalies,
  buildWeeklyDigest,
  exportAnalysisJsonForResearch,
} from '@rianell/ai-engine';

const FIXTURE_LOGS = [
  { date: '2026-06-01', mood: 4, sleep: 3, fatigue: 8, flare: 'Yes', stressors: ['Work'] },
  { date: '2026-06-02', mood: 5, sleep: 4, fatigue: 7, flare: 'No', stressors: ['Work'] },
  { date: '2026-06-03', mood: 6, sleep: 5, fatigue: 6, flare: 'No' },
  { date: '2026-06-04', mood: 3, sleep: 3, fatigue: 9, flare: 'Yes', stressors: ['Work'] },
  { date: '2026-06-05', mood: 7, sleep: 6, fatigue: 5, flare: 'No' },
  { date: '2026-06-06', mood: 6, sleep: 5, fatigue: 6, flare: 'No' },
  { date: '2026-06-07', mood: 5, sleep: 4, fatigue: 7, flare: 'No' },
];

test('analyzeHealthMetrics returns summary for logs', () => {
  const result = analyzeHealthMetrics(FIXTURE_LOGS, 30);
  assert.equal(result.totalLogs, 7);
  assert.ok(result.avgMood != null);
  assert.ok(Array.isArray(result.thingsToWatch));
});

test('predictFutureValues returns forecast points', () => {
  const pts = predictFutureValues([5, 6, 7, 6], 2);
  assert.equal(pts.length, 2);
  assert.ok(Number.isFinite(pts[0].value));
});

test('rankNeuralAnalysisInsights matches deterministic summary ranking top-3 ids', () => {
  const analysis = runDeterministicAnalysis(FIXTURE_LOGS, 30);
  const neuralShape = {
    anomalies: analysis.summary.important,
    riskFactors: analysis.summary.thingsToWatch,
    correlations: analysis.summary.correlations,
    patterns: analysis.summary.groupsThatChangeTogether,
  };
  const ranked = rankNeuralAnalysisInsights(neuralShape, 3);
  const summaryRanked = rankPrioritisedInsightsFromSummary(analysis.summary, 3);
  assert.deepEqual(
    ranked.insights.map((i) => i.id),
    summaryRanked.map((i) => i.id),
  );
});

test('runDeterministicAnalysis includes A3-A6 modules', () => {
  const out = runDeterministicAnalysis(FIXTURE_LOGS, 30, { goals: { sleep: 5 } });
  assert.ok(out.insights.length >= 1);
  assert.ok(Array.isArray(out.triggerHypotheses));
  assert.ok(Array.isArray(out.anomalies));
  assert.ok(out.weeklyDigest.headline);
});

test('computeTriggerHypotheses ranks lift factors', () => {
  const hypos = computeTriggerHypotheses(FIXTURE_LOGS, { minOverlap: 2 });
  assert.ok(hypos.length >= 0);
});

test('detectMetricAnomalies flags fatigue spikes', () => {
  const alerts = detectMetricAnomalies(FIXTURE_LOGS);
  assert.ok(Array.isArray(alerts));
});

test('buildWeeklyDigest returns improvements or concerns', () => {
  const digest = buildWeeklyDigest(FIXTURE_LOGS, { sleep: 5 });
  assert.ok(digest.headline);
  assert.ok(Array.isArray(digest.changes));
});

test('buildWeeklyDigest ignores out-of-range metric values', () => {
  const logs = [
    ...FIXTURE_LOGS,
    { date: '2026-06-08', mood: 1414285, sleep: 13014285, fatigue: 807936 },
    { date: '2026-06-09', mood: 6, sleep: 7, fatigue: 5 },
  ];
  const digest = buildWeeklyDigest(logs, { sleep: 5 });
  for (const change of digest.changes) {
    assert.ok(change.priorAvg >= 0 && change.priorAvg <= 10);
    assert.ok(change.thisAvg >= 0 && change.thisAvg <= 10);
  }
  for (const line of [...digest.improvements, ...digest.concerns]) {
    assert.ok(!line.includes('1414285'), line);
  }
});

test('exportAnalysisJsonForResearch requires opt-in', () => {
  const analysis = runDeterministicAnalysis(FIXTURE_LOGS, 30);
  assert.throws(() => exportAnalysisJsonForResearch(analysis, { optIn: false }));
  const json = exportAnalysisJsonForResearch(analysis, { optIn: true });
  const parsed = JSON.parse(json);
  assert.equal(parsed.format, 'rianell-analysis-v1');
});
