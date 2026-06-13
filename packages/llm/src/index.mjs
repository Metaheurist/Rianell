export const LLM_MODEL_SMALL = 'SmolLM2-360M-Instruct';
export const LLM_MODEL_BASE = 'Llama-3.2-1B-Instruct';

export function modelIdFromTier(tier) {
  if (tier === 'tier1' || tier === 'tier2') return LLM_MODEL_SMALL;
  return LLM_MODEL_BASE;
}

export function defaultMotdFallback() {
  return [
    'A glass of water is a good way to start the day.',
    'Sleep is how your body repairs itself.',
    'Simple, steady habits build lasting health.',
  ];
}

export function pickMotdFallback(rng = Math.random) {
  const list = defaultMotdFallback();
  return list[Math.floor(rng() * list.length)];
}

/** Shared LLM request shape for web and RN adapters. */
export function buildLlmContext(intent, payload) {
  return { intent, payload, ts: Date.now() };
}
