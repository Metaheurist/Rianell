/** Plan 14 X14.1 — Weekly Health Review ritual steps and gates. */

export const WEEKLY_REVIEW_STEPS = [
  { id: 'correlations', labelKey: 'weeklyReview.step.correlations' },
  { id: 'digest', labelKey: 'weeklyReview.step.digest' },
  { id: 'brief', labelKey: 'weeklyReview.step.brief' },
  { id: 'confirm', labelKey: 'weeklyReview.step.confirm' },
  { id: 'pdf', labelKey: 'weeklyReview.step.pdf' },
];

export const WEEKLY_REVIEW_MIN_LOG_DAYS = 7;

function isoWeekKey(dateStr) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))
    ? new Date(`${dateStr}T12:00:00`)
    : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

export function isoWeekMondayKey(dateStr) {
  return isoWeekKey(dateStr);
}

export function isSundayReviewDay(todayStr) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(todayStr || ''))
    ? new Date(`${todayStr}T12:00:00`)
    : new Date();
  return d.getDay() === 0;
}

export function countDistinctLogDays(logs) {
  const dates = new Set((Array.isArray(logs) ? logs : []).map((l) => l?.date).filter(Boolean));
  return dates.size;
}

export function canOfferWeeklyReview(logs, opts = {}) {
  if (opts.simpleMode) return { allowed: false, reason: 'simpleMode' };
  if (opts.aiEnabled === false) return { allowed: false, reason: 'aiOff' };
  const dayCount = countDistinctLogDays(logs);
  if (dayCount < WEEKLY_REVIEW_MIN_LOG_DAYS) {
    return { allowed: false, reason: 'minDays', minDays: WEEKLY_REVIEW_MIN_LOG_DAYS, dayCount };
  }
  const today = opts.todayStr || new Date().toISOString().slice(0, 10);
  const sunday = isSundayReviewDay(today);
  const dismissedWeek = opts.weeklyReviewDismissedWeek || null;
  const thisWeek = isoWeekKey(today);
  if (dismissedWeek === thisWeek && !opts.force) {
    return { allowed: false, reason: 'dismissed' };
  }
  return { allowed: true, sundayHighlight: sunday, logDayCount: dayCount };
}

export function summarizeCorrelationStep(correlationCards) {
  const list = Array.isArray(correlationCards) ? correlationCards : [];
  return list.slice(0, 3).map((c) => ({
    id: c.id || c.metricA,
    label: c.label || (c.label1 && c.label2 ? `${c.label1} & ${c.label2}` : c.title || ''),
    detail:
      c.detail ||
      c.summary ||
      (c.coefficient != null ? `${c.direction || 'corr'} (${c.coefficient})` : ''),
    confidence: c.confidence || c.confidenceLevel || null,
  }));
}

export function summarizeDigestStep(digest) {
  if (!digest || typeof digest !== 'object') {
    return { headline: '', improvements: [], concerns: [], goalStatus: [] };
  }
  return {
    headline: digest.headline || '',
    improvements: Array.isArray(digest.improvements) ? digest.improvements : [],
    concerns: Array.isArray(digest.concerns) ? digest.concerns : [],
    goalStatus: Array.isArray(digest.goalStatus) ? digest.goalStatus : [],
  };
}
