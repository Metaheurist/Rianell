/** Features routed to the smallest on-device model (SmolLM / tier1) for fast inference. */
export const INSTANT_LLM_FEATURES = new Set(['motd', 'suggestNote']);

export function isInstantLlmFeature(feature) {
  return INSTANT_LLM_FEATURES.has(feature);
}

/** Force tier1 for MOTD/suggest; otherwise keep the resolved preference. */
export function resolveLlmModelSizeForFeature(resolvedSize, feature) {
  if (isInstantLlmFeature(feature)) return 'tier1';
  return resolvedSize;
}
