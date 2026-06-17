#!/usr/bin/env node
/**
 * LLM security contract: HF-only runtime, pinned CDN, sync artifacts present.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const errors = [];

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const summaryLlm = read('apps/pwa-webapp/summary-llm.js');
const indexHtml = read('apps/pwa-webapp/index.html');

if (summaryLlm.includes('getPreferredDevice')) {
  errors.push('summary-llm.js must not reference undefined getPreferredDevice');
}
if (!summaryLlm.includes('tryLoadWithPlans')) {
  errors.push('summary-llm.js missing GPU load ladder (tryLoadWithPlans)');
}
if (!summaryLlm.includes('warmupPipelineOrThrow')) {
  errors.push('summary-llm.js missing warmupPipelineOrThrow before finishDownloadProgress');
}
if (!summaryLlm.includes('@huggingface/transformers@3.3.2')) {
  errors.push('summary-llm.js must pin @huggingface/transformers@3.3.2');
}
if (/transformers@\d+\.\d+\.\d+/.test(summaryLlm) && !summaryLlm.includes('@3.3.2')) {
  errors.push('summary-llm.js Transformers.js version must be 3.3.2');
}
if (summaryLlm.includes('supabase') && summaryLlm.includes('remoteHost')) {
  errors.push('summary-llm.js must not set Supabase as model remoteHost');
}
if (!indexHtml.includes('llm-load-ladder-sync.js')) {
  errors.push('index.html must load llm-load-ladder-sync.js');
}
if (!existsSync(join(root, 'apps/pwa-webapp/llm-load-ladder-sync.js'))) {
  errors.push('missing apps/pwa-webapp/llm-load-ladder-sync.js — run npm run sync:llm-pwa');
}
if (!existsSync(join(root, 'apps/pwa-webapp/llm-tier-benchmark-sync.js'))) {
  errors.push('missing apps/pwa-webapp/llm-tier-benchmark-sync.js — run npm run sync:llm-pwa');
}

const llmNative = read('apps/rn-app/src/ai/llmNative.ts');
if (!llmNative.includes('buildRnLoadAttempts')) {
  errors.push('llmNative.ts must use buildRnLoadAttempts');
}
if (!llmNative.includes('externalData')) {
  errors.push('llmNative.ts must pass externalData to ORT init');
}

const csp = read('apps/pwa-webapp/index.html');
if (!/connect-src[^;]*huggingface\.co/i.test(csp)) {
  errors.push('index.html CSP connect-src must allow huggingface.co');
}
if (!/cdn\.jsdelivr\.net/i.test(csp)) {
  errors.push('index.html CSP must allow cdn.jsdelivr.net for Transformers.js');
}

if (errors.length) {
  console.error('llm-security-contract FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log('llm-security-contract OK');
process.exit(0);
