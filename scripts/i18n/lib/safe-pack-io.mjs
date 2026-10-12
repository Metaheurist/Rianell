/**
 * File and payload helpers shared by the i18n machine-translation scripts:
 * race-free JSON reads, locale-id path confinement, and validation of
 * translated strings before they are written into packs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { HTML_RE, placeholderMultiset } from './ollama-translate.mjs';

const LOCALE_ID_RE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const MAX_TRANSLATION_LENGTH = 20000;

export function isLocaleId(value) {
  return typeof value === 'string' && LOCALE_ID_RE.test(value);
}

/** Resolve `<dir>/<locale>.json`, rejecting ids that are not BCP-47-like or would leave `dir`. */
export function localeJsonPath(dir, locale) {
  if (!isLocaleId(locale)) throw new Error(`invalid locale id: ${JSON.stringify(locale)}`);
  const base = path.resolve(dir);
  const filePath = path.resolve(base, `${locale}.json`);
  if (path.dirname(filePath) !== base) throw new Error(`locale path escapes ${base}: ${locale}`);
  return filePath;
}

/** Parse a JSON file, returning `fallback` when it does not exist. */
export function readJsonIfExists(filePath, fallback = null) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err?.code === 'ENOENT') return fallback;
    throw err;
  }
  return JSON.parse(raw);
}

export function writeJson(filePath, obj, options = {}) {
  fs.writeFileSync(filePath, `${JSON.stringify(obj, null, 2)}\n`, { encoding: 'utf8', ...options });
}

/**
 * Accept a machine translation of `src` only when it is a bounded, non-empty
 * string with the same {placeholders}, no control characters, and no HTML
 * unless the source had HTML. Returns the trimmed value or null.
 */
export function sanitizeTranslation(src, candidate) {
  if (typeof candidate !== 'string') return null;
  const value = candidate.trim();
  if (!value || value.length > MAX_TRANSLATION_LENGTH) return null;
  if (CONTROL_CHAR_RE.test(value)) return null;
  const source = String(src ?? '');
  if (HTML_RE.test(value) && !HTML_RE.test(source)) return null;
  if (placeholderMultiset(value) !== placeholderMultiset(source)) return null;
  return value;
}
