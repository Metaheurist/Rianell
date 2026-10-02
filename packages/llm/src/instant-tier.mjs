/** Short-output features (smaller token budgets and timeouts). */
export const INSTANT_LLM_FEATURES = new Set(['motd', 'suggestNote']);

export function isInstantLlmFeature(feature) {
  return INSTANT_LLM_FEATURES.has(feature);
}

/**
 * Every feature uses the session model. Routing instant features to a second, smaller
 * model made a tier-3+ device download both and evict one for the other on each call.
 */
export function resolveLlmModelSizeForFeature(resolvedSize, _feature) {
  return resolvedSize;
}
