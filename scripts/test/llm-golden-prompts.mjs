#!/usr/bin/env node
/**
 * Golden prompt regression — per-locale × per-intent prompt pack audit (Plan 08 N9).
 */
import {
  GOLDEN_LLM_INTENTS,
  GOLDEN_LLM_LOCALES,
  runGoldenPromptAudit,
} from '../../packages/shared/src/ai/llmGoldenPrompts.mjs';
import { isLlmInferenceAllowed } from '../../packages/shared/src/ai/llmCapability.mjs';

const engines = (process.env.LLM_ENGINE || 'onnx,mlc,gguf').split(',').map((s) => s.trim()).filter(Boolean);

console.log('llm-golden-prompts: auditing', GOLDEN_LLM_INTENTS.length, 'intents ×', GOLDEN_LLM_LOCALES.length, 'locales');
const { errors, checked } = runGoldenPromptAudit();
if (errors.length) {
  console.error('llm-golden-prompts FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}
console.log('llm-golden-prompts: audited', checked, 'prompt pairs — OK');

const uiOnly = GOLDEN_LLM_LOCALES.filter((loc) => !isLlmInferenceAllowed(loc));
if (uiOnly.length) {
  console.log('llm-golden-prompts: ui-only locales blocked at inference:', uiOnly.join(', '));
}

console.log('llm-golden-prompts engine checklist:', engines.join(', '));
for (const engine of engines) {
  for (const intent of GOLDEN_LLM_INTENTS) {
    console.log(`[${engine}] ${intent.id}: prompt pack OK (live compare needs PROBE_URL + loaded model)`);
  }
}

if (process.env.LLM_GOLDEN_STRICT === '1' && !process.env.PROBE_URL) {
  console.error('LLM_GOLDEN_STRICT requires PROBE_URL');
  process.exit(1);
}

console.log('llm-golden-prompts OK');
