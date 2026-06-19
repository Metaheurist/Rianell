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
  buildCyclePhaseBands,
  cycleBandsToApexAnnotations,
  compareChartPeriods,
  buildPacingChartSeries,
  CYCLE_PHASE_COLORS,
} from '@rianell/ai-engine';

export type PredictedPoint = {
  dayOffset: number;
  value: number;
  lower: number;
  upper: number;
};
