import { isPrivacyRegionConfigured } from './profileSync.mjs';
import { getFeatureAvailability, prefsToConsents } from './getFeatureAvailability.mjs';
import { isFirstRunWizardComplete } from '../onboarding/firstRunOrchestrator.mjs';

/**
 * Why the app must stay locked (null = unlocked for health logging).
 * @param {Record<string, unknown>} prefs
 * @param {import('../onboarding/firstRunSteps.mjs').FirstRunPlatformContext} [ctx]
 * @param {{ requireFirstRun?: boolean }} [opts]
 * @returns {'region-unconfigured'|'missing-health-consent'|'first-run-incomplete'|'health-logging-unavailable'|null}
 */
export function getConsentBlockReason(prefs, ctx, opts = {}) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const requireFirstRun = opts.requireFirstRun !== false;

  if (!isPrivacyRegionConfigured(p)) return 'region-unconfigured';

  if (p.privacyRegion === 'eea_uk' && p.healthDataConsent !== true) {
    return 'missing-health-consent';
  }

  const health = getFeatureAvailability(
    String(p.privacyRegion || 'other'),
    'localHealthLogging',
    prefsToConsents(p),
  );
  if (!health.available) {
    if (p.privacyRegion !== 'eea_uk' && isPrivacyRegionConfigured(p)) {
      /* Non-EEA first-run skips explicit health step — region confirmation is sufficient. */
    } else if (health.reason === 'missing_consent') {
      return 'missing-health-consent';
    } else {
      return 'health-logging-unavailable';
    }
  }

  if (requireFirstRun && !isFirstRunWizardComplete(p, ctx)) {
    return 'first-run-incomplete';
  }

  return null;
}

/** @param {Record<string, unknown>} prefs @param {import('../onboarding/firstRunSteps.mjs').FirstRunPlatformContext} [ctx] */
export function isHealthLoggingUnlocked(prefs, ctx) {
  return getConsentBlockReason(prefs, ctx) === null;
}
