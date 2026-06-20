import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';

/** @param {string} vapidPublicKey */
export function isConfiguredVapidPublicKey(vapidPublicKey) {
  const vapid = String(vapidPublicKey || '').trim();
  return vapid.length > 0 && vapid !== 'YOUR_VAPID_PUBLIC_KEY';
}

/** Plan 11 R4 — gate Web Push opt-in on region, consent, and VAPID configuration. */
export function canOfferWebPush(prefs, opts = {}) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const vapid = String(opts.vapidPublicKey || '').trim();
  if (!isConfiguredVapidPublicKey(vapid)) return { ok: false, reason: 'vapid-unconfigured' };
  if (p.demoMode === true) return { ok: false, reason: 'demo-mode' };
  if (p.localOnlyMode === true) return { ok: false, reason: 'local-only' };
  if (!isPrivacyRegionConfigured(p)) return { ok: false, reason: 'region-unconfigured' };
  if (p.privacyRegion === 'eea_uk' && p.healthDataConsent !== true) {
    return { ok: false, reason: 'health-consent-required' };
  }
  return { ok: true };
}
