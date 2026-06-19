const MAX_CONTEXT_CHARS = 900;

function wrapUserNote(note) {
  const raw = String(note || '').trim();
  if (!raw) return '';
  return `---USER_NOTE---\n${raw}\n---END_USER_NOTE---`;
}

/** Bounded context for clinician visit prep (N2). */
export function buildClinicianBriefContext({
  analysis = {},
  logs = [],
  rangeLabel = '',
  goals = null,
} = {}) {
  const parts = [];
  if (rangeLabel) parts.push(`Range: ${rangeLabel}.`);
  const total = analysis.totalLogs ?? (Array.isArray(logs) ? logs.length : 0);
  parts.push(`${total} logged day(s).`);
  if (analysis.flareDays != null && analysis.flareDays > 0) {
    parts.push(`Flare days: ${analysis.flareDays}.`);
  }
  if (analysis.avgMood != null) parts.push(`Mood avg: ${Number(analysis.avgMood).toFixed(1)}/10.`);
  if (analysis.avgSleep != null) parts.push(`Sleep avg: ${Number(analysis.avgSleep).toFixed(1)}/10.`);
  if (analysis.avgFatigue != null) parts.push(`Fatigue avg: ${Number(analysis.avgFatigue).toFixed(1)}/10.`);
  if (analysis.topSymptoms?.length) {
    parts.push(`Top symptoms: ${analysis.topSymptoms.slice(0, 4).join(', ')}.`);
  }
  if (analysis.topStressors?.length) {
    parts.push(`Top stressors: ${analysis.topStressors.slice(0, 4).join(', ')}.`);
  }
  if (analysis.correlations?.length) {
    parts.push(`Patterns: ${analysis.correlations.slice(0, 2).join(' ')}`);
  }
  if (analysis.thingsToWatch?.length) {
    parts.push(`Watch: ${analysis.thingsToWatch.slice(0, 2).join(' ')}`);
  }
  if (goals && typeof goals === 'object') {
    const goalBits = [];
    if (goals.sleep != null) goalBits.push(`sleep goal ${goals.sleep}/10`);
    if (goals.steps != null) goalBits.push(`steps goal ${goals.steps}`);
    if (goalBits.length) parts.push(`Goals: ${goalBits.join(', ')}.`);
  }
  const recentNotes = (logs || [])
    .map((l) => (l && l.notes ? String(l.notes).trim() : ''))
    .filter(Boolean);
  if (recentNotes.length) parts.push(wrapUserNote(recentNotes[recentNotes.length - 1]));

  const text = parts.join(' ');
  return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
}

export function buildClinicianBriefFallback(analysis = {}) {
  const lines = [];
  if (analysis.rangeLabel) lines.push(`Period: ${analysis.rangeLabel}.`);
  if (analysis.totalLogs != null) lines.push(`${analysis.totalLogs} logged days.`);
  if (analysis.flareDays) lines.push(`${analysis.flareDays} flare day(s) in range.`);
  if (analysis.avgFatigue != null) lines.push(`Average fatigue ${Number(analysis.avgFatigue).toFixed(1)}/10.`);
  if (analysis.topSymptoms?.length) lines.push(`Frequent symptoms: ${analysis.topSymptoms.slice(0, 3).join(', ')}.`);
  if (!lines.length) return 'Add more logs to generate a visit prep summary.';
  return lines.join(' ');
}
