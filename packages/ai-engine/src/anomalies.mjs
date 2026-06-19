function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function detectMetricAnomalies(logs, options = {}) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) => a.date.localeCompare(b.date));
  const baselineDays = options.baselineDays ?? 30;
  const recentDays = options.recentDays ?? 7;
  const baseline = list.slice(-baselineDays);
  const recent = list.slice(-recentDays);
  const alerts = [];

  for (const metric of ['fatigue', 'mood', 'sleep']) {
    const baseVals = baseline.map((l) => l[metric]).filter((v) => v != null);
    const recentVals = recent.map((l) => l[metric]).filter((v) => v != null);
    if (baseVals.length < 3 || recentVals.length < 2) continue;
    const baseAvg = mean(baseVals);
    const recentAvg = mean(recentVals);
    if (baseAvg == null || recentAvg == null) continue;
    const delta = recentAvg - baseAvg;
    const threshold = metric === 'fatigue' ? 2 : metric === 'sleep' ? -2 : -2;
    const isAnomaly =
      metric === 'fatigue' ? delta >= threshold : metric === 'sleep' ? delta <= threshold : delta <= threshold;
    if (!isAnomaly) continue;
    alerts.push({
      id: `anomaly:${metric}`,
      metric,
      baselineAvg: Number(baseAvg.toFixed(1)),
      recentAvg: Number(recentAvg.toFixed(1)),
      delta: Number(delta.toFixed(1)),
      severity: Math.abs(delta) >= 3 ? 'high' : 'medium',
      message:
        metric === 'fatigue'
          ? `Fatigue is unusually high vs your ${baselineDays}-day baseline.`
          : metric === 'sleep'
            ? `Sleep is unusually low vs your ${baselineDays}-day baseline.`
            : `Mood is unusually low vs your ${baselineDays}-day baseline.`,
    });
  }
  return alerts;
}
