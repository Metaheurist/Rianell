export const PRIVACY_REGIONS = ['eea_uk', 'us_ca', 'us_other', 'au', 'br', 'other'];

export const UNSET_PRIVACY_REGION = '';

export function isValidPrivacyRegion(id) {
  return typeof id === 'string' && PRIVACY_REGIONS.includes(id);
}

export function getRegionLabels(pack) {
  const regions = pack?.regions ?? {};
  return PRIVACY_REGIONS.map((id) => ({
    id,
    label: regions[id]?.label ?? id,
  }));
}

/** Suggest region from locale/timezone — hint only, never auto-applied. */
export function suggestPrivacyRegionFromHint(locale, timeZone) {
  const loc = (locale || '').toLowerCase();
  const tz = (timeZone || '').toLowerCase();
  if (/^(en-gb|cy-gb|ga-gb)/.test(loc) || /europe\/london|europe\/dublin/.test(tz)) return 'eea_uk';
  if (loc.startsWith('en-us') || loc.startsWith('es-us')) {
    if (/california|los_angeles|america\/los_angeles/.test(tz)) return 'us_ca';
    return 'us_other';
  }
  if (loc.startsWith('pt-br') || loc.startsWith('pt_br')) return 'br';
  if (loc.startsWith('en-au') || /australia/.test(tz)) return 'au';
  if (/^([a-z]{2}-)?(at|be|bg|hr|cy|cz|dk|ee|fi|fr|de|gr|hu|ie|it|lv|lt|lu|mt|nl|pl|pt|ro|sk|si|es|se|is|li|no|ch|gb)/.test(loc)) {
    return 'eea_uk';
  }
  if (/^europe\//.test(tz)) return 'eea_uk';
  if (/^america\//.test(tz)) return 'us_other';
  return 'other';
}
