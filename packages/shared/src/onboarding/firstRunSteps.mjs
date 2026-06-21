import { isTrackingProfileConfigured } from '../settings/trackingProfile.mjs';

/** First-run wizard step ids (shared PWA + RN). */
export const FIRST_RUN_STEP_IDS = [
  'region',
  'healthConsent',
  'cookies',
  'trackingProfile',
  'tutorial',
  'aiDownload',
  'install',
];

/** @typedef {'region'|'healthConsent'|'cookies'|'trackingProfile'|'tutorial'|'aiDownload'|'install'} FirstRunStepId */

/** @typedef {{ platform: 'pwa'|'rn', cookieConsentAccepted?: boolean, installModalSeen?: boolean, standalonePwa?: boolean, tutorialSeenLegacy?: boolean }} FirstRunPlatformContext */

export const FIRST_RUN_STEP_META = {
  region: { titleKey: 'onboarding.step.region' },
  healthConsent: { titleKey: 'onboarding.step.healthConsent' },
  cookies: { titleKey: 'onboarding.step.cookies' },
  trackingProfile: { titleKey: 'onboarding.step.trackingProfile' },
  tutorial: { titleKey: 'onboarding.step.tutorial' },
  aiDownload: { titleKey: 'onboarding.step.aiDownload' },
  install: { titleKey: 'onboarding.step.install' },
};

/**
 * @param {FirstRunStepId} stepId
 * @param {Record<string, unknown>} prefs
 * @param {FirstRunPlatformContext} ctx
 */
export function shouldSkipFirstRunStep(stepId, prefs, ctx) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const c = ctx && typeof ctx === 'object' ? ctx : { platform: 'pwa' };

  switch (stepId) {
    case 'region':
      return false;
    case 'healthConsent':
      return p.privacyRegion !== 'eea_uk' || p.healthDataConsent === true;
    case 'cookies':
      if (p.cookieConsent === true) return true;
      if (c.cookieConsentAccepted === true) return true;
      return false;
    case 'trackingProfile':
      return isTrackingProfileConfigured(p.trackingProfile);
    case 'tutorial':
      return false;
    case 'aiDownload':
      if (p.aiEnabled === false) return true;
      if (p.aiModelDownloadConsent === 'granted' || p.aiModelDownloadConsent === 'deferred') return true;
      return false;
    case 'install':
      if (c.platform !== 'pwa') return true;
      if (c.installModalSeen === true) return true;
      if (c.standalonePwa === true) return true;
      return false;
    default:
      return true;
  }
}
