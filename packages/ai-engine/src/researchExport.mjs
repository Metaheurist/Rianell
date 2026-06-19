export function exportAnalysisJsonForResearch(analysis, options = {}) {
  const optIn = options.optIn === true;
  if (!optIn) throw new Error('Research export requires explicit opt-in.');
  const payload = {
    format: 'rianell-analysis-v1',
    exportedAt: new Date().toISOString(),
    rangeLabel: analysis?.summary?.rangeLabel ?? null,
    totalLogs: analysis?.summary?.totalLogs ?? 0,
    prioritisedInsightIds: (analysis?.insights || []).map((i) => i.id),
    triggerHypothesisIds: (analysis?.triggerHypotheses || []).map((h) => h.id),
    anomalyIds: (analysis?.anomalies || []).map((a) => a.id),
    aggregates: {
      avgMood: analysis?.summary?.avgMood ?? null,
      avgSleep: analysis?.summary?.avgSleep ?? null,
      avgFatigue: analysis?.summary?.avgFatigue ?? null,
      flareDays: analysis?.summary?.flareDays ?? 0,
    },
  };
  return JSON.stringify(payload, null, 2);
}
