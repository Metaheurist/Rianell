/** Plan 13 RE1 — k-anonymous cohort insights from per-user facets. */

import { POOL_INSIGHT_MIN_K } from './poolGates.mjs';
import { flareToBit } from './researchFacets.mjs';

function mean(values) {
  const list = values.filter((v) => v != null && Number.isFinite(v));
  if (!list.length) return null;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

export function buildUserCohortsFromFacets(rows, kMin = POOL_INSIGHT_MIN_K) {
  const byUser = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const userId = row?.user_id || row?.userId;
    const facets = row?.research_facets || row?.facets;
    if (!userId || !facets || typeof facets !== 'object') continue;
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId).push(facets);
  }

  const highSleep = [];
  const lowSleep = [];
  for (const [, days] of byUser) {
    const sleepVals = days.map((d) => Number(d.sleep)).filter((v) => Number.isFinite(v));
    const avgSleep = mean(sleepVals);
    if (avgSleep == null) continue;
    const flareDays = days.filter((d) => flareToBit(d.flare) === 1).length;
    const flareRate = days.length ? flareDays / days.length : null;
    if (flareRate == null) continue;
    const entry = { avgSleep, flareRate, dayCount: days.length };
    if (avgSleep >= 7) highSleep.push(entry);
    else lowSleep.push(entry);
  }

  return {
    highSleep,
    lowSleep,
    contributorCount: byUser.size,
    kMin,
    highSleepCohort: highSleep.length,
    lowSleepCohort: lowSleep.length,
  };
}

export function buildSleepFlareInsight(cohorts) {
  const kMin = cohorts?.kMin ?? POOL_INSIGHT_MIN_K;
  const high = cohorts?.highSleep || [];
  const low = cohorts?.lowSleep || [];
  if (high.length < kMin || low.length < kMin) return null;
  const highFlare = mean(high.map((h) => h.flareRate));
  const lowFlare = mean(low.map((h) => h.flareRate));
  if (highFlare == null || lowFlare == null) return null;
  if (highFlare >= lowFlare) return null;
  return {
    id: 'sleep-flare',
    kMin,
    highSleepCohort: high.length,
    lowSleepCohort: low.length,
    highFlarePct: Math.round(highFlare * 100),
    lowFlarePct: Math.round(lowFlare * 100),
  };
}

export function computePoolInsightsFromFacets(rows, opts = {}) {
  const kMin = opts.kMin ?? POOL_INSIGHT_MIN_K;
  const cohorts = buildUserCohortsFromFacets(rows, kMin);
  const insights = [];
  const sleepFlare = buildSleepFlareInsight(cohorts);
  if (sleepFlare) insights.push(sleepFlare);
  return {
    kMin,
    contributorCount: cohorts.contributorCount,
    insights,
    suppressed: insights.length === 0,
  };
}

export function normalizePoolInsightsRpcResult(data) {
  if (!data || typeof data !== 'object') {
    return { kMin: POOL_INSIGHT_MIN_K, contributorCount: 0, insights: [], suppressed: true };
  }
  const insights = Array.isArray(data.insights) ? data.insights : [];
  return {
    kMin: Number(data.kMin) || POOL_INSIGHT_MIN_K,
    contributorCount: Number(data.contributorCount) || 0,
    insights,
    suppressed: insights.length === 0,
  };
}
