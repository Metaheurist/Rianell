import { localeFallbackChain, DEFAULT_LOCALE } from './locales.mjs';

function getNested(obj, key) {
  if (!obj || !key) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(template, params) {
  if (!params || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = params[name];
    return v != null ? String(v) : `{${name}}`;
  });
}

/** Translate key against catalog map { localeId: { strings: { key: value } } } */
export function t(key, localeId, catalogs, params) {
  const chain = localeFallbackChain(localeId || DEFAULT_LOCALE);
  for (const loc of chain) {
    const cat = catalogs?.[loc];
    const strings = cat?.strings ?? cat;
    const val = getNested(strings, key);
    if (typeof val === 'string') return interpolate(val, params);
  }
  return key;
}

export function createTranslator(catalogs, localeId) {
  return (key, params) => t(key, localeId, catalogs, params);
}
