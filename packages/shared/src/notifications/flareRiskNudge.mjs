/** Plan 11 R3 — flare-risk nudge from on-device fatigue anomaly (A5-aligned). */

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function isoWeekKey(date = new Date()) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(((d.getTime() - week1.getTime()) / 86_400_000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Fatigue spike rule mirrors packages/ai-engine/src/anomalies.mjs (A5). */
export function evaluateFatigueWeekAnomaly(logs, opts = {}) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const baselineDays = opts.baselineDays ?? 30;
  const recentDays = opts.recentDays ?? 7;
  const baseline = list.slice(-baselineDays);
  const recent = list.slice(-recentDays);
  const baseVals = baseline.map((l) => l.fatigue).filter((v) => v != null);
  const recentVals = recent.map((l) => l.fatigue).filter((v) => v != null);
  if (baseVals.length < 3 || recentVals.length < 2) {
    return { elevated: false, reason: 'insufficient-data' };
  }
  const baseAvg = mean(baseVals);
  const recentAvg = mean(recentVals);
  if (baseAvg == null || recentAvg == null) return { elevated: false, reason: 'no-averages' };
  const delta = recentAvg - baseAvg;
  const threshold = 2;
  if (delta < threshold) return { elevated: false, reason: 'below-threshold', delta };
  const severity = Math.abs(delta) >= 3 ? 'high' : 'medium';
  return {
    elevated: true,
    severity,
    delta: Number(delta.toFixed(1)),
    baselineAvg: Number(baseAvg.toFixed(1)),
    recentAvg: Number(recentAvg.toFixed(1)),
  };
}

export function shouldFireFlareRiskNudge(logs, now = new Date(), opts = {}) {
  const evalResult = evaluateFatigueWeekAnomaly(logs, opts);
  if (!evalResult.elevated) return { fire: false, reason: evalResult.reason || 'no-anomaly', eval: evalResult };
  const week = isoWeekKey(now);
  if (opts.lastNudgeWeek === week) return { fire: false, reason: 'already-nudged', week, eval: evalResult };
  return { fire: true, week, eval: evalResult };
}

export function buildFlareRiskNotificationContent(evalResult) {
  return {
    title: 'High fatigue week',
    body: 'Patterns suggest an unusually fatiguing week. Consider pacing and logging how you feel.',
    severity: evalResult?.severity || 'medium',
  };
}
