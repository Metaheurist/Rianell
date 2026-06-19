export const CONDITION_ANALYSIS_PACKS = {
  migraine: {
    id: 'migraine',
    watchMetrics: ['fatigue', 'sleep', 'mood'],
    triggers: ['low_sleep', 'high_fatigue'],
    advice: ['Track sleep consistency around headache days.', 'Note weather sensitivity if logged.'],
  },
  ibs: {
    id: 'ibs',
    watchMetrics: ['fatigue', 'mood', 'stressors'],
    triggers: ['stressor'],
    advice: ['Log meals and stressors on flare days.', 'Look for stress–symptom overlap in correlations.'],
  },
};

export function applyConditionPack(packId, analysis) {
  const pack = CONDITION_ANALYSIS_PACKS[packId];
  if (!pack) return { pack: null, hints: [] };
  const hints = [...pack.advice];
  if (analysis?.possibleFlareUp?.level === 'High') {
    hints.unshift(`(${pack.id}) Elevated flare signals — review ${pack.watchMetrics.join(', ')}.`);
  }
  return { pack, hints: hints.slice(0, 3) };
}
