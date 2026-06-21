/** Plan 14 X14.5 — PHQ-2/9 and GAD-2/7 wellness screening (not diagnostic). */

export const PHQ2_QUESTIONS = [
  { id: 'phq2_1', i18n: 'mentalHealth.phq2.q1' },
  { id: 'phq2_2', i18n: 'mentalHealth.phq2.q2' },
];

export const GAD2_QUESTIONS = [
  { id: 'gad2_1', i18n: 'mentalHealth.gad2.q1' },
  { id: 'gad2_2', i18n: 'mentalHealth.gad2.q2' },
];

export const PHQ9_QUESTIONS = [
  { id: 'phq9_1', i18n: 'mentalHealth.phq2.q1' },
  { id: 'phq9_2', i18n: 'mentalHealth.phq2.q2' },
  { id: 'phq9_3', i18n: 'mentalHealth.phq9.q3' },
  { id: 'phq9_4', i18n: 'mentalHealth.phq9.q4' },
  { id: 'phq9_5', i18n: 'mentalHealth.phq9.q5' },
  { id: 'phq9_6', i18n: 'mentalHealth.phq9.q6' },
  { id: 'phq9_7', i18n: 'mentalHealth.phq9.q7' },
  { id: 'phq9_8', i18n: 'mentalHealth.phq9.q8' },
  { id: 'phq9_9', i18n: 'mentalHealth.phq9.q9' },
];

export const GAD7_QUESTIONS = [
  { id: 'gad7_1', i18n: 'mentalHealth.gad2.q1' },
  { id: 'gad7_2', i18n: 'mentalHealth.gad2.q2' },
  { id: 'gad7_3', i18n: 'mentalHealth.gad7.q3' },
  { id: 'gad7_4', i18n: 'mentalHealth.gad7.q4' },
  { id: 'gad7_5', i18n: 'mentalHealth.gad7.q5' },
  { id: 'gad7_6', i18n: 'mentalHealth.gad7.q6' },
  { id: 'gad7_7', i18n: 'mentalHealth.gad7.q7' },
];

export const PHQ9_FOLLOWUP_QUESTIONS = PHQ9_QUESTIONS.slice(2);
export const GAD7_FOLLOWUP_QUESTIONS = GAD7_QUESTIONS.slice(2);

export const PHQ9_MAX_SCORE = 27;
export const GAD7_MAX_SCORE = 21;
export const PHQ2_MAX_SCORE = 6;
export const GAD2_MAX_SCORE = 6;

export const PHQ9_ITEM9_ID = 'phq9_9';

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

export function shouldOfferPhq9FollowUp(phq2Total) {
  return Number(phq2Total) >= 3;
}

export function shouldOfferGad7FollowUp(gad2Total) {
  return Number(gad2Total) >= 3;
}

/** Map PHQ-2 ids to PHQ-9 ids for merging phase-1 answers. */
const PHQ2_TO_PHQ9_ID = { phq2_1: 'phq9_1', phq2_2: 'phq9_2' };
const GAD2_TO_GAD7_ID = { gad2_1: 'gad7_1', gad2_2: 'gad7_2' };

export function mergePhq9Responses(phq2Responses, followUpResponses) {
  const merged = {};
  for (const q of PHQ2_QUESTIONS) {
    const phq9Id = PHQ2_TO_PHQ9_ID[q.id];
    if (phq9Id) merged[phq9Id] = Number(phq2Responses?.[q.id]) || 0;
  }
  for (const q of PHQ9_FOLLOWUP_QUESTIONS) {
    merged[q.id] = Number(followUpResponses?.[q.id]) || 0;
  }
  return merged;
}

export function mergeGad7Responses(gad2Responses, followUpResponses) {
  const merged = {};
  for (const q of GAD2_QUESTIONS) {
    const gad7Id = GAD2_TO_GAD7_ID[q.id];
    if (gad7Id) merged[gad7Id] = Number(gad2Responses?.[q.id]) || 0;
  }
  for (const q of GAD7_FOLLOWUP_QUESTIONS) {
    merged[q.id] = Number(followUpResponses?.[q.id]) || 0;
  }
  return merged;
}

export function scorePhq9FromResponses(responseMap) {
  const responses = PHQ9_QUESTIONS.map((q) => ({ value: responseMap?.[q.id] }));
  return scoreScreeningResponses(responses);
}

export function scoreGad7FromResponses(responseMap) {
  const responses = GAD7_QUESTIONS.map((q) => ({ value: responseMap?.[q.id] }));
  return scoreScreeningResponses(responses);
}

export function isPhq9SuicideItemPositive(responseMap) {
  const v = Number(responseMap?.[PHQ9_ITEM9_ID]);
  return Number.isFinite(v) && v >= 1;
}

export function interpretPhq2Score(total) {
  if (total >= 3) return { level: 'elevated', i18n: 'mentalHealth.phq2.elevated' };
  return { level: 'low', i18n: 'mentalHealth.phq2.low' };
}

export function interpretGad2Score(total) {
  if (total >= 3) return { level: 'elevated', i18n: 'mentalHealth.gad2.elevated' };
  return { level: 'low', i18n: 'mentalHealth.gad2.low' };
}

export function interpretPhq9Score(total) {
  const t = Number(total);
  if (t >= 20) return { level: 'severe', i18n: 'mentalHealth.phq9.severity.severe' };
  if (t >= 15) return { level: 'moderatelySevere', i18n: 'mentalHealth.phq9.severity.moderatelySevere' };
  if (t >= 10) return { level: 'moderate', i18n: 'mentalHealth.phq9.severity.moderate' };
  if (t >= 5) return { level: 'mild', i18n: 'mentalHealth.phq9.severity.mild' };
  return { level: 'minimal', i18n: 'mentalHealth.phq9.severity.minimal' };
}

export function interpretGad7Score(total) {
  const t = Number(total);
  if (t >= 15) return { level: 'severe', i18n: 'mentalHealth.gad7.severity.severe' };
  if (t >= 10) return { level: 'moderate', i18n: 'mentalHealth.gad7.severity.moderate' };
  if (t >= 5) return { level: 'mild', i18n: 'mentalHealth.gad7.severity.mild' };
  return { level: 'minimal', i18n: 'mentalHealth.gad7.severity.minimal' };
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
