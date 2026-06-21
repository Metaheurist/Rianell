/**
 * Session recording (Smartlook) — default-on after onboarding disclosure; opt-out in Settings.
 */

/**
 * True when the user pref is on AND they saw onboarding disclosure or explicitly enabled in Settings.
 * @param {Record<string, unknown>|null|undefined} prefs
 */
export function shouldActivateSessionRecording(prefs) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  if (p.sessionRecording !== true) return false;
  const disclosed =
    typeof p.sessionRecordingDisclosureAt === 'string' && p.sessionRecordingDisclosureAt.length > 0;
  const enabledAt = typeof p.sessionRecordingAt === 'string' && p.sessionRecordingAt.length > 0;
  return disclosed || enabledAt;
}
