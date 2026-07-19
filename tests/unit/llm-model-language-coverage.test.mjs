/**
 * @test packages/llm/src/modelLanguageSupport.mjs
 *
 * Contract: every on-device LLM the app is allowed to download must declare
 * support for all offered LLM-inference languages (locales whose prompt pack is
 * `llmCapability: "full"`). This is a static declared-capability check sourced
 * from official model cards - it never downloads or runs a model.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODEL_LANGUAGE_SUPPORT,
  requiredLlmLanguages,
  findLanguageCoverageGaps,
  downloadModelIds,
  LLM_MODEL_SMALL_ID,
  LLM_MODEL_BASE_ID,
  ALLOWED_MLC_MODEL_IDS,
  GGUF_BASE_MODEL_ID,
} from '../../packages/llm/src/index.mjs';
import { PROMPT_PACKS_V1 } from '../../packages/shared/src/i18n/promptPackData.mjs';

/** The full set of model ids the app may download, from the live allowlists. */
const shippedModelIds = Array.from(
  new Set([
    LLM_MODEL_SMALL_ID,
    LLM_MODEL_BASE_ID,
    ...ALLOWED_MLC_MODEL_IDS,
    GGUF_BASE_MODEL_ID,
  ])
);

test('offered LLM-inference languages are derived from full prompt packs', () => {
  const required = requiredLlmLanguages(PROMPT_PACKS_V1);
  assert.deepEqual(required, ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt']);
  // ui-only locales (ar/he/ga) are blocked at inference, so not required.
  for (const uiOnly of ['ar', 'he', 'ga']) {
    assert.ok(!required.includes(uiOnly), `${uiOnly} is ui-only and must not be required`);
  }
});

test('every shipped download model has a language-support registry entry', () => {
  for (const id of shippedModelIds) {
    assert.ok(
      Array.isArray(MODEL_LANGUAGE_SUPPORT[id]) && MODEL_LANGUAGE_SUPPORT[id].length > 0,
      `MODEL_LANGUAGE_SUPPORT is missing an entry for shipped model "${id}"`
    );
  }
  // Registry must not list stale ids that are no longer shipped.
  for (const id of downloadModelIds()) {
    assert.ok(
      shippedModelIds.includes(id),
      `MODEL_LANGUAGE_SUPPORT lists "${id}" which is not in any allowlist`
    );
  }
});

test('every shipped download model covers all offered languages', () => {
  const requiredLanguages = requiredLlmLanguages(PROMPT_PACKS_V1);
  const gaps = findLanguageCoverageGaps({ modelIds: shippedModelIds, requiredLanguages });
  assert.deepEqual(
    gaps,
    {},
    `Language coverage gaps found (model -> missing languages): ${JSON.stringify(gaps)}`
  );
});
