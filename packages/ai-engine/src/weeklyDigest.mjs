const METRIC_LABELS = {
  mood: 'Mood',
  sleep: 'Sleep',
  fatigue: 'Fatigue',
};

const TRACKED_METRICS = ['mood', 'sleep', 'fatigue'];

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Accept only 0–10 scale values (ignores corrupted or out-of-range logs). */
export function readScaleMetric(log, field) {
  const raw = log?.[field];
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return n;
}

function formatChangeMessage(metric, prior, current, kind) {
  const label = METRIC_LABELS[metric] || metric;
  const p = prior.toFixed(1);
  const c = current.toFixed(1);
  if (kind === 'improvement') {
    if (metric === 'fatigue') return `${label} eased (${p} → ${c}/10).`;
    return `${label} averaged ${c}/10 (up from ${p}).`;
  }
  if (metric === 'fatigue') return `${label} increased (${p} → ${c}/10).`;
  return `${label} averaged ${c}/10 (down from ${p}).`;
}

function buildHeadline(improvements, concerns) {
  if (improvements.length) return 'Your week shows positive shifts in a few areas.';
  if (concerns.length) return 'A few metrics shifted this week — worth a look.';
  return 'Keep logging to build your weekly digest.';
}

export function buildWeeklyDigest(logs, goals = {}) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) => a.date.localeCompare(b.date));
  const thisWeek = list.slice(-7);
  const priorWeek = list.slice(-14, -7);
  const improvements = [];
  const concerns = [];
  const changes = [];
  const goalStatus = [];

  for (const metric of TRACKED_METRICS) {
    const tw = mean(thisWeek.map((l) => readScaleMetric(l, metric)).filter((v) => v != null));
    const pw = mean(priorWeek.map((l) => readScaleMetric(l, metric)).filter((v) => v != null));
    if (tw == null || pw == null) continue;
    const delta = tw - pw;
    if (metric === 'fatigue') {
      if (delta <= -0.5) {
        const msg = formatChangeMessage(metric, pw, tw, 'improvement');
        improvements.push(msg);
        changes.push({
          metric,
          priorAvg: Number(pw.toFixed(1)),
          thisAvg: Number(tw.toFixed(1)),
          delta: Number(delta.toFixed(1)),
          kind: 'improvement',
        });
      }
      if (delta >= 0.5) {
        const msg = formatChangeMessage(metric, pw, tw, 'concern');
        concerns.push(msg);
        changes.push({
          metric,
          priorAvg: Number(pw.toFixed(1)),
          thisAvg: Number(tw.toFixed(1)),
          delta: Number(delta.toFixed(1)),
          kind: 'concern',
        });
      }
    } else {
      if (delta >= 0.5) {
        const msg = formatChangeMessage(metric, pw, tw, 'improvement');
        improvements.push(msg);
        changes.push({
          metric,
          priorAvg: Number(pw.toFixed(1)),
          thisAvg: Number(tw.toFixed(1)),
          delta: Number(delta.toFixed(1)),
          kind: 'improvement',
        });
      }
      if (delta <= -0.5) {
        const msg = formatChangeMessage(metric, pw, tw, 'concern');
        concerns.push(msg);
        changes.push({
          metric,
          priorAvg: Number(pw.toFixed(1)),
          thisAvg: Number(tw.toFixed(1)),
          delta: Number(delta.toFixed(1)),
          kind: 'concern',
        });
      }
    }
  }

  if (goals.sleep != null) {
    const twSleep = mean(thisWeek.map((l) => readScaleMetric(l, 'sleep')).filter((v) => v != null));
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
    changes: changes.slice(0, 6),
    goalStatus,
    headline: buildHeadline(improvements, concerns),
  };
}
