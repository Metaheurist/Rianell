/** Plan 14 X14.5 — PHQ-2 / GAD-2 wellness screening (not diagnostic). */

export const PHQ2_QUESTIONS = [
  { id: 'phq2_1', labelKey: 'mentalHealth.phq2.q1' },
  { id: 'phq2_2', labelKey: 'mentalHealth.phq2.q2' },
];

export const GAD2_QUESTIONS = [
  { id: 'gad2_1', labelKey: 'mentalHealth.gad2.q1' },
  { id: 'gad2_2', labelKey: 'mentalHealth.gad2.q2' },
];

export const SCREENING_RESPONSE_OPTIONS = [
  { value: 0, labelKey: 'mentalHealth.response.notAtAll' },
  { value: 1, labelKey: 'mentalHealth.response.severalDays' },
  { value: 2, labelKey: 'mentalHealth.response.moreThanHalf' },
  { value: 3, labelKey: 'mentalHealth.response.nearlyEveryDay' },
];

const CRISIS_BY_REGION = {
  eea_uk: [
    { nameKey: 'mentalHealth.crisis.samaritans', url: 'https://www.samaritans.org/' },
    { nameKey: 'mentalHealth.crisis.nhs111', url: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-111/' },
  ],
  us: [{ nameKey: 'mentalHealth.crisis.us988', url: 'https://988lifeline.org/' }],
  ca: [{ nameKey: 'mentalHealth.crisis.ca988', url: 'https://988.ca/' }],
  au: [{ nameKey: 'mentalHealth.crisis.lifelineAu', url: 'https://www.lifeline.org.au/' }],
  other: [{ nameKey: 'mentalHealth.crisis.findaHelpline', url: 'https://findahelpline.com/' }],
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
  if (total >= 3) return { level: 'elevated', labelKey: 'mentalHealth.phq2.elevated' };
  return { level: 'low', labelKey: 'mentalHealth.phq2.low' };
}

export function interpretGad2Score(total) {
  if (total >= 3) return { level: 'elevated', labelKey: 'mentalHealth.gad2.elevated' };
  return { level: 'low', labelKey: 'mentalHealth.gad2.low' };
}

export function getCrisisResourcesForRegion(regionId) {
  const key = String(regionId || 'other').toLowerCase();
  if (key === 'eea_uk' || key === 'uk') return CRISIS_BY_REGION.eea_uk;
  if (key === 'us' || key === 'us_ca') return CRISIS_BY_REGION.us;
  if (key === 'ca') return CRISIS_BY_REGION.ca;
  if (key === 'au') return CRISIS_BY_REGION.au;
  return CRISIS_BY_REGION.other;
}

export const MENTAL_HEALTH_DISCLAIMER_KEY = 'mentalHealth.disclaimer';
