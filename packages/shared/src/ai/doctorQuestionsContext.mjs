/** Plan 12 CL5 — LLM doctor questions from recent trends (wellness framing). */

const MAX_CONTEXT_CHARS = 800;

export function buildDoctorQuestionsContext({ analysis = {}, logs = [], rangeLabel = '' } = {}) {
  const parts = [];
  if (rangeLabel) parts.push(`Range: ${rangeLabel}.`);
  if (analysis.avgMood != null) parts.push(`Mood avg ${Number(analysis.avgMood).toFixed(1)}/10.`);
  if (analysis.avgSleep != null) parts.push(`Sleep avg ${Number(analysis.avgSleep).toFixed(1)}/10.`);
  if (analysis.avgFatigue != null) parts.push(`Fatigue avg ${Number(analysis.avgFatigue).toFixed(1)}/10.`);
  if (analysis.flareDays != null) parts.push(`Flare days: ${analysis.flareDays}.`);
  if (analysis.topSymptoms?.length) parts.push(`Symptoms: ${analysis.topSymptoms.slice(0, 3).join(', ')}.`);
  if (analysis.thingsToWatch?.length) parts.push(`Watch: ${analysis.thingsToWatch.slice(0, 2).join(' ')}`);
  const text = parts.join(' ');
  return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
}

export function buildDoctorQuestionsFallback(analysis = {}) {
  const q = [
    'What patterns in my recent logs are worth discussing at this visit?',
    'Could changes in sleep or fatigue relate to what I have been tracking?',
    'What should I keep monitoring after this appointment?',
  ];
  if (analysis.flareDays > 0) {
    q[1] = `I had ${analysis.flareDays} flare day(s) recently — what might be useful to review together?`;
  }
  return q;
}

export function parseDoctorQuestionsResponse(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[\d•\-*.]+\s*/, '').trim())
    .filter((l) => l.length > 8);
  const unique = [];
  for (const line of lines) {
    if (!unique.includes(line)) unique.push(line);
    if (unique.length >= 3) break;
  }
  return unique.slice(0, 3);
}
