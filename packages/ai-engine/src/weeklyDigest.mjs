function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildWeeklyDigest(logs, goals = {}) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) => a.date.localeCompare(b.date));
  const thisWeek = list.slice(-7);
  const priorWeek = list.slice(-14, -7);
  const improvements = [];
  const concerns = [];
  const goalStatus = [];

  for (const metric of ['mood', 'sleep', 'fatigue']) {
    const tw = mean(thisWeek.map((l) => l[metric]).filter((v) => v != null));
    const pw = mean(priorWeek.map((l) => l[metric]).filter((v) => v != null));
    if (tw == null || pw == null) continue;
    const delta = tw - pw;
    if (metric === 'fatigue') {
      if (delta <= -0.5) improvements.push(`Fatigue improved (${pw.toFixed(1)} → ${tw.toFixed(1)}).`);
      if (delta >= 0.5) concerns.push(`Fatigue worsened (${pw.toFixed(1)} → ${tw.toFixed(1)}).`);
    } else {
      if (delta >= 0.5) improvements.push(`${metric} improved (${pw.toFixed(1)} → ${tw.toFixed(1)}).`);
      if (delta <= -0.5) concerns.push(`${metric} declined (${pw.toFixed(1)} → ${tw.toFixed(1)}).`);
    }
  }

  if (goals.sleep != null) {
    const twSleep = mean(thisWeek.map((l) => l.sleep).filter((v) => v != null));
    goalStatus.push({
      goal: 'sleep',
      target: goals.sleep,
      actual: twSleep != null ? Number(twSleep.toFixed(1)) : null,
      met: twSleep != null && twSleep >= goals.sleep,
    });
  }

  return {
    improvements: improvements.slice(0, 3),
    concerns: concerns.slice(0, 3),
    goalStatus,
    headline: improvements[0] || concerns[0] || 'Keep logging to build your weekly digest.',
  };
}
