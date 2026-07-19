/** Allowlisted GGUF model for Path 3 spike (lazy-loaded). */
export const GGUF_BASE_MODEL_ID = 'bartowski/Qwen2.5-1.5B-Instruct-GGUF';

export const ALLOWED_GGUF_MODEL_IDS = Object.freeze([GGUF_BASE_MODEL_ID]);

export function isAllowedGgufModelId(id) {
  return ALLOWED_GGUF_MODEL_IDS.some((allowed) => String(id || '').startsWith(allowed));
}
