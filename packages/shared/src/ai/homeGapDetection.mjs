/** Plan 10 H7 — yesterday logging gaps → single daily contextual home question. */

import { filterLogsForHomeSuggestions } from './homeSuggestions.mjs';

export const HOME_GAP_IDS = ['gap-meds', 'gap-sleep', 'gap-food'];
export const MAX_HOME_QUESTION_ANSWERS_PER_DAY = 3;

function toDate(value) {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayOf(todayStr) {
  const d = toDate(todayStr);
  if (!d) return null;
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

function logByDate(logs, dateStr) {
  if (!Array.isArray(logs) || !dateStr) return null;
  return logs.find((l) => l && l.date === dateStr) || null;
}

export function isFoodEmpty(log) {
  if (!log) return true;
  const f = log.food;
  if (!f) return true;
  if (Array.isArray(f)) return f.length === 0;
  if (typeof f === 'object') {
    return !['breakfast', 'lunch', 'dinner', 'snack'].some(
      (k) => Array.isArray(f[k]) && f[k].length > 0,
    );
  }
  return true;
}

export function isSleepMissing(log) {
  return !log || typeof log.sleep !== 'number';
}

export function hasMissedMeds(log) {
  if (!log) return false;
  if (Array.isArray(log.medicationDoses)) {
    return log.medicationDoses.some((d) => d && (d.status === 'missed' || d.status === 'skipped'));
  }
  if (Array.isArray(log.medications)) {
    return log.medications.some((m) => m && m.taken === false);
  }
  return false;
}

function isMedsUnlogged(log) {
  if (!log) return true;
  const doses = Array.isArray(log.medicationDoses) ? log.medicationDoses.length : 0;
  const meds = Array.isArray(log.medications) ? log.medications.length : 0;
  return doses === 0 && meds === 0;
}

function recentLogsBefore(logs, beforeDateStr, windowDays = 7) {
  const end = toDate(beforeDateStr);
  if (!end) return [];
  const start = new Date(end);
  start.setDate(start.getDate() - windowDays);
  return (logs || []).filter((log) => {
    const d = toDate(log?.date);
    return d && d >= start && d < end;
  });
}

export function userTracksFood(logs, beforeDateStr, windowDays = 7) {
  const recent = recentLogsBefore(logs, beforeDateStr, windowDays);
  return recent.filter((l) => !isFoodEmpty(l)).length >= 2;
}

export function userTracksSleep(logs, windowDays = 14, todayStr = new Date().toISOString().slice(0, 10)) {
  const end = toDate(todayStr);
  if (!end) return false;
  const start = new Date(end);
  start.setDate(start.getDate() - (windowDays - 1));
  const recent = (logs || []).filter((log) => {
    const d = toDate(log?.date);
    return d && d >= start && d <= end;
  });
  return recent.filter((l) => typeof l.sleep === 'number').length >= 3;
}

export function userTracksMeds(logs, medSchedule, windowDays = 14, todayStr = new Date().toISOString().slice(0, 10)) {
  if (Array.isArray(medSchedule) && medSchedule.length > 0) return true;
  const end = toDate(todayStr);
  if (!end) return false;
  const start = new Date(end);
  start.setDate(start.getDate() - (windowDays - 1));
  let count = 0;
  for (const log of logs || []) {
    const d = toDate(log?.date);
    if (!d || d < start || d > end) continue;
    const doses = Array.isArray(log.medicationDoses) ? log.medicationDoses.length : 0;
    const meds = Array.isArray(log.medications) ? log.medications.length : 0;
    if (doses > 0 || meds > 0) count += 1;
  }
  return count >= 2;
}

/**
 * @returns {Array<{ id: string, reason: string }>}
 */
export function detectHomeLoggingGaps(logs, options = {}) {
  const {
    todayStr = new Date().toISOString().slice(0, 10),
    medSchedule = [],
  } = options;
  const yStr = yesterdayOf(todayStr);
  if (!yStr) return [];

  const yesterday = logByDate(logs, yStr);
  const gaps = [];

  if (userTracksMeds(logs, medSchedule, 14, todayStr)) {
    if (!yesterday) {
      gaps.push({ id: 'gap-meds', reason: 'no_log' });
    } else if (hasMissedMeds(yesterday)) {
      gaps.push({ id: 'gap-meds', reason: 'missed' });
    } else if (isMedsUnlogged(yesterday)) {
      gaps.push({ id: 'gap-meds', reason: 'unlogged' });
    }
  }

  if (userTracksSleep(logs, 14, todayStr)) {
    if (
      yesterday &&
      isSleepMissing(yesterday) &&
      (typeof yesterday.fatigue === 'number' ||
        typeof yesterday.mood === 'number' ||
        typeof yesterday.jointPain === 'number')
    ) {
      gaps.push({ id: 'gap-sleep', reason: 'missing' });
    }
  }

  if (userTracksFood(logs, todayStr)) {
    if (yesterday && isFoodEmpty(yesterday)) {
      gaps.push({ id: 'gap-food', reason: 'empty' });
    }
  }

  return gaps.sort(
    (a, b) => HOME_GAP_IDS.indexOf(a.id) - HOME_GAP_IDS.indexOf(b.id),
  );
}

const GAP_LABEL_KEYS = {
  'gap-meds': 'home.questions.gapMeds',
  'gap-sleep': 'home.questions.gapSleep',
  'gap-food': 'home.questions.gapFood',
};

export function gapToHomeQuestionChip(gap) {
  if (!gap?.id || !GAP_LABEL_KEYS[gap.id]) return null;
  return { id: gap.id, labelKey: GAP_LABEL_KEYS[gap.id], labelParams: {} };
}

export function normalizeHomeGapQuestionCache(raw) {
  const v = raw && typeof raw === 'object' ? raw : {};
  const date = typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : null;
  const gapId = typeof v.gapId === 'string' && HOME_GAP_IDS.includes(v.gapId) ? v.gapId : null;
  if (!date || !gapId) return null;
  return { date, gapId };
}

export function normalizeHomeQuestionAnswerState(raw, todayStr) {
  const v = raw && typeof raw === 'object' ? raw : {};
  const date = typeof v.date === 'string' ? v.date : null;
  const count = typeof v.count === 'number' && v.count >= 0 ? Math.floor(v.count) : 0;
  if (date !== todayStr) return { date: todayStr, count: 0 };
  return { date: todayStr, count };
}

export function canAnswerHomeQuestionToday(state, todayStr) {
  const normalized = normalizeHomeQuestionAnswerState(state, todayStr);
  return normalized.count < MAX_HOME_QUESTION_ANSWERS_PER_DAY;
}

export function nextHomeQuestionAnswerState(state, todayStr) {
  const normalized = normalizeHomeQuestionAnswerState(state, todayStr);
  return { date: todayStr, count: normalized.count + 1 };
}

/**
 * Pick one gap-based question per calendar day (cached).
 * @returns {{ chip: object|null, cacheUpdate: { date: string, gapId: string }|null }}
 */
export function pickDailyHomeGapQuestion(logs, options = {}) {
  const {
    todayStr = new Date().toISOString().slice(0, 10),
    homeGapQuestionCache = null,
    medSchedule = [],
  } = options;

  const gaps = detectHomeLoggingGaps(logs, { todayStr, medSchedule });
  if (!gaps.length) return { chip: null, cacheUpdate: null };

  const cache = normalizeHomeGapQuestionCache(homeGapQuestionCache);
  if (cache?.date === todayStr) {
    const cachedGap = gaps.find((g) => g.id === cache.gapId);
    if (cachedGap) {
      return { chip: gapToHomeQuestionChip(cachedGap), cacheUpdate: null };
    }
  }

  const top = gaps[0];
  return {
    chip: gapToHomeQuestionChip(top),
    cacheUpdate: { date: todayStr, gapId: top.id },
  };
}

/** Recent logs window for gap context (yesterday focus). */
export function logsForHomeGapContext(logs) {
  return filterLogsForHomeSuggestions(logs, 7);
}
