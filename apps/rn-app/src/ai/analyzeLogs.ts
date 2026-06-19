export type AiRange = 14 | 30 | 90 | 'all';
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
export type SummarizeOptions = { translate?: TranslateFn };

export {
  filterLogsByRange,
  summarizeLogsForAi,
  runDeterministicAnalysis,
  rankNeuralAnalysisInsights,
  buildInsightWhy,
  computeTriggerHypotheses,
  detectMetricAnomalies,
  buildWeeklyDigest,
  compareTreatmentWindows,
  applyConditionPack,
  exportAnalysisJsonForResearch,
} from '@rianell/ai-engine';

import { summarizeLogsForAi } from '@rianell/ai-engine';

export type AiSummary = ReturnType<typeof summarizeLogsForAi>;
