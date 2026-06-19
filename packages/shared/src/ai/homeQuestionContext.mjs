import { HOME_SUGGESTIONS_RANGE_DAYS } from './homeSuggestions.mjs';
import { yesterdayOf } from './homeGapDetection.mjs';

const MAX_CONTEXT_CHARS = 720;

function wrapUserNote(note) {
  const raw = String(note || '').trim();
  if (!raw) return '';
  return `---USER_NOTE---\n${raw}\n---END_USER_NOTE---`;
}

/** Bounded LLM context for a single home question chip. */
/**
 * @param {object} params
 * @param {string} [params.questionText]
 * @param {string} [params.questionId]
 * @param {Record<string, string>} [params.labelParams]
 * @param {object} [params.analysis]
 * @param {Array<{ notes?: string, date?: string }>} [params.logs]
 * @param {number} [params.rangeDays]
 */
export function buildHomeQuestionContext({
  questionText,
  questionId,
  labelParams = {},
  analysis = {},
  logs = [],
  rangeDays = HOME_SUGGESTIONS_RANGE_DAYS,
}) {
  const parts = [];
  const q = String(questionText || '').trim();
  if (q) parts.push(`Question: ${q}`);
  parts.push(`Range: last ${rangeDays} days.`);

  const total = analysis.totalLogs ?? (Array.isArray(logs) ? logs.length : 0);
  parts.push(`${total} logged day(s).`);
  if (analysis.flareDays != null && analysis.flareDays > 0) {
    parts.push(`Flares: ${analysis.flareDays} day(s).`);
  }
  if (analysis.avgFatigue != null) parts.push(`Fatigue avg: ${analysis.avgFatigue.toFixed(1)}/10.`);
  if (analysis.avgSleep != null) parts.push(`Sleep avg: ${analysis.avgSleep.toFixed(1)}/10.`);
  if (analysis.avgMood != null) parts.push(`Mood avg: ${analysis.avgMood.toFixed(1)}/10.`);

  if (analysis.topSymptoms?.length) {
    parts.push(`Top symptoms: ${analysis.topSymptoms.slice(0, 3).join(', ')}.`);
  }
  if (analysis.topStressors?.length) {
    parts.push(`Top stressors: ${analysis.topStressors.slice(0, 3).join(', ')}.`);
  }
  if (questionId === 'correlation' && labelParams.a && labelParams.b) {
    parts.push(`Focus: link between ${labelParams.a} and ${labelParams.b}.`);
  }
  if (questionId === 'gap-meds') {
    parts.push('Focus: yesterday medication adherence gap.');
  }
  if (questionId === 'gap-sleep') {
    parts.push('Focus: missing sleep score yesterday.');
  }
  if (questionId === 'gap-food') {
    parts.push('Focus: empty food log yesterday.');
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const yStr = yesterdayOf(todayStr);
  if (yStr && questionId && String(questionId).startsWith('gap-')) {
    parts.push(`Yesterday (${yStr}) logging gap.`);
  }

  const recentNotes = (logs || [])
    .map((l) => (l && l.notes ? String(l.notes).trim() : ''))
    .filter(Boolean);
  if (recentNotes.length) parts.push(wrapUserNote(recentNotes[recentNotes.length - 1]));

  const text = parts.join(' ');
  return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
}
