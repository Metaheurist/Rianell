const MAX_CONTEXT_CHARS = 720;

export const MAX_WEEK_CHAT_TURNS = 5;

function wrapUserNote(note) {
  const raw = String(note || '').trim();
  if (!raw) return '';
  return `---USER_NOTE---\n${raw}\n---END_USER_NOTE---`;
}

export function canSendWeekChatTurn(turnCount) {
  return turnCount < MAX_WEEK_CHAT_TURNS;
}

/**
 * @param {object} params
 * @param {object} [params.analysis]
 * @param {Array<{ notes?: string }>} [params.logs]
 * @param {string} [params.rangeLabel]
 * @param {number} [params.rangeDays]
 */
export function buildWeekChatContext({
  analysis = {},
  logs = [],
  rangeLabel = 'Last 14 days',
  rangeDays = 14,
}) {
  const parts = [];
  parts.push(`Week scope: ${rangeLabel} (${rangeDays} days).`);
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

  const recentNotes = (logs || [])
    .map((l) => (l && l.notes ? String(l.notes).trim() : ''))
    .filter(Boolean);
  if (recentNotes.length) parts.push(wrapUserNote(recentNotes[recentNotes.length - 1]));

  const text = parts.join(' ');
  return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
}

/**
 * @param {Array<{ user: string, assistant: string }>} turns
 */
export function formatWeekChatHistory(turns) {
  if (!Array.isArray(turns) || !turns.length) return '';
  return turns
    .map((t, i) => `Turn ${i + 1}:\nUser: ${String(t.user || '').trim()}\nAssistant: ${String(t.assistant || '').trim()}`)
    .join('\n\n');
}

export function buildWeekChatUserPayload({ baseContext, history, userMessage }) {
  const parts = [String(baseContext || '').trim()];
  const hist = String(history || '').trim();
  if (hist) parts.push(`Conversation:\n${hist}`);
  parts.push(`User: ${String(userMessage || '').trim()}`);
  return parts.filter(Boolean).join('\n\n');
}

export function buildWeekChatFallback(analysis = {}) {
  const total = analysis.totalLogs ?? 0;
  if (total < 3) {
    return 'Log a few more days this week and I can spot patterns more clearly.';
  }
  const flare = analysis.flareDays ?? 0;
  if (flare > 0) {
    return `You logged ${total} days with ${flare} flare day(s). Rest and steady routines may help this week.`;
  }
  return `You logged ${total} days this period. Keep noting what helps; patterns build with steady logging.`;
}
