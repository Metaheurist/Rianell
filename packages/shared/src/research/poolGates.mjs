/** Plan 13 — gates for anonymized pool contribution and insight viewing. */

export const POOL_INSIGHT_MIN_K = 5;
export const POOL_CONTRIBUTION_MIN_DAYS = 90;

const PLACEHOLDER_CONDITIONS = new Set(['', 'medical condition']);

export function isValidMedicalConditionForPool(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_CONDITIONS.has(trimmed.toLowerCase());
}

export function canExportContributionHistory(prefs, opts = {}) {
  if (!opts.signedIn) return { allowed: false, reason: 'signIn' };
  if (!prefs?.contributeAnonData) return { allowed: false, reason: 'optIn' };
  if (!isValidMedicalConditionForPool(prefs.medicalCondition)) {
    return { allowed: false, reason: 'condition' };
  }
  return { allowed: true };
}

export function canViewPoolInsights(prefs, opts = {}) {
  const poolDayCount = Number(opts.poolDayCount) || 0;
  if (!opts.signedIn) return { allowed: false, reason: 'signIn' };
  if (!prefs?.contributeAnonData) return { allowed: false, reason: 'optIn' };
  if (!isValidMedicalConditionForPool(prefs.medicalCondition)) {
    return { allowed: false, reason: 'condition' };
  }
  if (poolDayCount < POOL_CONTRIBUTION_MIN_DAYS) {
    return { allowed: false, reason: 'minDays', minDays: POOL_CONTRIBUTION_MIN_DAYS, poolDayCount };
  }
  return { allowed: true };
}
