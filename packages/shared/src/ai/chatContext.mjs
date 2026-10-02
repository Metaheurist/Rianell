/**
 * Health chat LLM context - richer than week-chat, with screening exclusion and redaction.
 * Ephemeral chat only; callers must not persist assembled prompts.
 */

import { HOME_SUGGESTIONS_RANGE_DAYS, buildHealthChatOfflineReply } from './homeSuggestions.mjs';

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

/**
 * Small models read a bare "1.0/10" as neutral and misread fatigue's inverted scale,
 * so the verdict leads and the score follows. Bands match AIEngine anomaly thresholds.
 * @param {number} value 0-10 score where higher is better
 * @returns {'poor' | 'fair' | 'good'}
 */
export function scoreBand(value) {
  const v = Number(value);
  return v <= 4 ? 'poor' : v >= 7 ? 'good' : 'fair';
}

/**
 * Chat context lines for the averaged scores, e.g. `Sleep: poor (avg 1.0/10).`
 * @param {{ avgFatigue?: number, avgSleep?: number, avgMood?: number }} analysis
 * @returns {string[]}
 */
export function describeChatScores(analysis = {}) {
  const lines = [];
  if (analysis.avgFatigue != null) {
    const v = Number(analysis.avgFatigue);
    const level = v >= 7 ? 'high' : v <= 3 ? 'low' : 'moderate';
    lines.push(`Energy: ${scoreBand(10 - v)} (fatigue avg ${v.toFixed(1)}/10, ${level}).`);
  }
  if (analysis.avgSleep != null) {
    lines.push(`Sleep: ${scoreBand(analysis.avgSleep)} (avg ${Number(analysis.avgSleep).toFixed(1)}/10).`);
  }
  if (analysis.avgMood != null) {
    lines.push(`Mood: ${scoreBand(analysis.avgMood)} (avg ${Number(analysis.avgMood).toFixed(1)}/10).`);
  }
  return lines;
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
  if (total === 0) {
    parts.push('Nothing logged yet.');
  } else if (total < 2) {
    parts.push('Only 1 day logged, so there is no trend or day-to-day comparison yet.');
  }
  if (analysis.flareDays != null && analysis.flareDays > 0) {
    parts.push(`Flares: ${analysis.flareDays} day(s).`);
  }
  parts.push(...describeChatScores(analysis));
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
  // The turn being answered is already in `turns` with an empty reply; the payload
  // adds its question separately, so listing it here would duplicate the question.
  const answered = turns.filter((t) => t && String(t.assistant || '').trim());
  if (!answered.length) return '';
  return answered
    .map(
      (t, i) =>
        `Turn ${i + 1}:\nUser: ${redactUntrustedText(String(t.user || '').trim())}\nAssistant: ${redactUntrustedText(String(t.assistant || '').trim())}`,
    )
    .join('\n\n');
}

/** Small models treat an unlabelled fact list as foreign data and decline to use it. */
export const HEALTH_CHAT_CONTEXT_LABEL = "Health log context (the user's own data):";

export function buildHealthChatUserPayload({ baseContext, history, userMessage }) {
  const base = String(baseContext || '').trim();
  const parts = [base ? `${HEALTH_CHAT_CONTEXT_LABEL}\n${base}` : ''];
  const hist = String(history || '').trim();
  if (hist) parts.push(`Conversation:\n${hist}`);
  parts.push(`User: ${redactUntrustedText(String(userMessage || '').trim())}`);
  return parts.filter(Boolean).join('\n\n');
}

export function buildHealthChatFallback(analysis = {}, userMessage = '', logs = []) {
  return buildHealthChatOfflineReply(analysis, userMessage, logs);
}
