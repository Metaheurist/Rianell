import { summarizeLogsForAi } from './summarize.mjs';
import {
  rankPrioritisedInsightsFromSummary,
  collectInsightCandidatesFromSummary,
  rankInsightItems,
  buildInsightWhy,
} from './insightRanking.mjs';
import { computeTriggerHypotheses } from './triggerHypotheses.mjs';
import { detectMetricAnomalies } from './anomalies.mjs';
import { buildWeeklyDigest } from './weeklyDigest.mjs';
import { compareTreatmentWindows } from './treatmentTimeline.mjs';
import { applyConditionPack } from './conditionPacks.mjs';

export function runDeterministicAnalysis(logs, range = 30, options = {}) {
  const summary = summarizeLogsForAi(logs, range, options);
  const selected = summary._selectedLogs || [];
  delete summary._selectedLogs;

  const anomalies = detectMetricAnomalies(selected, options.anomalyOptions);
  const anomalyTexts = anomalies.map((a) => a.message);
  const analysisShape = {
    anomalies: [...summary.important, ...anomalyTexts],
    riskFactors: summary.thingsToWatch,
    correlations: summary.correlations,
    patterns: summary.groupsThatChangeTogether,
  };

  const insights = rankPrioritisedInsightsFromSummary(
    { ...summary, important: analysisShape.anomalies, thingsToWatch: summary.thingsToWatch },
    7,
  );
  const prioritisedInsights = insights.map((i) => i.text);
  const triggerHypotheses = computeTriggerHypotheses(selected, options.triggerOptions);
  const weeklyDigest = buildWeeklyDigest(logs, options.goals);
  const treatmentComparisons = compareTreatmentWindows(logs, options.treatmentStarts);
  const conditionHints = options.conditionPack
    ? applyConditionPack(options.conditionPack, summary)
    : { pack: null, hints: [] };

  const insightsWithWhy = insights.map((insight) => ({
    ...insight,
    why: buildInsightWhy(insight, selected),
  }));

  return {
    summary,
    insights: insightsWithWhy,
    prioritisedInsights,
    triggerHypotheses,
    anomalies,
    weeklyDigest,
    treatmentComparisons,
    conditionHints,
    analysisShape,
  };
}

/** Bridge PWA neural analysis object to shared ranking (A1 parity). */
export function rankNeuralAnalysisInsights(analysis, limit = 7) {
  const items = [];
  const a = analysis || {};
  (a.anomalies || []).forEach((text) => items.push({ text: String(text), score: 0.9, source: 'anomaly' }));
  (a.riskFactors || []).forEach((text) => items.push({ text: String(text), score: 0.85, source: 'risk' }));
  (a.correlations || []).slice(0, 5).forEach((text) => items.push({ text: String(text), score: 0.5, source: 'correlation' }));
  (a.patterns || []).forEach((text) => items.push({ text: String(text), score: 0.4, source: 'pattern' }));
  const ranked = rankInsightItems(items, limit);
  return {
    insights: ranked,
    prioritisedInsights: ranked.map((i) => i.text),
  };
}
