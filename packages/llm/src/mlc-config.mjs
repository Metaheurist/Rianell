/** Allowlisted MLC WebLLM model for the base 1.5B tier (device tiers 3–5). */
export const MLC_BASE_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

/** Small MLC model for low device tiers (tier 1–2). ~380 MB q4f16, strong instruct quality. */
export const MLC_SMALL_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export const ALLOWED_MLC_MODEL_IDS = Object.freeze([MLC_SMALL_MODEL_ID, MLC_BASE_MODEL_ID]);

export function isAllowedMlcModelId(id) {
  return ALLOWED_MLC_MODEL_IDS.includes(String(id || '').trim());
}

/** Map a device tier key (tier1..tier5 / small / base) to the MLC model it should load. */
export function resolveMlcModelForTier(tier) {
  const t = String(tier || '').trim();
  if (t === 'tier1' || t === 'tier2' || t === 'small') return MLC_SMALL_MODEL_ID;
  return MLC_BASE_MODEL_ID;
}
