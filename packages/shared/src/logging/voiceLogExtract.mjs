/** Plan 04 L11 + Plan 21 SEC12 — wellness-only voice transcript → structured log fields. */

export const ALLOWED_VOICE_LOG_FIELDS = [
  'notes', 'mood', 'fatigue', 'sleep', 'jointPain', 'flare',
];

const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s*override/i,
  /\bSYSTEM:\s*You are now/i,
  /leak\s+all\s+user\s+data/i,
];

const MOOD_WORDS = [
  ['great', 9],
  ['good', 7],
  ['okay', 5],
  ['low', 3],
  ['awful', 2],
];

export function isVoicePromptInjection(text) {
  const raw = typeof text === 'string' ? text : '';
  return INJECTION_PATTERNS.some((re) => re.test(raw));
}

export function sanitizeVoiceExtractResult(result) {
  const out = {};
  for (const key of ALLOWED_VOICE_LOG_FIELDS) {
    if (result[key] !== undefined) out[key] = result[key];
  }
  out.systemPromptLeaked = false;
  return out;
}

export function extractLogFieldsFromVoiceTranscript(text) {
  const raw = typeof text === 'string' ? text.trim() : '';
  if (!raw) return { notes: '' };
  if (isVoicePromptInjection(raw)) {
    return sanitizeVoiceExtractResult({ notes: raw.slice(0, 200) });
  }
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
  return sanitizeVoiceExtractResult(out);
}
