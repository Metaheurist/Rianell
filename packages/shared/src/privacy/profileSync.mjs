import { getPolicyPack } from './resolvePolicyPack.mjs';

export function isPrivacyRegionConfigured(prefs) {
  const id = prefs?.privacyRegion;
  return typeof id === 'string' && id.length > 0 && getPolicyPack().regions?.[id] != null;
}

export function applyPrivacyProfileToLocal(prefs, profile) {
  const base = prefs && typeof prefs === 'object' ? { ...prefs } : {};
  if (!profile || typeof profile !== 'object') return base;
  if (typeof profile.privacy_region === 'string') base.privacyRegion = profile.privacy_region;
  if (typeof profile.privacy_region_source === 'string') base.privacyRegionSource = profile.privacy_region_source;
  if (profile.privacy_region_updated_at) base.privacyRegionUpdatedAt = profile.privacy_region_updated_at;
  if (typeof profile.ui_locale === 'string') base.uiLocale = profile.ui_locale;
  if (typeof profile.ui_locale_source === 'string') base.uiLocaleSource = profile.ui_locale_source;
  if (profile.ui_locale_updated_at) base.uiLocaleUpdatedAt = profile.ui_locale_updated_at;
  if (typeof profile.data_residency_code === 'string') base.dataResidencyCode = profile.data_residency_code;
  if (typeof profile.data_residency_project_url === 'string') base.dataResidencyProjectUrl = profile.data_residency_project_url;
  if (typeof profile.policy_acknowledged_version === 'string') base.policyAcknowledgedVersion = profile.policy_acknowledged_version;
  if (profile.policy_acknowledged_at) base.policyAcknowledgedAt = profile.policy_acknowledged_at;
  if (profile.consents && typeof profile.consents === 'object') {
    if (profile.consents.healthDataConsent === true) base.healthDataConsent = true;
    if (profile.consents.healthDataConsentAt) base.healthDataConsentAt = profile.consents.healthDataConsentAt;
    if (profile.consents.backup === false) base.backup = false;
    if (profile.consents.contributeAnonData === false) base.contributeAnonData = false;
  }
  return base;
}

export function privacyProfileFromLocal(prefs, userId) {
  return {
    user_id: userId,
    privacy_region: prefs.privacyRegion || 'other',
    privacy_region_source: prefs.privacyRegionSource || 'user',
    privacy_region_updated_at: prefs.privacyRegionUpdatedAt || new Date().toISOString(),
    ui_locale: prefs.uiLocale || 'en-GB',
    ui_locale_source: prefs.uiLocaleSource || 'user',
    ui_locale_updated_at: prefs.uiLocaleUpdatedAt || new Date().toISOString(),
    data_residency_code: 'default',
    data_residency_project_url: prefs.dataResidencyProjectUrl || '',
    policy_pack_id: 'v1.0.0',
    policy_acknowledged_at: prefs.policyAcknowledgedAt || null,
    policy_acknowledged_version: prefs.policyAcknowledgedVersion || null,
    consents: {
      healthDataConsent: prefs.healthDataConsent === true,
      healthDataConsentAt: prefs.healthDataConsentAt || null,
      backup: prefs.backup !== false,
      contributeAnonData: prefs.contributeAnonData === true,
      aiEnabled: prefs.aiEnabled !== false,
    },
    updated_at: new Date().toISOString(),
  };
}
