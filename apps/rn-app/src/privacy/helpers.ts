import {
  applyPrivacyProfileToLocal,
  applyRegionDowngradeToggles,
  getFeatureAvailability,
  getPolicyDocumentsForRegion,
  getPolicyPack,
  getRegionLabels,
  isPrivacyRegionConfigured,
  prefsToConsents,
  privacyProfileFromLocal,
  suggestPrivacyRegionFromHint,
} from '@rianell/shared';
import type { Preferences } from '../storage/preferences';

export {
  applyPrivacyProfileToLocal,
  applyRegionDowngradeToggles,
  getFeatureAvailability,
  getPolicyDocumentsForRegion,
  getPolicyPack,
  getRegionLabels,
  isPrivacyRegionConfigured,
  prefsToConsents,
  privacyProfileFromLocal,
  suggestPrivacyRegionFromHint,
};

export function suggestRegionForDevice(): string {
  let locale = 'en';
  let tz = 'UTC';
  try {
    locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    /* ignore */
  }
  return suggestPrivacyRegionFromHint(locale, tz);
}

export function checkFeatureForPrefs(prefs: Preferences, featureKey: string) {
  return getFeatureAvailability(prefs.privacyRegion || 'other', featureKey, prefsToConsents(prefs));
}
