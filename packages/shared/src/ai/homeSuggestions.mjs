/** Rule-based contextual AI question chips for Home (PWA + RN parity). */

import {
  canAnswerHomeQuestionToday,
  pickDailyHomeGapQuestion,
} from './homeGapDetection.mjs';

export const HOME_SUGGESTIONS_RANGE_DAYS = 14;
export const HOME_SUGGESTIONS_MIN_DAYS = 3;
export const HOME_SUGGESTIONS_MAX_CHIPS = 3;
const SYMPTOM_FREQ_THRESHOLD = 3;
const FLARE_DAYS_THRESHOLD = 2;
const CORRELATION_THRESHOLD = 0.35;

function toDate(value) {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterLogsForHomeSuggestions(logs, rangeDays = HOME_SUGGESTIONS_RANGE_DAYS) {
  if (!Array.isArray(logs)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (rangeDays - 1));
  return logs.filter((log) => {
    const d = toDate(log?.date);
    return !!d && d >= start && d <= today;
  });
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pearson(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  const avgX = xs.reduce((a, b) => a + b, 0) / n;
  const avgY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - avgX;
    const dy = ys[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

function topSymptomName(logs) {
  const counts = new Map();
  logs.forEach((log) => {
    const list = log?.symptoms;
    if (!Array.isArray(list)) return;
    list.forEach((x) => {
      const item = String(x || '').trim();
      if (!item) return;
      counts.set(item, (counts.get(item) ?? 0) + 1);
    });
  });
  let best = null;
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return bestCount >= SYMPTOM_FREQ_THRESHOLD ? { name: best, count: bestCount } : null;
}

function topStressorName(logs) {
  const counts = new Map();
  logs.forEach((log) => {
    const list = log?.stressors;
    if (!Array.isArray(list)) return;
    list.forEach((x) => {
      const item = String(x || '').trim();
      if (!item) return;
      counts.set(item, (counts.get(item) ?? 0) + 1);
    });
  });
  let best = null;
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return bestCount >= 2 ? { name: best, count: bestCount } : null;
}

function parseTopListItem(item) {
  const raw = String(item || '').trim();
  const m = raw.match(/^(.+?)\s*\((\d+)\)$/);
  return m ? { name: m[1].trim(), count: Number(m[2]) } : { name: raw, count: 0 };
}

function metricTrend(logs, field) {
  const sorted = [...logs].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const mid = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, mid);
  const second = sorted.slice(mid);
  const a = mean(first.map((l) => l[field]).filter((v) => typeof v === 'number'));
  const b = mean(second.map((l) => l[field]).filter((v) => typeof v === 'number'));
  if (a == null || b == null) return null;
  const delta = b - a;
  if (Math.abs(delta) < 1.2) return null;
  return { metric: field, direction: delta > 0 ? 'up' : 'down', delta };
}

function weekCompare(logs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
  const thisWeek = logs.filter((l) => {
    const d = toDate(l.date);
    return d && d >= weekAgo && d <= today;
  });
  const lastWeek = logs.filter((l) => {
    const d = toDate(l.date);
    return d && d >= twoWeeksAgo && d < weekAgo;
  });
  if (thisWeek.length < 2 || lastWeek.length < 2) return null;
  for (const field of ['fatigue', 'sleep', 'mood']) {
    const cur = mean(thisWeek.map((l) => l[field]).filter((v) => typeof v === 'number'));
    const prev = mean(lastWeek.map((l) => l[field]).filter((v) => typeof v === 'number'));
    if (cur != null && prev != null && Math.abs(cur - prev) >= 1) {
      return { field, cur, prev };
    }
  }
  return { comparable: true };
}

function findCorrelationPair(logs) {
  const moodSleep = logs.filter((x) => x.mood != null && x.sleep != null);
  const c1 = pearson(
    moodSleep.map((x) => x.mood),
    moodSleep.map((x) => x.sleep),
  );
  if (c1 != null && Math.abs(c1) >= CORRELATION_THRESHOLD) {
    return { a: 'mood', b: 'sleep', r: c1 };
  }
  const sleepFatigue = logs.filter((x) => x.sleep != null && x.fatigue != null);
  const c2 = pearson(
    sleepFatigue.map((x) => x.sleep),
    sleepFatigue.map((x) => x.fatigue),
  );
  if (c2 != null && Math.abs(c2) >= CORRELATION_THRESHOLD) {
    return { a: 'sleep', b: 'fatigue', r: c2 };
  }
  return null;
}

/** Build analysis snapshot from raw logs (14-day window). */
export function computeHomeAnalysisSnapshot(logs, rangeDays = HOME_SUGGESTIONS_RANGE_DAYS) {
  const selected = filterLogsForHomeSuggestions(logs, rangeDays);
  const mood = selected.map((x) => x.mood).filter((x) => typeof x === 'number');
  const sleep = selected.map((x) => x.sleep).filter((x) => typeof x === 'number');
  const fatigue = selected.map((x) => x.fatigue).filter((x) => typeof x === 'number');
  return {
    totalLogs: selected.length,
    flareDays: selected.filter((x) => x.flare === 'Yes').length,
    avgMood: mean(mood),
    avgSleep: mean(sleep),
    avgFatigue: mean(fatigue),
    topSymptoms: topSymptomName(selected) ? [topSymptomName(selected).name] : [],
    topStressors: topStressorName(selected) ? [topStressorName(selected).name] : [],
    _logs: selected,
  };
}

/** Adapt RN AiSummary into snapshot shape. */
export function analysisSnapshotFromSummary(summary, logs) {
  const selected = filterLogsForHomeSuggestions(logs || []);
  const topSym = summary?.topSymptoms?.[0] ? parseTopListItem(summary.topSymptoms[0]) : null;
  const topStr = summary?.topStressors?.[0] ? parseTopListItem(summary.topStressors[0]) : null;
  return {
    totalLogs: summary?.totalLogs ?? selected.length,
    flareDays: summary?.flareDays ?? 0,
    avgMood: summary?.avgMood ?? null,
    avgSleep: summary?.avgSleep ?? null,
    avgFatigue: summary?.avgFatigue ?? null,
    topSymptoms: topSym?.name ? [topSym.name] : [],
    topStressors: topStr?.name ? [topStr.name] : [],
    correlations: summary?.correlations || [],
    _logs: selected,
  };
}

const METRIC_LABELS = {
  fatigue: 'fatigue',
  sleep: 'sleep',
  mood: 'mood',
};

/**
 * @returns {{ chips: Array<{ id: string, labelKey: string, labelParams: Record<string, string> }>, gapCacheUpdate: object|null }}
 */
export function pickHomeAiSuggestionBundle(logs, analysis, options = {}) {
  const {
    aiEnabled = true,
    loggedToday = false,
    rangeDays = HOME_SUGGESTIONS_RANGE_DAYS,
    minDays = HOME_SUGGESTIONS_MIN_DAYS,
    maxChips = HOME_SUGGESTIONS_MAX_CHIPS,
    todayStr = new Date().toISOString().slice(0, 10),
    homeGapQuestionCache = null,
    medSchedule = [],
    homeQuestionAnswerState = null,
  } = options;

  const picked = [];
  const used = new Set();
  let gapCacheUpdate = null;

  if (!aiEnabled) {
    return { chips: [], gapCacheUpdate: null };
  }

  function add(id, labelKey, labelParams) {
    if (picked.length >= maxChips || used.has(id)) return;
    used.add(id);
    picked.push({ id, labelKey, labelParams: labelParams || {} });
  }

  if (canAnswerHomeQuestionToday(homeQuestionAnswerState, todayStr)) {
    const gapPick = pickDailyHomeGapQuestion(logs, {
      todayStr,
      homeGapQuestionCache,
      medSchedule,
    });
    if (gapPick.chip) {
      gapCacheUpdate = gapPick.cacheUpdate;
      add(gapPick.chip.id, gapPick.chip.labelKey, gapPick.chip.labelParams);
    }
  }

  if (!loggedToday) {
    return { chips: picked.slice(0, maxChips), gapCacheUpdate };
  }

  const recent = filterLogsForHomeSuggestions(logs, rangeDays);
  if (recent.length < minDays) {
    return { chips: picked.slice(0, maxChips), gapCacheUpdate };
  }

  const snapshot = analysis || computeHomeAnalysisSnapshot(logs, rangeDays);
  const workLogs = snapshot._logs || recent;

  const sym = topSymptomName(workLogs);
  if (sym) add('symptom', 'home.questions.symptom', { symptom: sym.name });

  const flareDays = snapshot.flareDays ?? workLogs.filter((l) => l.flare === 'Yes').length;
  if (flareDays >= FLARE_DAYS_THRESHOLD) add('flare', 'home.questions.flare', {});

  for (const field of ['fatigue', 'sleep', 'mood']) {
    const trend = metricTrend(workLogs, field);
    if (!trend) continue;
    const worsening =
      (field === 'fatigue' && trend.direction === 'up') ||
      (field === 'sleep' && trend.direction === 'down') ||
      (field === 'mood' && trend.direction === 'down');
    if (worsening) {
      add(`trend-${field}`, 'home.questions.trend', {
        metric: METRIC_LABELS[field] || field,
        direction: trend.direction,
      });
      break;
    }
  }

  const stressor =
    snapshot.topStressors?.[0] ||
    (topStressorName(workLogs)?.name ?? null);
  if (stressor) add('stressor', 'home.questions.stressor', { stressor: String(stressor) });

  const corr = findCorrelationPair(workLogs);
  if (corr) {
    add('correlation', 'home.questions.correlation', {
      a: METRIC_LABELS[corr.a] || corr.a,
      b: METRIC_LABELS[corr.b] || corr.b,
    });
  }

  if (weekCompare(workLogs)) add('compare', 'home.questions.compare', {});

  return { chips: picked.slice(0, maxChips), gapCacheUpdate };
}

/**
 * @returns {Array<{ id: string, labelKey: string, labelParams: Record<string, string> }>}
 */
export function pickHomeAiSuggestions(logs, analysis, options = {}) {
  return pickHomeAiSuggestionBundle(logs, analysis, options).chips;
}

/** Deterministic fallback when LLM unavailable. */
export function buildHomeQuestionFallback(suggestion, analysis) {
  const snap = analysis || {};
  const id = suggestion?.id || '';
  if (id === 'symptom' && suggestion.labelParams?.symptom) {
    return `${suggestion.labelParams.symptom} appears often in your recent logs - track triggers and rest on high-symptom days.`;
  }
  if (id === 'flare' && snap.flareDays != null) {
    return `You logged ${snap.flareDays} flare day(s) recently. Note sleep, stress, and activity around those dates.`;
  }
  if (id.startsWith('trend-') && snap.avgFatigue != null) {
    return `Recent averages - fatigue ${snap.avgFatigue.toFixed(1)}, sleep ${snap.avgSleep != null ? snap.avgSleep.toFixed(1) : '-'}, mood ${snap.avgMood != null ? snap.avgMood.toFixed(1) : '-'} (1–10).`;
  }
  if (id === 'stressor' && suggestion.labelParams?.stressor) {
    return `${suggestion.labelParams.stressor} shows up in your stress logs - consider pacing and recovery after high-stress days.`;
  }
  if (id === 'compare') {
    return 'Compare this week’s scores to last week in Charts to spot gradual shifts.';
  }
  if (id === 'gap-meds') {
    return 'Yesterday’s medication log looks incomplete or includes missed doses. Note what happened and any side effects.';
  }
  if (id === 'gap-sleep') {
    return 'Sleep was not logged yesterday even though you tracked other scores. A quick sleep rating helps link rest to symptoms.';
  }
  if (id === 'gap-food') {
    return 'No food was logged yesterday. Even a light note about meals can reveal triggers alongside symptoms.';
  }
  return 'Keep logging daily - patterns become clearer with more entries.';
}
