/**
 * Optional machine translation for maintainer scripts (LC-16).
 * Set DEEPL_AUTH_KEY or GOOGLE_TRANSLATE_API_KEY in the environment.
 */
import { protectGlossary, restoreGlossary } from './i18n-glossary.mjs';

const LOCALE_TO_DEEPL = {
  'pt-BR': 'PT-BR',
  'pt-PT': 'PT-PT',
  'fr-FR': 'FR',
  'de-DE': 'DE',
  'es-ES': 'ES',
  'it-IT': 'IT',
  'nl-NL': 'NL',
  'pl-PL': 'PL',
  ar: 'AR',
  he: 'HE',
  'en-US': 'EN-US',
  'en-AU': 'EN-GB',
};

export function hasTranslateCredentials() {
  return !!(process.env.DEEPL_AUTH_KEY || process.env.GOOGLE_TRANSLATE_API_KEY);
}

export async function translateText(text, targetLocale) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return trimmed;
  if (targetLocale === 'en-GB' || targetLocale === 'en-US' || targetLocale === 'en-AU') {
    return trimmed;
  }

  const { text: protectedText, placeholders } = protectGlossary(trimmed);

  if (process.env.DEEPL_AUTH_KEY) {
    const target = LOCALE_TO_DEEPL[targetLocale] || targetLocale.split('-')[0].toUpperCase();
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_AUTH_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: protectedText,
        source_lang: 'EN',
        target_lang: target,
      }),
    });
    if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
    const data = await res.json();
    const translated = data?.translations?.[0]?.text;
    if (typeof translated !== 'string') throw new Error('DeepL empty response');
    return restoreGlossary(translated, placeholders);
  }

  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    const target = targetLocale.replace('_', '-');
    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.set('key', process.env.GOOGLE_TRANSLATE_API_KEY);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: protectedText, source: 'en', target, format: 'text' }),
    });
    if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
    const data = await res.json();
    const translated = data?.data?.translations?.[0]?.translatedText;
    if (typeof translated !== 'string') throw new Error('Google Translate empty response');
    return restoreGlossary(translated, placeholders);
  }

  return trimmed;
}

export async function translateBatch(strings, targetLocale, { delayMs = 120 } = {}) {
  const out = [];
  for (const s of strings) {
    out.push(await translateText(s, targetLocale));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}
