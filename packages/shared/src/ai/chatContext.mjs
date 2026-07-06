/**
 * Health chat LLM context — richer than week-chat, with screening exclusion and redaction.
 * Ephemeral chat only; callers must not persist assembled prompts.
 */

import { HOME_SUGGESTIONS_RANGE_DAYS } from './homeSuggestions.mjs';

export const MAX_HEALTH_CHAT_CONTEXT_CHARS = 1800;
export const MAX_HEALTH_CHAT_TURNS = 5;

/** Keys that must never enter chat context (PHQ/GAD screening, ephemeral scores). */
const SCREENING_KEY_RE =
  /^(phq|gad|screening|mentalHealthScreening|phq2|phq9|gad2|gad7)/i;

const SCREENING_VALUE_RE =
  /\b(phq[- ]?[29]|gad[- ]?[27]|screening\s+score|suicidal\s+ideation)\b/i;

const URL_RE = /https?:\/\/[^\s]+/gi;
const SCRIPTISH_RE = /<\s*script|javascript:|on\w+\s*=/gi;

function sanitizeNoteForContext(note) {
  let raw = redactUntrustedText(String(note || '').trim());
  raw = raw.replace(/---\s*(USER_NOTE|END_USER_NOTE|SYSTEM)\s*---/gi, '[removed]');
  return raw;
}

function wrapUserNote(note) {
  const raw = sanitizeNoteForContext(note);
  if (!raw) return '';
  return `---USER_NOTE---\n${raw}\n---END_USER_NOTE---`;
}

/** AI-04: strip URLs and script-like tokens from user-controlled text. */
export function redactUntrustedText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(URL_RE, '[link removed]')
    .replace(SCRIPTISH_RE, '[removed]')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns true when a log field or settings blob may contain screening data. */
export function isScreeningField(key, value) {
  const k = String(key || '');
  if (SCREENING_KEY_RE.test(k)) return true;
  if (value && typeof value === 'object') {
    return Object.keys(value).some((child) => isScreeningField(child, value[child]));
  }
  const v = String(value ?? '');
  return SCREENING_VALUE_RE.test(v);
}

/** Drop screening-like keys from a plain object before context assembly. */
export function sanitizeObjectForChatContext(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isScreeningField(key, value)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = sanitizeObjectForChatContext(value);
      if (Object.keys(nested).length) out[key] = nested;
    } else if (value != null && value !== '') {
      out[key] = value;
    }
  }
  return out;
}

function formatGoals(goals) {
  if (!goals || typeof goals !== 'object') return '';
  const parts = [];
  if (goals.steps > 0) parts.push(`steps ${goals.steps}/day`);
  if (goals.hydration > 0) parts.push(`hydration ${goals.hydration} glasses`);
  if (goals.sleep > 0) parts.push(`sleep target ${goals.sleep}/10`);
  if (goals.goodDaysPerWeek > 0) parts.push(`${goals.goodDaysPerWeek} good days/week`);
  return parts.length ? `Goals: ${parts.join(', ')}.` : '';
}

/**
 * @param {object} params
 * @param {object} [params.analysis]
 * @param {Array<{ notes?: string }>} [params.logs]
 * @param {object} [params.goals]
 * @param {object} [params.settings]
 * @param {string} [params.rangeLabel]
 * @param {number} [params.rangeDays]
 */
export function buildChatContext({
  analysis = {},
  logs = [],
  goals = null,
  settings = null,
  rangeLabel = 'Last 14 days',
  rangeDays = HOME_SUGGESTIONS_RANGE_DAYS,
}) {
  const parts = [];
  parts.push(`Health scope: ${rangeLabel} (${rangeDays} days).`);

  const safeSettings = sanitizeObjectForChatContext(settings || {});
  if (safeSettings.medicalCondition) {
    parts.push(`Condition focus: ${redactUntrustedText(String(safeSettings.medicalCondition))}.`);
  }

  const total = analysis.totalLogs ?? (Array.isArray(logs) ? logs.length : 0);
  parts.push(`${total} logged day(s).`);
  if (analysis.flareDays != null && analysis.flareDays > 0) {
    parts.push(`Flares: ${analysis.flareDays} day(s).`);
  }
  if (analysis.avgFatigue != null) parts.push(`Fatigue avg: ${analysis.avgFatigue.toFixed(1)}/10.`);
  if (analysis.avgSleep != null) parts.push(`Sleep avg: ${analysis.avgSleep.toFixed(1)}/10.`);
  if (analysis.avgMood != null) parts.push(`Mood avg: ${analysis.avgMood.toFixed(1)}/10.`);
  if (analysis.topSymptoms?.length) {
    parts.push(`Top symptoms: ${analysis.topSymptoms.slice(0, 4).join(', ')}.`);
  }
  if (analysis.topStressors?.length) {
    parts.push(`Top stressors: ${analysis.topStressors.slice(0, 4).join(', ')}.`);
  }

  const goalsText = formatGoals(goals);
  if (goalsText) parts.push(goalsText);

  const recentNotes = (logs || [])
    .filter((l) => l && !isScreeningField('log', l))
    .map((l) => {
      if (!l.notes || SCREENING_VALUE_RE.test(String(l.notes))) return '';
      return redactUntrustedText(String(l.notes).trim());
    })
    .filter(Boolean);
  if (recentNotes.length) {
    parts.push(wrapUserNote(recentNotes[recentNotes.length - 1]));
  }

  const text = parts.join(' ');
  return text.length > MAX_HEALTH_CHAT_CONTEXT_CHARS
    ? text.slice(0, MAX_HEALTH_CHAT_CONTEXT_CHARS)
    : text;
}

export function canSendHealthChatTurn(turnCount) {
  return turnCount < MAX_HEALTH_CHAT_TURNS;
}

/**
 * @param {Array<{ user: string, assistant: string }>} turns
 */
export function formatHealthChatHistory(turns) {
  if (!Array.isArray(turns) || !turns.length) return '';
  return turns
    .map(
      (t, i) =>
        `Turn ${i + 1}:\nUser: ${redactUntrustedText(String(t.user || '').trim())}\nAssistant: ${redactUntrustedText(String(t.assistant || '').trim())}`,
    )
    .join('\n\n');
}

export function buildHealthChatUserPayload({ baseContext, history, userMessage }) {
  const parts = [String(baseContext || '').trim()];
  const hist = String(history || '').trim();
  if (hist) parts.push(`Conversation:\n${hist}`);
  parts.push(`User: ${redactUntrustedText(String(userMessage || '').trim())}`);
  return parts.filter(Boolean).join('\n\n');
}

export function buildHealthChatFallback(analysis = {}) {
  const total = analysis.totalLogs ?? 0;
  if (total < 3) {
    return 'Log a few more days and I can spot patterns in sleep, mood, and fatigue.';
  }
  const flare = analysis.flareDays ?? 0;
  if (flare > 0) {
    return `You logged ${total} days with ${flare} flare day(s). Rest and steady routines may help.`;
  }
  return `You logged ${total} days recently. Keep noting what helps — patterns build with steady logging.`;
}
