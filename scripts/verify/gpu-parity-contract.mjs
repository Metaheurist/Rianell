#!/usr/bin/env node
/**
 * Static contract: PWA + RN expose GPU LLM resilience symbols.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const errors = [];

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const summaryLlm = read('apps/pwa-webapp/summary-llm.js');
const llmNative = read('apps/rn-app/src/ai/llmNative.ts');

const requiredPwa = [
  'tryLoadWithPlans',
  'warmupPipelineOrThrow',
  'classifyGpuLoadError',
  'resolveWasmFallbackModelId',
  'activeEngine',
  'cachedActiveBackend',
  'GPU_PIPELINE_FAIL_KEY',
  'ensureMlcScriptsLoaded',
  'ensureGgufScriptsLoaded',
];

for (const sym of requiredPwa) {
  if (!summaryLlm.includes(sym)) {
    errors.push('summary-llm.js missing ' + sym);
  }
}

if (!read('apps/pwa-webapp/summary-llm-mlc.js').includes('RianellLlmMlc')) {
  errors.push('summary-llm-mlc.js must expose RianellLlmMlc');
}

if (!read('packages/llm/src/load-ladder.mjs').includes('buildPwaWebNnAttempts')) {
  errors.push('load-ladder.mjs missing buildPwaWebNnAttempts');
}

if (!llmNative.includes('buildRnLoadAttempts')) {
  errors.push('llmNative.ts must use buildRnLoadAttempts');
}

if (errors.length) {
  console.error('gpu-parity-contract FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log('gpu-parity-contract OK');
