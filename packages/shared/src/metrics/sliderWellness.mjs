/** Unified slider UX: 1 = bad (left), 10 = good (right). Storage keeps raw metric semantics (1–10). */

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

const SLIDER_MIN = 1;
const SLIDER_MAX = 10;

function clampInt(raw, min, max) {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function isMetricHigherIsBetter(field) {
  return METRICS_HIGHER_IS_BETTER.includes(field);
}

/** Map stored raw metric (1–10) to unified wellness slider position (1 = bad, 10 = good). */
export function rawToWellnessSlider(field, raw) {
  const value = clampInt(raw, SLIDER_MIN, SLIDER_MAX);
  return isMetricHigherIsBetter(field) ? value : (SLIDER_MAX + SLIDER_MIN - value);
}

/** Map wellness slider position back to stored raw metric value. */
export function wellnessSliderToRaw(field, wellness) {
  const score = clampInt(wellness, SLIDER_MIN, SLIDER_MAX);
  return isMetricHigherIsBetter(field) ? score : (SLIDER_MAX + SLIDER_MIN - score);
}

/** Zone labels/colors from wellness score (same for every metric). */
export function classifyWellnessSlider(wellness, t = (k, fb) => fb) {
  const v = clampInt(wellness, SLIDER_MIN, SLIDER_MAX);
  if (v >= 8) return { id: 'good', color: '#7bdf8c', label: t('common.good', 'Good') };
  if (v >= 4) return { id: 'moderate', color: '#ffb74d', label: t('wizard.lifestyle.steps.moderate', 'Moderate') };
  return { id: 'bad', color: '#ff8a65', label: t('common.bad', 'Bad') };
}

/** Symptom / burden metrics: classify stored raw severity (1 = low, 10 = high). */
export function classifySeverityRaw(raw, t = (k, fb) => fb) {
  const v = clampInt(raw, SLIDER_MIN, SLIDER_MAX);
  if (v <= 3) return { id: 'low', color: '#7bdf8c', label: t('wizard.metric.severity.low', 'Low') };
  if (v <= 7) return { id: 'moderate', color: '#ffb74d', label: t('wizard.metric.severity.moderate', 'Moderate') };
  return { id: 'high', color: '#ff7043', label: t('wizard.metric.severity.high', 'High') };
}

export function wellnessSliderFillColor(wellness) {
  const v = clampInt(wellness, SLIDER_MIN, SLIDER_MAX);
  if (v >= 8) return '#4CAF50';
  if (v >= 4) return '#FF9800';
  return '#F44336';
}

export function wellnessSliderFillPercent(wellness) {
  const v = clampInt(wellness, SLIDER_MIN, SLIDER_MAX);
  return ((v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
}
