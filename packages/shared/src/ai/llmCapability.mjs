import { loadPromptPack } from '../i18n/promptPack.mjs';
import { isValidLocaleId, DEFAULT_LOCALE } from '../i18n/locales.mjs';

/** @returns {'full' | 'ui-only'} */
export function getLlmCapability(locale, options = {}) {
  const loc = isValidLocaleId(locale) ? locale : DEFAULT_LOCALE;
  const pack = loadPromptPack(loc, options.packs);
  return pack?.llmCapability === 'ui-only' ? 'ui-only' : 'full';
}

export function isLlmInferenceAllowed(locale, options = {}) {
  return getLlmCapability(locale, options) !== 'ui-only';
}
