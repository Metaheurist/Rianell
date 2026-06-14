/** BCP-47 locale IDs shipped in i18n-packs/locale-packs/v1. */
export const SHIPPED_LOCALES = [
  'en-GB',
  'en-US',
  'en-AU',
  'pt-BR',
  'fr-FR',
  'de-DE',
  'es-ES',
  'it-IT',
  'pl-PL',
  'nl-NL',
  'pt-PT',
  'ar',
  'he',
  'ga',
];

export const DEFAULT_LOCALE = 'en-GB';
export const DEFAULT_PRIVACY_REGION = 'eea_uk';

export function isValidLocaleId(id) {
  if (typeof id !== 'string') return false;
  if (SHIPPED_LOCALES.includes(id)) return true;
  return id === 'ar' || id === 'he' || id === 'ga' || id.startsWith('ar-') || id.startsWith('he-') || id.startsWith('ga-');
}

/** Fallback chain: exact → language-only → en-GB */
export function localeFallbackChain(localeId) {
  const chain = [];
  if (localeId && typeof localeId === 'string') chain.push(localeId);
  const lang = localeId?.split('-')[0];
  if (lang && lang !== localeId) chain.push(lang);
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
  return chain;
}

export function localeLabel(localeId) {
  const labels = {
    'en-GB': 'English (UK)',
    'en-US': 'English (US)',
    'en-AU': 'English (Australia)',
    'pt-BR': 'Português (Brasil)',
    'fr-FR': 'Français',
    'de-DE': 'Deutsch',
    'es-ES': 'Español',
    'it-IT': 'Italiano',
    'pl-PL': 'Polski',
    'nl-NL': 'Nederlands',
    'pt-PT': 'Português (Portugal)',
    ar: 'العربية',
    he: 'עברית',
    ga: 'Gaeilge',
  };
  return labels[localeId] || localeId;
}
