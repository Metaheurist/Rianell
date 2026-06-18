/** Plan 04 L11 — wellness-only voice transcript → structured log fields (deterministic fallback). */

const MOOD_WORDS = [
  ['great', 9],
  ['good', 7],
  ['okay', 5],
  ['low', 3],
  ['awful', 2],
];

export function extractLogFieldsFromVoiceTranscript(text) {
  const raw = typeof text === 'string' ? text.trim() : '';
  if (!raw) return { notes: '' };
  const lower = raw.toLowerCase();
  let mood;
  for (const [word, score] of MOOD_WORDS) {
    if (lower.includes(word)) {
      mood = score;
      break;
    }
  }
  const fatigueMatch = lower.match(/fatigue(?: level)?\s*(?:was|is|at)?\s*(\d{1,2})/);
  const sleepMatch = lower.match(/sleep(?: was| is| score)?\s*(?:was|is|at)?\s*(\d{1,2})/);
  const painMatch = lower.match(/pain(?: level)?\s*(?:was|is|at)?\s*(\d{1,2})/);
  const flare = /\bflare\b|\bflaring\b/.test(lower) ? 'Yes' : undefined;
  const out = {
    notes: raw.slice(0, 500),
    mood: mood ?? (fatigueMatch ? undefined : 5),
    fatigue: fatigueMatch ? Math.min(10, parseInt(fatigueMatch[1], 10)) : undefined,
    sleep: sleepMatch ? Math.min(10, parseInt(sleepMatch[1], 10)) : undefined,
    jointPain: painMatch ? Math.min(10, parseInt(painMatch[1], 10)) : undefined,
    flare,
  };
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined) delete out[k];
  });
  return out;
}
