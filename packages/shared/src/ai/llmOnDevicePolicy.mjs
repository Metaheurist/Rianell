/** N11 - PWA/RN on-device LLM policy; no user-supplied commercial inference endpoints. */

export const BLOCKED_COMMERCIAL_LLM_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.cohere.ai',
  'api.mistral.ai',
  'api.groq.com',
  'api.together.xyz',
  'openrouter.ai',
  'api.perplexity.ai',
];

/**
 * @param {string} hostname
 * @returns {boolean}
 */
export function isBlockedCommercialLlmHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!host) return false;
  return BLOCKED_COMMERCIAL_LLM_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

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
  if (isBlockedCommercialLlmHost(host)) {
    return { allowed: false, ok: false, reason: 'commercial_api_blocked' };
  }
  return { allowed: true, ok: true };
}

/** PWA inference path is on-device Transformers.js / MLC / GGUF only. */
export function isPwaOnDeviceLlmOnly() {
  return true;
}
