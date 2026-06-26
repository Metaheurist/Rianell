/** Plan 23 CM3 — community-curated trigger library (k≥5). */

import { COHORT_MIN_K } from './cohortInsights.mjs';

export function normalizeTriggerRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: row.id,
    conditionTag: row.condition_tag || row.conditionTag,
    triggerName: row.trigger_name || row.triggerName,
    triggerCategory: row.trigger_category || row.triggerCategory,
    contributorCount: row.contributor_count ?? row.contributorCount ?? 0,
    approved: row.approved === true,
  };
}

export function getCommunityTriggers(rows, conditionTag) {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map(normalizeTriggerRow)
    .filter(Boolean)
    .filter((t) => !conditionTag || t.conditionTag === conditionTag)
    .filter((t) => t.approved && t.contributorCount >= COHORT_MIN_K)
    .sort((a, b) => b.contributorCount - a.contributorCount);
}
