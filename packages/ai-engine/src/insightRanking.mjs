function slugId(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** Layer 9 ranking — same rubric as PWA NeuralAnalysisNetwork.layerInterpretation */
export function collectInsightCandidates(analysis) {
  const a = analysis && typeof analysis === 'object' ? analysis : {};
  const items = [];
  (a.anomalies || []).forEach((text) => items.push({ text: String(text), score: 0.9, source: 'anomaly' }));
  (a.riskFactors || []).forEach((text) => items.push({ text: String(text), score: 0.85, source: 'risk' }));
  (a.correlations || []).slice(0, 5).forEach((text) => items.push({ text: String(text), score: 0.5, source: 'correlation' }));
  (a.patterns || []).forEach((text) => items.push({ text: String(text), score: 0.4, source: 'pattern' }));
  return items;
}

export function collectInsightCandidatesFromSummary(summary) {
  const s = summary && typeof summary === 'object' ? summary : {};
  const items = [];
  (s.important || []).forEach((text) => items.push({ text: String(text), score: 0.9, source: 'anomaly' }));
  (s.thingsToWatch || []).forEach((text) => items.push({ text: String(text), score: 0.85, source: 'risk' }));
  (s.possibleFlareUp?.notes || []).forEach((text) => {
    if (String(text).includes('No strong')) return;
    items.push({ text: String(text), score: 0.8, source: 'risk' });
  });
  (s.correlations || []).slice(0, 5).forEach((text) => items.push({ text: String(text), score: 0.5, source: 'correlation' }));
  (s.groupsThatChangeTogether || []).forEach((text) => {
    if (String(text).includes('Not enough')) return;
    items.push({ text: String(text), score: 0.4, source: 'pattern' });
  });
  return items;
}

export function rankInsightItems(items, limit = 7) {
  const seen = new Set();
  const deduped = (Array.isArray(items) ? items : []).filter((item) => {
    const text = String(item?.text || '');
    if (!text) return false;
    const key = text.substring(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((x, y) => (y.score || 0) - (x.score || 0));
  return deduped.slice(0, limit).map((item, idx) => ({
    id: `${item.source}:${slugId(item.text)}`,
    text: item.text,
    score: item.score,
    source: item.source,
    confidence: Math.round((item.score || 0) * 100),
    rank: idx + 1,
  }));
}

export function rankPrioritisedInsights(analysis, limit = 7) {
  return rankInsightItems(collectInsightCandidates(analysis), limit);
}

export function rankPrioritisedInsightsFromSummary(summary, limit = 7) {
  return rankInsightItems(collectInsightCandidatesFromSummary(summary), limit);
}

export function buildInsightWhy(insight, logs) {
  const list = Array.isArray(logs) ? logs : [];
  const metrics = ['mood', 'sleep', 'fatigue', 'stiffness', 'jointPain'];
  const contributors = [];
  for (const log of list) {
    const hits = metrics.filter((m) => log[m] != null);
    if (!hits.length) continue;
    contributors.push({ date: log.date, metrics: hits.map((m) => ({ id: m, value: log[m] })) });
  }
  return {
    insightId: insight?.id,
    contributingDates: contributors.slice(-5).map((c) => c.date),
    contributingMetrics: contributors.slice(-5),
    confidence: insight?.confidence ?? null,
  };
}
