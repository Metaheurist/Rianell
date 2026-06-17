/** Allowlisted MLC WebLLM model for Path 2 (tier 3–5 Llama on GPU). */
export const MLC_LLAMA_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

export const ALLOWED_MLC_MODEL_IDS = Object.freeze([MLC_LLAMA_MODEL_ID]);

export function isAllowedMlcModelId(id) {
  return ALLOWED_MLC_MODEL_IDS.includes(String(id || '').trim());
}
