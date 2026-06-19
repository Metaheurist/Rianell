import { summarizeLogsForAi } from './summarize.mjs';
import { runDeterministicAnalysis, rankNeuralAnalysisInsights } from './analyze.mjs';

export { filterLogsByRange, summarizeLogsForAi } from './summarize.mjs';
export {
  collectInsightCandidates,
  collectInsightCandidatesFromSummary,
  rankInsightItems,
  rankPrioritisedInsights,
  rankPrioritisedInsightsFromSummary,
  buildInsightWhy,
} from './insightRanking.mjs';
export { computeTriggerHypotheses } from './triggerHypotheses.mjs';
export { detectMetricAnomalies } from './anomalies.mjs';
export { buildWeeklyDigest } from './weeklyDigest.mjs';
export { compareTreatmentWindows } from './treatmentTimeline.mjs';
export { CONDITION_ANALYSIS_PACKS, applyConditionPack } from './conditionPacks.mjs';
export { exportAnalysisJsonForResearch } from './researchExport.mjs';
export { runDeterministicAnalysis, rankNeuralAnalysisInsights } from './analyze.mjs';

function avg(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function tr(translate, key, params, fallback) {
  if (typeof translate === 'function') {
    const result = translate(key, params);
    if (typeof result === 'string' && result !== key) return result;
  }
  return fallback;
}

/** @deprecated Use summarizeLogsForAi / runDeterministicAnalysis — kept for vendor backward compat */
export function analyzeHealthMetrics(logs, range = 30, options = {}) {  return summarizeLogsForAi(logs, range, options);
}
export function predictFutureValues(series, days = 7) {
  if (!series.length || days < 1) return [];
  const xs = series.map((_, i) => i + 1);
  const ys = series.map((v) => Number(v));
  const xAvg = avg(xs) ?? 0;
  const yAvg = avg(ys) ?? 0;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xAvg) * (ys[i] - yAvg);
    den += (xs[i] - xAvg) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yAvg - slope * xAvg;
  const resid = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const sigma = Math.sqrt((avg(resid.map((r) => r * r)) ?? 0) || 0.5);
  const out = [];
  const lastX = xs[xs.length - 1] ?? 1;
  for (let d = 1; d <= days; d++) {
    const x = lastX + d;
    const raw = slope * x + intercept;
    const value = Math.max(0, Math.min(10, raw));
    const spread = Math.max(0.4, sigma * 1.2);
    out.push({ dayOffset: d, value, lower: Math.max(0, value - spread), upper: Math.min(10, value + spread) });
  }
  return out;
}

export function suggestLogNote(context, options = {}) {
  const translate = options?.translate;
  const parts = [];
  if (context && context.flare === 'Yes') parts.push('Flare day — rest and hydration may help.');
  if (context && typeof context.fatigue === 'number' && context.fatigue >= 7) {
    parts.push(tr(translate, 'ai.template.worsening', { metric: 'Fatigue' }, 'Fatigue is high today.'));
  }
  if (context && typeof context.sleep === 'number' && context.sleep <= 4) parts.push('Sleep was low — gentle pace recommended.');
  if (context && typeof context.mood === 'number' && context.mood <= 4) {
    parts.push(tr(translate, 'ai.template.worsening', { metric: 'Mood' }, 'Mood is low — be kind to yourself today.'));
  }
  if (!parts.length) parts.push('Steady day — note anything that helped or hindered how you felt.');
  return parts.join(' ');
}

export function generateAnalysisNote(summary, options = {}) {
  const translate = options?.translate;
  const parts = [];
  if (summary?.rangeLabel) parts.push(`Range: ${summary.rangeLabel}.`);
  if (summary?.howYouAreDoing?.length) parts.push(summary.howYouAreDoing.join(' '));
  if (summary?.possibleFlareUp?.level) parts.push(`Flare risk: ${summary.possibleFlareUp.level}.`);
  return parts.join(' ') || tr(translate, 'ai.template.noData', {}, 'Keep logging to build a clearer picture.');
}

export const AIEngine = {
  analyzeHealthMetrics,
  predictFutureValues,
  suggestLogNote,
  generateAnalysisNote,
  runDeterministicAnalysis,
  rankNeuralAnalysisInsights,
};
