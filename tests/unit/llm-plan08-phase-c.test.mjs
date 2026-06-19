import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRemoteLlmEndpoint,
  isPwaOnDeviceLlmOnly,
  BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS,
} from '../../packages/shared/src/ai/llmOnDevicePolicy.mjs';
import {
  GOLDEN_LLM_INTENTS,
  GOLDEN_LLM_LOCALES,
  runGoldenPromptAudit,
  auditGoldenPrompt,
} from '../../packages/shared/src/ai/llmGoldenPrompts.mjs';
import { isAllowedGgufModelId, GGUF_LLAMA_MODEL_ID } from '../../packages/llm/src/gguf-config.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('validateRemoteLlmEndpoint blocks commercial APIs', () => {
  assert.equal(validateRemoteLlmEndpoint('').allowed, true);
  assert.equal(validateRemoteLlmEndpoint('https://api.openai.com/v1/chat/completions').allowed, false);
  assert.equal(validateRemoteLlmEndpoint('https://api.anthropic.com/v1/messages').allowed, false);
  assert.equal(validateRemoteLlmEndpoint('http://127.0.0.1:8787/llm').allowed, true);
});

test('isPwaOnDeviceLlmOnly is always true', () => {
  assert.equal(isPwaOnDeviceLlmOnly(), true);
});

test('golden prompt audit passes for all shipped locales and intents', () => {
  assert.equal(GOLDEN_LLM_INTENTS.length, 9);
  assert.ok(GOLDEN_LLM_LOCALES.length >= 14);
  const { errors, checked } = runGoldenPromptAudit();
  assert.equal(errors.length, 0, errors.join('; '));
  assert.equal(checked, GOLDEN_LLM_INTENTS.length * GOLDEN_LLM_LOCALES.length);
});

test('auditGoldenPrompt rejects empty system prompt', () => {
  const errs = auditGoldenPrompt('summary', '', 'Data: 1');
  assert.ok(errs.length > 0);
});

test('gguf allowlist matches Path 3 model id', () => {
  assert.equal(isAllowedGgufModelId(GGUF_LLAMA_MODEL_ID), true);
  assert.equal(isAllowedGgufModelId('evil/model'), false);
});

test('summary-llm-gguf exports allowlist adapter API', () => {
  const src = readFileSync(join(root, 'apps/pwa-webapp/summary-llm-gguf.js'), 'utf8');
  assert.ok(src.includes('RianellLlmGguf'));
  assert.ok(src.includes('isAllowedGgufModel'));
  assert.ok(src.includes('getGgufPathStatus'));
  assert.ok(src.includes('runGgufChat'));
});

test('summary-llm blocks commercial LLM hosts and respects local-only mode', () => {
  const src = readFileSync(join(root, 'apps/pwa-webapp/summary-llm.js'), 'utf8');
  assert.ok(src.includes('isLlmNetworkAllowed'));
  assert.ok(src.includes('localOnlyMode'));
  assert.ok(!src.includes('api.openai.com'));
  assert.ok(src.includes('cachedActiveEngine === \'gguf\''));
  assert.ok(src.includes('isPwaOnDeviceLlmOnly'));
  for (const re of BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS) {
    assert.ok(!re.test(src), `summary-llm must not reference ${re}`);
  }
});
