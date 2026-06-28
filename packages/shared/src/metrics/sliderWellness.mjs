/** Unified slider UX: 0 = bad (left), 10 = good (right). Storage keeps raw metric semantics. */

export const METRICS_HIGHER_IS_BETTER = Object.freeze([
  'sleep',
  'mobility',
  'dailyFunction',
  'mood',
]);

export const METRIC_SLIDER_FIELDS = Object.freeze([
  'fatigue',
  'stiffness',
  'jointPain',
  'mobility',
  'swelling',
  'sleep',
  'mood',
  'irritability',
  'weatherSensitivity',
  'dailyFunction',
  'backPain',
]);

function clampInt(raw, min, max) {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function isMetricHigherIsBetter(field) {
  return METRICS_HIGHER_IS_BETTER.includes(field);
}

/** Map stored raw metric (0–10) to unified wellness slider position (0 = bad, 10 = good). */
export function rawToWellnessSlider(field, raw) {
  const value = clampInt(raw, 0, 10);
  return isMetricHigherIsBetter(field) ? value : 10 - value;
}

/** Map wellness slider position back to stored raw metric value. */
export function wellnessSliderToRaw(field, wellness) {
  const score = clampInt(wellness, 0, 10);
  return isMetricHigherIsBetter(field) ? score : 10 - score;
}

/** Zone labels/colors from wellness score (same for every metric). */
export function classifyWellnessSlider(wellness, t = (k, fb) => fb) {
  const v = clampInt(wellness, 0, 10);
  if (v >= 8) return { id: 'good', color: '#7bdf8c', label: t('common.good', 'Good') };
  if (v >= 4) return { id: 'moderate', color: '#ffb74d', label: t('wizard.lifestyle.steps.moderate', 'Moderate') };
  return { id: 'bad', color: '#ff8a65', label: t('common.bad', 'Bad') };
}

export function wellnessSliderFillColor(wellness) {
  const v = clampInt(wellness, 0, 10);
  if (v >= 8) return '#4CAF50';
  if (v >= 4) return '#FF9800';
  return '#F44336';
}

export function wellnessSliderFillPercent(wellness) {
  return (clampInt(wellness, 0, 10) / 10) * 100;
}
