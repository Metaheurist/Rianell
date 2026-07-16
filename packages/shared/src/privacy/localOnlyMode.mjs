/** Plan 05 P3 — local-only mode gates outbound network features. */

export const LOCAL_ONLY_NETWORK_FEATURES = [
  { id: 'cloudSync', labelKey: 'settings.privacy.localOnly.cloudSync' },
  { id: 'anonymizedSync', labelKey: 'settings.privacy.localOnly.anonymizedSync' },
  { id: 'modelDownload', labelKey: 'settings.privacy.localOnly.modelDownload' },
  { id: 'barcodeFood', labelKey: 'settings.privacy.localOnly.barcodeFood' },
  { id: 'bugReport', labelKey: 'settings.privacy.localOnly.bugReport' },
  { id: 'remoteLlm', labelKey: 'settings.privacy.localOnly.remoteLlm' },
  { id: 'sessionRecording', labelKey: 'settings.privacy.localOnly.sessionRecording' },
];

export function isLocalOnlyModeEnabled(prefs) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  return p.localOnlyMode === true;
}

/**
 * Returns false when local-only mode blocks the operation.
 * Demo mode does not block on-device model download (local inference); only local-only does.
 */
export function shouldAllowNetworkOperation(prefs, featureId) {
  if (!isLocalOnlyModeEnabled(prefs)) return true;
  const blocked = new Set(LOCAL_ONLY_NETWORK_FEATURES.map((f) => f.id));
  return !blocked.has(featureId);
}

/** On-device AI model download/init — allowed in demo mode; blocked only by local-only. */
export function shouldAllowAiModelDownload(prefs) {
  return shouldAllowNetworkOperation(prefs, 'modelDownload');
}

export function localOnlyBlockReason(featureId) {
  return { blocked: true, featureId, reason: 'local_only_mode' };
}
