export {
  AIEngine,
  analyzeHealthMetrics,
  predictFutureValues,
  suggestLogNote,
  generateAnalysisNote,
  runDeterministicAnalysis,
  rankNeuralAnalysisInsights,
  summarizeLogsForAi,
  buildCorrelationCards,
  buildFlarePostMortem,
  correlationConfidenceLevel,
} from '@rianell/ai-engine';

export type PredictedPoint = {
  dayOffset: number;
  value: number;
  lower: number;
  upper: number;
};
