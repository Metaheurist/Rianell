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

function classifyHealthChatTopic(message) {
  const msg = String(message || '').toLowerCase();
  if (/\b(sleep|rest|insomnia|slept|bedtime|tired at night)\b/.test(msg)) return 'sleep';
  if (/\b(mood|feeling|feelings|emotion|anxious|anxiety|happy|sad|low|affect)\b/.test(msg)) return 'mood';
  if (/\b(pattern|trend|correlat|link|shift|notice|see)\b/.test(msg)) return 'patterns';
  if (/\b(fatigue|energy|tired|exhaust)\b/.test(msg)) return 'fatigue';
  if (/\b(symptom|pain|flare|hurt)\b/.test(msg)) return 'symptom';
  if (/\b(stress|stressor|pressure)\b/.test(msg)) return 'stress';
  return 'general';
}

function formatMetricAvg(value) {
  return value != null && typeof value === 'number' ? value.toFixed(1) : null;
}

function trendPhrase(metric, trend) {
  if (!trend) return '';
  const label = METRIC_LABELS[metric] || metric;
  if (metric === 'sleep' || metric === 'mood') {
    return trend.direction === 'up'
      ? ` ${label} has been trending up in the second half of this period.`
      : ` ${label} has dipped in the second half of this period - note what changed around those days.`;
  }
  return trend.direction === 'up'
    ? ` ${label} has been climbing in the second half of this period.`
    : ` ${label} has eased in the second half of this period.`;
}

/**
 * Question-aware offline reply for Ask Rianell when on-device LLM is unavailable.
 * @param {object} [analysis]
 * @param {string} [userMessage]
 * @param {Array<object>} [logs]
 */
export function buildHealthChatOfflineReply(analysis = {}, userMessage = '', logs = []) {
  const total = analysis.totalLogs ?? 0;
  if (total < 3) {
    return 'Log a few more days and I can spot patterns in sleep, mood, and fatigue.';
  }

  const workLogs = analysis._logs?.length
    ? analysis._logs
    : filterLogsForHomeSuggestions(logs);
  const topic = classifyHealthChatTopic(userMessage);
  const flare = analysis.flareDays ?? 0;
  const avgSleep = analysis.avgSleep;
  const avgMood = analysis.avgMood;
  const avgFatigue = analysis.avgFatigue;
  const topSymptom = analysis.topSymptoms?.[0] || topSymptomName(workLogs)?.name;
  const topStressor = analysis.topStressors?.[0] || topStressorName(workLogs)?.name;
  const corr = findCorrelationPair(workLogs);

  if (topic === 'sleep') {
    const trend = metricTrend(workLogs, 'sleep');
    let line = avgSleep != null
      ? `Your recent sleep average is ${formatMetricAvg(avgSleep)}/10 across ${total} logged days.`
      : `You have ${total} logged days, but sleep scores are still sparse - add a sleep rating when you log.`;
    line += trendPhrase('sleep', trend);
    if (corr && (corr.a === 'sleep' || corr.b === 'sleep')) {
      const other = METRIC_LABELS[corr.a === 'sleep' ? corr.b : corr.a] || (corr.a === 'sleep' ? corr.b : corr.a);
      line += ` Sleep and ${other} tend to move together in your logs.`;
    }
    return line.trim();
  }

  if (topic === 'mood') {
    const trend = metricTrend(workLogs, 'mood');
    let line = avgMood != null
      ? `Your recent mood average is ${formatMetricAvg(avgMood)}/10 across ${total} logged days.`
      : `You have ${total} logged days, but mood scores are still sparse - rate mood when you log.`;
    line += trendPhrase('mood', trend);
    if (topStressor) line += ` ${topStressor} shows up often in your stress logs and may be worth tracking after tough days.`;
    else if (topSymptom) line += ` ${topSymptom} is your most frequent symptom - note whether mood dips on high-symptom days.`;
    else if (corr && (corr.a === 'mood' || corr.b === 'mood')) {
      const other = METRIC_LABELS[corr.a === 'mood' ? corr.b : corr.a] || (corr.a === 'mood' ? corr.b : corr.a);
      line += ` Mood and ${other} look linked in your recent entries.`;
    }
    return line.trim();
  }

  if (topic === 'patterns') {
    const parts = [];
    if (avgSleep != null && avgMood != null && avgFatigue != null) {
      parts.push(
        `Across ${total} recent days, averages are sleep ${formatMetricAvg(avgSleep)}, mood ${formatMetricAvg(avgMood)}, fatigue ${formatMetricAvg(avgFatigue)} (1–10).`,
      );
    } else {
      parts.push(`You logged ${total} days in this window.`);
    }
    if (topSymptom) parts.push(`${topSymptom} is your most common symptom.`);
    if (topStressor) parts.push(`${topStressor} appears often in stress logs.`);
    if (corr) {
      parts.push(
        `${METRIC_LABELS[corr.a] || corr.a} and ${METRIC_LABELS[corr.b] || corr.b} move together in your data.`,
      );
    }
    if (flare > 0) parts.push(`You had ${flare} flare day(s) - compare sleep and stress around those dates.`);
    if (parts.length > 1) return parts.join(' ');
  }

  if (topic === 'fatigue') {
    const trend = metricTrend(workLogs, 'fatigue');
    let line = avgFatigue != null
      ? `Your recent fatigue average is ${formatMetricAvg(avgFatigue)}/10 across ${total} logged days.`
      : `You have ${total} logged days, but fatigue scores are still sparse.`;
    line += trendPhrase('fatigue', trend);
    if (avgSleep != null && avgFatigue != null) {
      line += ` Sleep averaged ${formatMetricAvg(avgSleep)}/10 in the same period.`;
    }
    return line.trim();
  }

  if (topic === 'symptom' && topSymptom) {
    return `${topSymptom} appears often in your recent logs. Track triggers, rest, and sleep on high-symptom days.`;
  }

  if (topic === 'stress' && topStressor) {
    return `${topStressor} shows up in your stress logs. Consider pacing and recovery after high-stress days.`;
  }

  if (flare > 0) {
    return `You logged ${total} days with ${flare} flare day(s). Rest and steady routines may help - note sleep and stress around flare days.`;
  }

  if (avgSleep != null && avgMood != null) {
    return `Across ${total} logged days, sleep averages ${formatMetricAvg(avgSleep)}/10 and mood ${formatMetricAvg(avgMood)}/10. Keep noting what helps - patterns build with steady logging.`;
  }

  return `You logged ${total} days recently. Keep noting what helps - patterns build with steady logging.`;
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
    return `Recent averages - fatigue ${snap.avgFatigue.toFixed(1)}, sleep ${snap.avgSleep != null ? snap.avgSleep.toFixed(1) : '-'}, mood ${snap.avgMood != null ? snap.avgMood.toFixed(1) : '-'} (1-10).`;
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
