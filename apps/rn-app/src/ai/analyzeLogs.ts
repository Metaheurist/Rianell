export type AiRange = 14 | 30 | 90 | 'all';
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
export type SummarizeOptions = { translate?: TranslateFn };

import {
  summarizeLogsForAi as summarizeLogsForAiCore,
  runDeterministicAnalysis as runDeterministicAnalysisCore,
  filterLogsByRange,
  rankNeuralAnalysisInsights,
  buildInsightWhy,
  computeTriggerHypotheses,
  detectMetricAnomalies,
  buildWeeklyDigest,
  compareTreatmentWindows,
  applyConditionPack,
  exportAnalysisJsonForResearch,
} from '@rianell/ai-engine';

export {
  filterLogsByRange,
  rankNeuralAnalysisInsights,
  buildInsightWhy,
  computeTriggerHypotheses,
  detectMetricAnomalies,
  buildWeeklyDigest,
  compareTreatmentWindows,
  applyConditionPack,
  exportAnalysisJsonForResearch,
};

export function summarizeLogsForAi(
  logs: Parameters<typeof summarizeLogsForAiCore>[0],
  range: AiRange = 30,
  options: SummarizeOptions = {},
) {
  return summarizeLogsForAiCore(logs, range, options);
}

export function runDeterministicAnalysis(
  logs: Parameters<typeof runDeterministicAnalysisCore>[0],
  range: AiRange = 30,
  options: Parameters<typeof runDeterministicAnalysisCore>[2] = {},
) {
  return runDeterministicAnalysisCore(logs, range, options);
}

export type AiSummary = ReturnType<typeof summarizeLogsForAi>;
