export {
  AIEngine,
  analyzeHealthMetrics,
  predictFutureValues,
  suggestLogNote,
  generateAnalysisNote,
  runDeterministicAnalysis,
  rankNeuralAnalysisInsights,
  summarizeLogsForAi,
} from '@rianell/ai-engine';

export type PredictedPoint = {
  dayOffset: number;
  value: number;
  lower: number;
  upper: number;
};
