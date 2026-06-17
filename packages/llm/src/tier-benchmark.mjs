/** Shared tier 1–5 thresholds and tier → llmModelSize mapping (PWA + RN parity). */

export const TIER_KEYS = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'];

/** PWA device-benchmark: ms per 200k ops → tier (lower is better). */
export function msPer200kToTier(msPer200k) {
  if (msPer200k <= 8.0) return 5;
  if (msPer200k <= 12.0) return 4;
  if (msPer200k <= 18.0) return 3;
  if (msPer200k <= 26.0) return 2;
  return 1;
}

/** RN benchmark workload: elapsed ms → tier (aligned tier boundaries with PWA scale). */
export function scoreMsToTier(scoreMs) {
  if (scoreMs <= 14) return 5;
  if (scoreMs <= 26) return 4;
  if (scoreMs <= 44) return 3;
  if (scoreMs <= 72) return 2;
  return 1;
}

export function tierToLlmModelSize(tier) {
  const n = typeof tier === 'number' ? tier : Number(String(tier).replace('tier', ''));
  if (n >= 5) return 'tier5';
  if (n === 4) return 'tier4';
  if (n === 3) return 'tier3';
  if (n === 2) return 'tier2';
  return 'tier1';
}

export function modelSizeFromTierNumber(tier) {
  return tierToLlmModelSize(tier);
}
