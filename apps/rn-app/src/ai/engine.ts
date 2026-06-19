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

export type FlarePostMortemResult = {
  flareDate: string;
  windowDays: number;
  beforeDays: number;
  afterDays: number;
  metrics: Array<{
    key: string;
    label: string;
    beforeAvg: number | null;
    afterAvg: number | null;
    delta: number | null;
    diverged: boolean;
  }>;
  diverging: Array<{
    key: string;
    label: string;
    beforeAvg: number | null;
    afterAvg: number | null;
    delta: number | null;
    diverged: boolean;
  }>;
};

export type PacingChartRow = {
  date: string;
  planned: number;
  actual: number;
  rawActual: number;
  fatigue: number | null;
  overpaced: boolean;
};
