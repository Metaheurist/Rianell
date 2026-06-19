const MAX_CONTEXT_CHARS = 720;

/** Bounded chart narration context (N3). */
export function buildExplainChartContext({
  rangeLabel = '',
  viewMode = 'combined',
  trends = [],
  totalLogs = 0,
  flareDays = 0,
} = {}) {
  const parts = [];
  if (rangeLabel) parts.push(`Chart range: ${rangeLabel}.`);
  parts.push(`View: ${viewMode}.`);
  parts.push(`${totalLogs} logged day(s).`);
  if (flareDays > 0) parts.push(`Flare days: ${flareDays}.`);

  for (const trend of (trends || []).slice(0, 6)) {
    if (!trend || !trend.label) continue;
    const avg = trend.average != null && Number.isFinite(trend.average) ? trend.average.toFixed(1) : '-';
    const cur = trend.current != null && Number.isFinite(trend.current) ? trend.current.toFixed(1) : '-';
    const delta =
      trend.delta != null && Number.isFinite(trend.delta)
        ? `${trend.delta >= 0 ? '+' : ''}${trend.delta.toFixed(1)}`
        : '-';
    parts.push(`${trend.label}: avg ${avg}, latest ${cur}, change ${delta} (${trend.points || 0} points).`);
  }

  const text = parts.join(' ');
  return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
}

export function buildExplainChartFallback(chartSummary = {}) {
  const trend = chartSummary.trends?.[0];
  if (!trend) return 'Not enough chart data to narrate this range yet.';
  const label = trend.label || trend.key || 'Metric';
  const avg = trend.average != null ? Number(trend.average).toFixed(1) : '-';
  return `${label} averaged ${avg} over ${chartSummary.rangeLabel || 'this range'}.`;
}
