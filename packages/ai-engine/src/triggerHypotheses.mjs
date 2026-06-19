const DEFAULT_MIN_OVERLAP = 5;

function flareRate(logs) {
  if (!logs.length) return 0;
  return logs.filter((l) => l.flare === 'Yes').length / logs.length;
}

function filterBadMetric(logs, metric, threshold, direction = 'high') {
  return logs.filter((l) => {
    const v = l[metric];
    if (v == null) return false;
    return direction === 'high' ? v >= threshold : v <= threshold;
  });
}

export function computeTriggerHypotheses(logs, options = {}) {
  const minOverlap = options.minOverlap ?? DEFAULT_MIN_OVERLAP;
  const list = Array.isArray(logs) ? logs : [];
  if (list.length < minOverlap) return [];
  const baseline = flareRate(list);
  const hypotheses = [];

  const checks = [
    { factor: 'low_sleep', label: 'Sleep ≤ 4', subset: filterBadMetric(list, 'sleep', 4, 'low') },
    { factor: 'high_fatigue', label: 'Fatigue ≥ 7', subset: filterBadMetric(list, 'fatigue', 7, 'high') },
    { factor: 'low_mood', label: 'Mood ≤ 4', subset: filterBadMetric(list, 'mood', 4, 'low') },
  ];

  for (const check of checks) {
    if (check.subset.length < minOverlap) continue;
    const rate = flareRate(check.subset);
    const lift = rate - baseline;
    if (lift <= 0.05) continue;
    hypotheses.push({
      id: `trigger:${check.factor}`,
      factor: check.factor,
      label: check.label,
      overlap: check.subset.length,
      flareRateWhenPresent: Math.round(rate * 100),
      baselineFlareRate: Math.round(baseline * 100),
      lift: Math.round(lift * 100),
    });
  }

  const stressCounts = new Map();
  list.forEach((log) => {
    if (log.flare !== 'Yes' || !Array.isArray(log.stressors)) return;
    log.stressors.forEach((s) => {
      if (typeof s !== 'string' || !s.trim()) return;
      stressCounts.set(s.trim(), (stressCounts.get(s.trim()) ?? 0) + 1);
    });
  });
  [...stressCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([name, count]) => {
      const subset = list.filter((l) => Array.isArray(l.stressors) && l.stressors.includes(name));
      if (subset.length < minOverlap) return;
      const rate = flareRate(subset);
      const lift = rate - baseline;
      if (lift <= 0.05) return;
      hypotheses.push({
        id: `trigger:stressor:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        factor: 'stressor',
        label: `Stressor: ${name}`,
        overlap: subset.length,
        flareRateWhenPresent: Math.round(rate * 100),
        baselineFlareRate: Math.round(baseline * 100),
        lift: Math.round(lift * 100),
      });
    });

  return hypotheses.sort((a, b) => b.lift - a.lift).slice(0, 5);
}
