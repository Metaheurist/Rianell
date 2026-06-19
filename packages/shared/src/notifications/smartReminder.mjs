/** Plan 11 R1 — learn median log time; nudge if missed by median + grace. */

export const SMART_REMINDER_WINDOW_DAYS = 14;
export const SMART_REMINDER_MIN_SAMPLES = 3;
export const SMART_REMINDER_GRACE_MINUTES = 30;

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseHHMM(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute, totalMinutes: hour * 60 + minute };
}

export function localDateStrFromNow(now = new Date()) {
  return toDateStr(now);
}

export function minutesToHHMM(totalMinutes) {
  const m = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function addMinutesToHHMM(hhmm, delta) {
  const p = parseHHMM(hhmm);
  if (!p) return hhmm;
  return minutesToHHMM(p.totalMinutes + delta);
}

function parseSavedAtToMinutes(savedAt) {
  if (typeof savedAt !== 'string' || !savedAt.trim()) return null;
  const d = new Date(savedAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

export function hasLoggedToday(logs, todayStr) {
  if (!Array.isArray(logs) || !todayStr) return false;
  return logs.some((l) => l && l.date === todayStr);
}

export function computeMedianLogTimeMinutes(logs, opts = {}) {
  const windowDays = opts.windowDays ?? SMART_REMINDER_WINDOW_DAYS;
  const minSamples = opts.minSamples ?? SMART_REMINDER_MIN_SAMPLES;
  const now = opts.now instanceof Date ? opts.now : new Date();
  const todayStr = opts.todayStr ?? toDateStr(now);
  const end = new Date(`${todayStr}T23:59:59`);
  const start = new Date(end);
  start.setDate(start.getDate() - windowDays);

  const minutes = [];
  (logs || []).forEach((log) => {
    if (!log?.date) return;
    const d = new Date(`${log.date}T12:00:00`);
    if (Number.isNaN(d.getTime()) || d < start || d > end) return;
    const m = parseSavedAtToMinutes(log.savedAt);
    if (m == null) return;
    minutes.push(m);
  });

  if (minutes.length < minSamples) return null;
  minutes.sort((a, b) => a - b);
  const mid = Math.floor(minutes.length / 2);
  return minutes.length % 2 === 1 ? minutes[mid] : Math.round((minutes[mid - 1] + minutes[mid]) / 2);
}

export function resolveSmartReminderTime(logs, fallbackHHMM, opts = {}) {
  const median = computeMedianLogTimeMinutes(logs, opts);
  if (median == null) {
    const fallback = parseHHMM(fallbackHHMM);
    return { time: fallback ? fallbackHHMM : '20:00', learned: false };
  }
  return { time: minutesToHHMM(median), learned: true };
}

export function resolveMissedLogNudgeTimeHHMM(logs, fallbackHHMM, opts = {}) {
  const { time, learned } = resolveSmartReminderTime(logs, fallbackHHMM, opts);
  const grace = opts.graceMinutes ?? SMART_REMINDER_GRACE_MINUTES;
  return { time: addMinutesToHHMM(time, grace), learned, baseTime: time };
}

export function shouldFireMissedLogNudge(logs, now, opts = {}) {
  const todayStr = opts.todayStr ?? toDateStr(now);
  if (hasLoggedToday(logs, todayStr)) {
    return { fire: false, reason: 'logged-today' };
  }
  const fallback = opts.fallbackHHMM ?? '20:00';
  const { time: nudgeHHMM, learned } = resolveMissedLogNudgeTimeHHMM(logs, fallback, opts);
  const nudge = parseHHMM(nudgeHHMM);
  if (!nudge) return { fire: false, reason: 'invalid-nudge-time' };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < nudge.totalMinutes) {
    return { fire: false, reason: 'before-nudge-time', nudgeHHMM, learned };
  }
  if (opts.lastNudgeDate === todayStr) {
    return { fire: false, reason: 'already-nudged', nudgeHHMM, learned };
  }
  return { fire: true, nudgeHHMM, learned };
}

/** Preserve first save timestamp per calendar day for median learning. */
export function stampLogSavedAtForSave(entry, existingEntry, when = new Date()) {
  if (!entry || typeof entry !== 'object') return entry;
  if (existingEntry?.savedAt && existingEntry.date === entry.date) {
    return { ...entry, savedAt: existingEntry.savedAt };
  }
  return { ...entry, savedAt: when.toISOString() };
}
