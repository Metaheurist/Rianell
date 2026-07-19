/**
 * Declared natural-language support for every on-device LLM the app downloads.
 *
 * This is a static capability contract, NOT a runtime generation-quality test:
 * each model id maps to the natural languages its publisher documents as
 * supported. A CI test (tests/unit/llm-model-language-coverage.test.mjs) asserts
 * that every shipped download model covers all offered LLM-inference languages
 * (the locales whose prompt pack is `llmCapability: "full"`).
 *
 * Sources (verified externally):
 * - Qwen2.5 family: official Qwen2 language table at
 *   https://qwenlm.github.io/blog/qwen2 (27 additional languages besides English
 *   and Chinese), inherited by Qwen2.5 per https://qwenlm.github.io/blog/qwen2.5
 *   ("multilingual support for over 29 languages"). Western Europe row includes
 *   Dutch; Eastern & Central Europe row includes Polish.
 * - HF model cards confirm the base repos: onnx-community/Qwen2.5-*-Instruct,
 *   mlc-ai/Qwen2.5-*-Instruct-q4f16_1-MLC, bartowski/Qwen2.5-1.5B-Instruct-GGUF.
 */

/**
 * Documented Qwen2.5 language set as BCP-47 primary subtags (29 languages).
 * All shipped Qwen2.5 variants (ONNX / MLC / GGUF) share the same base training,
 * so they declare the same set.
 */
export const QWEN25_LANGUAGES = Object.freeze([
  'zh', 'en', 'de', 'fr', 'es', 'pt', 'it', 'nl', // Chinese, English, Western Europe
  'ru', 'cs', 'pl', // Eastern & Central Europe
  'ar', 'fa', 'he', 'tr', // Middle East
  'ja', 'ko', // Eastern Asia
  'vi', 'th', 'id', 'ms', 'lo', 'my', 'ceb', 'km', 'tl', // South-Eastern Asia
  'hi', 'bn', 'ur', // Southern Asia
]);

/**
 * model id -> declared supported language subtags. Keys are exactly the ids the
 * app is allowed to download across ONNX (Transformers.js), MLC (WebLLM) and GGUF.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const MODEL_LANGUAGE_SUPPORT = Object.freeze({
  // ONNX (Transformers.js) - self-hosted mirror / HF Hub
  'onnx-community/Qwen2.5-0.5B-Instruct': QWEN25_LANGUAGES,
  'onnx-community/Qwen2.5-1.5B-Instruct': QWEN25_LANGUAGES,
  // MLC (WebLLM / WebGPU)
  'Qwen2.5-0.5B-Instruct-q4f16_1-MLC': QWEN25_LANGUAGES,
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC': QWEN25_LANGUAGES,
  // GGUF (Path 3 spike)
  'bartowski/Qwen2.5-1.5B-Instruct-GGUF': QWEN25_LANGUAGES,
});

/** All model ids the app may download (the registry is the source of truth). */
export function downloadModelIds() {
  return Object.keys(MODEL_LANGUAGE_SUPPORT);
}

/** Reduce a BCP-47 locale id to its lowercase primary language subtag. */
export function languageSubtag(localeId) {
  return String(localeId || '').split('-')[0].toLowerCase();
}

/**
 * Offered LLM-inference languages: the primary subtags of every prompt pack whose
 * `llmCapability` is not `ui-only`. `ui-only` locales (e.g. ar/he/ga) are blocked
 * at inference, so they are not required. Reading capability from the packs means
 * flipping a locale to `full` later automatically extends the required set.
 *
 * @param {Record<string, { locale?: string, llmCapability?: string }>} promptPacks
 * @returns {string[]} sorted unique language subtags
 */
export function requiredLlmLanguages(promptPacks) {
  const packs = promptPacks || {};
  const langs = new Set();
  for (const key of Object.keys(packs)) {
    const pack = packs[key] || {};
    if (pack.llmCapability === 'ui-only') continue;
    langs.add(languageSubtag(pack.locale || key));
  }
  return Array.from(langs).sort();
}

/**
 * For each model id, the required languages it does NOT declare support for.
 * An unregistered model id reports every required language as missing.
 *
 * @param {{ modelIds: string[], requiredLanguages: string[], registry?: Record<string, readonly string[]> }} options
 * @returns {Record<string, string[]>} model id -> missing languages (only non-empty entries)
 */
export function findLanguageCoverageGaps(options) {
  const {
    modelIds = [],
    requiredLanguages = [],
    registry = MODEL_LANGUAGE_SUPPORT,
  } = options || {};
  const gaps = {};
  for (const id of modelIds) {
    const supported = registry[id];
    if (!Array.isArray(supported)) {
      gaps[id] = [...requiredLanguages];
      continue;
    }
    const supportedSet = new Set(supported.map((l) => String(l).toLowerCase()));
    const missing = requiredLanguages.filter((l) => !supportedSet.has(String(l).toLowerCase()));
    if (missing.length) gaps[id] = missing;
  }
  return gaps;
}
