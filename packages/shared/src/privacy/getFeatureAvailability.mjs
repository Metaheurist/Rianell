import { resolvePolicyPack } from './resolvePolicyPack.mjs';

function consentOk(consents, key) {
  if (!key) return true;
  const c = consents && typeof consents === 'object' ? consents : {};
  if (key === 'healthData') return c.healthData === true || c.healthDataConsent === true;
  if (key === 'cloudSync') return c.cloudSync === true || c.backup === true;
  if (key === 'anonContribution') return c.anonContribution === true || c.contributeAnonData === true;
  if (key === 'aiModel') return c.aiModel === true || c.aiEnabled === true || c.aiModelDownloadConsent === 'granted';
  if (key === 'sessionRecording') return c.sessionRecording === true;
  return c[key] === true;
}

export function getFeatureAvailability(regionId, featureKey, consents, pack) {
  const resolved = resolvePolicyPack(regionId, pack);
  const feat = resolved.features?.[featureKey];
  if (!feat || feat.enabled === false) {
    return { available: false, reason: 'disabled_for_region', regionId: resolved.regionId };
  }
  const required = Array.isArray(feat.requiredConsents) ? feat.requiredConsents : [];
  for (const key of required) {
    if (!consentOk(consents, key)) {
      return { available: false, reason: 'missing_consent', missing: key, regionId: resolved.regionId };
    }
  }
  return { available: true, regionId: resolved.regionId };
}

export function applyRegionDowngradeToggles(prefs, oldRegionId, newRegionId, pack) {
  const next = { ...prefs };
  const consents = prefsToConsents(next);
  const checks = [
    ['backup', 'cloudEncryptedBackup'],
    ['contributeAnonData', 'anonymizedResearchPool'],
    ['useOpenData', 'openDataPoolForAi'],
    ['aiEnabled', 'onDeviceLlmDownload'],
    ['sessionRecording', 'sessionRecording'],
  ];
  for (const [field, featureKey] of checks) {
    const avail = getFeatureAvailability(newRegionId, featureKey, consents, pack);
    if (!avail.available && next[field]) next[field] = false;
  }
  return next;
}

export function prefsToConsents(prefs) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  return {
    healthData: p.healthDataConsent === true,
    healthDataConsent: p.healthDataConsent === true,
    cloudSync: p.backup === true,
    backup: p.backup === true,
    anonContribution: p.contributeAnonData === true,
    contributeAnonData: p.contributeAnonData === true,
    aiModel: p.aiEnabled !== false && (p.aiModelDownloadConsent === 'granted' || p.aiEnabled === true),
    aiEnabled: p.aiEnabled !== false,
    aiModelDownloadConsent: p.aiModelDownloadConsent,
    sessionRecording: p.sessionRecording === true,
  };
}
