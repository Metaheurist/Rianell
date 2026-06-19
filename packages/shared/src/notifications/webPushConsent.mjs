import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';

/** Plan 11 R4 — gate Web Push opt-in on region, consent, and VAPID configuration. */
export function canOfferWebPush(prefs, opts = {}) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const vapid = String(opts.vapidPublicKey || '').trim();
  if (!vapid) return { ok: false, reason: 'vapid-unconfigured' };
  if (p.demoMode === true) return { ok: false, reason: 'demo-mode' };
  if (p.localOnlyMode === true) return { ok: false, reason: 'local-only' };
  if (!isPrivacyRegionConfigured(p)) return { ok: false, reason: 'region-unconfigured' };
  if (p.privacyRegion === 'eea_uk' && p.healthDataConsent !== true) {
    return { ok: false, reason: 'health-consent-required' };
  }
  return { ok: true };
}
