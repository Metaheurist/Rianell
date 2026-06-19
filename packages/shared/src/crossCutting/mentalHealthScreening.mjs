/** Plan 14 X14.5 — PHQ-2 / GAD-2 wellness screening (not diagnostic). */

export const PHQ2_QUESTIONS = [
  { id: 'phq2_1', i18n: 'mentalHealth.phq2.q1' },
  { id: 'phq2_2', i18n: 'mentalHealth.phq2.q2' },
];

export const GAD2_QUESTIONS = [
  { id: 'gad2_1', i18n: 'mentalHealth.gad2.q1' },
  { id: 'gad2_2', i18n: 'mentalHealth.gad2.q2' },
];

export const SCREENING_RESPONSE_OPTIONS = [
  { value: 0, i18n: 'mentalHealth.response.notAtAll' },
  { value: 1, i18n: 'mentalHealth.response.severalDays' },
  { value: 2, i18n: 'mentalHealth.response.moreThanHalf' },
  { value: 3, i18n: 'mentalHealth.response.nearlyEveryDay' },
];

const CRISIS_BY_REGION = {
  eea_uk: [
    { i18n: 'mentalHealth.crisis.samaritans', url: 'https://www.samaritans.org/' },
    { i18n: 'mentalHealth.crisis.nhs111', url: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-111/' },
  ],
  us: [{ i18n: 'mentalHealth.crisis.us988', url: 'https://988lifeline.org/' }],
  ca: [{ i18n: 'mentalHealth.crisis.ca988', url: 'https://988.ca/' }],
  au: [{ i18n: 'mentalHealth.crisis.lifelineAu', url: 'https://www.lifeline.org.au/' }],
  other: [{ i18n: 'mentalHealth.crisis.findaHelpline', url: 'https://findahelpline.com/' }],
};

export function scoreScreeningResponses(responses) {
  const list = Array.isArray(responses) ? responses : [];
  let total = 0;
  let answered = 0;
  for (const r of list) {
    const v = Number(r?.value);
    if (!Number.isFinite(v) || v < 0 || v > 3) continue;
    total += v;
    answered += 1;
  }
  return { total, answered, complete: answered === list.length && list.length > 0 };
}

export function interpretPhq2Score(total) {
  if (total >= 3) return { level: 'elevated', i18n: 'mentalHealth.phq2.elevated' };
  return { level: 'low', i18n: 'mentalHealth.phq2.low' };
}

export function interpretGad2Score(total) {
  if (total >= 3) return { level: 'elevated', i18n: 'mentalHealth.gad2.elevated' };
  return { level: 'low', i18n: 'mentalHealth.gad2.low' };
}

export function getCrisisResourcesForRegion(regionId) {
  const key = String(regionId || 'other').toLowerCase();
  if (key === 'eea_uk' || key === 'uk') return CRISIS_BY_REGION.eea_uk;
  if (key === 'us' || key === 'us_ca') return CRISIS_BY_REGION.us;
  if (key === 'ca') return CRISIS_BY_REGION.ca;
  if (key === 'au') return CRISIS_BY_REGION.au;
  return CRISIS_BY_REGION.other;
}

export const MENTAL_HEALTH_DISCLAIMER_I18N = 'mentalHealth.disclaimer';
