/** Plan 23 CM2 — "People like me" cohort benchmark cards (extends RE1). */

export const COHORT_MIN_K = 5;

export function buildCohortBenchmarkCard(poolInsights, condition) {
  if (!poolInsights || typeof poolInsights !== 'object') {
    return { visible: false, reason: 'no_data' };
  }
  const n = poolInsights.contributor_count ?? poolInsights.contributorCount ?? 0;
  if (n < COHORT_MIN_K) {
    return { visible: false, reason: 'k_anon_suppressed', contributorCount: n };
  }
  return {
    visible: true,
    condition: condition || poolInsights.condition_tag || 'your condition',
    contributorCount: n,
    metrics: [
      { key: 'sleep', label: 'average sleep', value: poolInsights.avg_sleep_hours, unit: 'h' },
      { key: 'pain', label: 'average pain on flare days', value: poolInsights.avg_pain_flare, unit: '/10' },
      { key: 'fatigue', label: 'average fatigue', value: poolInsights.avg_fatigue, unit: '/10' },
    ].filter((m) => m.value != null),
  };
}
