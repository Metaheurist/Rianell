import { getPolicyPack } from '../privacy/resolvePolicyPack.mjs';
import { DEFAULT_LOCALE, DEFAULT_PRIVACY_REGION, isValidLocaleId } from './locales.mjs';

function regionConfig(regionId, pack) {
  const p = pack || getPolicyPack();
  const regions = p?.regions;
  if (!regions) return undefined;
  const id = regions[regionId] ? regionId : 'other';
  return regions[id];
}

export function getDefaultLocaleForRegion(regionId, pack) {
  const region = regionConfig(regionId || DEFAULT_PRIVACY_REGION, pack);
  const locale = region?.defaultLocale;
  return isValidLocaleId(locale) ? locale : DEFAULT_LOCALE;
}

export function getSupportedLocalesForRegion(regionId, pack) {
  const region = regionConfig(regionId || DEFAULT_PRIVACY_REGION, pack);
  const list = Array.isArray(region?.supportedLocales) ? region.supportedLocales : [DEFAULT_LOCALE];
  return list.filter(isValidLocaleId);
}

export function resolveActiveLocale(prefs, pack) {
  const explicit = prefs?.uiLocale;
  if (isValidLocaleId(explicit)) return explicit;
  const region = prefs?.privacyRegion;
  if (region) return getDefaultLocaleForRegion(region, pack);
  return DEFAULT_LOCALE;
}

export function applyRegionDefaultLocale(prefs, regionId, pack) {
  const next = { ...(prefs && typeof prefs === 'object' ? prefs : {}) };
  next.privacyRegion = regionId;
  if (!next.uiLocale || next.uiLocaleSource === 'onboarding' || next.uiLocaleSource === 'region') {
    next.uiLocale = getDefaultLocaleForRegion(regionId, pack);
    next.uiLocaleSource = 'region';
  }
  return next;
}
