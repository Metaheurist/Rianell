/** N11 — PWA/RN on-device LLM policy; no user-supplied commercial inference endpoints. */

export const BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS = [
  /api\.openai\.com/i,
  /api\.anthropic\.com/i,
  /generativelanguage\.googleapis\.com/i,
  /api\.cohere\.ai/i,
  /api\.mistral\.ai/i,
  /api\.groq\.com/i,
  /api\.together\.xyz/i,
  /openrouter\.ai/i,
  /api\.perplexity\.ai/i,
];

/** Hugging Face Hub is allowed for on-device model weights only (not chat API). */
export const ALLOWED_LLM_MODEL_HOSTS = [
  'huggingface.co',
  'cdn.jsdelivr.net',
];

/**
 * @param {string} endpoint
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function validateRemoteLlmEndpoint(endpoint) {
  const raw = String(endpoint || '').trim();
  if (!raw) return { allowed: true, ok: true };
  let host = '';
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return { allowed: false, ok: false, reason: 'invalid_url' };
  }
  if (BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS.some((re) => re.test(host))) {
    return { allowed: false, ok: false, reason: 'commercial_api_blocked' };
  }
  return { allowed: true, ok: true };
}

/** PWA inference path is on-device Transformers.js / MLC / GGUF only. */
export function isPwaOnDeviceLlmOnly() {
  return true;
}
