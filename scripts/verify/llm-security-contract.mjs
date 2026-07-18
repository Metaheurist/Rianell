#!/usr/bin/env node
/**
 * LLM security contract: HF-only runtime, pinned CDN or self-hosted vendor, sync artifacts present.
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
const summaryLlmGguf = read('apps/pwa-webapp/summary-llm-gguf.js');
const summaryLlmMlc = read('apps/pwa-webapp/summary-llm-mlc.js');
const indexHtml = read('apps/pwa-webapp/index.html');
const loadLadderSync = read('apps/pwa-webapp/llm-load-ladder-sync.js');

if (summaryLlm.includes('getPreferredDevice')) {
  errors.push('summary-llm.js must not reference undefined getPreferredDevice');
}
if (!summaryLlm.includes('tryLoadWithPlans')) {
  errors.push('summary-llm.js missing GPU load ladder (tryLoadWithPlans)');
}
if (!summaryLlm.includes('warmupPipelineOrThrow')) {
  errors.push('summary-llm.js missing warmupPipelineOrThrow before finishDownloadProgress');
}
if (/device:\s*['"]webgl['"]/.test(summaryLlm)) {
  errors.push('summary-llm.js must not pass webgl to Transformers load ladder');
}
if (/device:\s*['"]webgl['"]/.test(loadLadderSync)) {
  errors.push('llm-load-ladder-sync.js must not include webgl attempts');
}
const hasCdnPin = summaryLlm.includes('@huggingface/transformers@3.3.2');
const hasVendorPath = summaryLlm.includes('vendor/transformers/transformers.min.js');
if (!hasCdnPin && !hasVendorPath) {
  errors.push('summary-llm.js must pin Transformers 3.3.2 (CDN fallback) or self-host vendor path');
}
if (/transformers@\d+\.\d+\.\d+/.test(summaryLlm) && !summaryLlm.includes('@3.3.2')) {
  errors.push('summary-llm.js Transformers.js CDN fallback version must be 3.3.2');
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
if (!existsSync(join(root, 'apps/pwa-webapp/llm-runtime-profiles-sync.js'))) {
  errors.push('missing apps/pwa-webapp/llm-runtime-profiles-sync.js — run npm run sync:llm-pwa');
}
if (!summaryLlmMlc.includes('Llama-3.2-1B-Instruct-q4f16_1-MLC')) {
  errors.push('summary-llm-mlc.js must allowlist single MLC model id');
}
if (!summaryLlmMlc.includes('@mlc-ai/web-llm@0.2.84')) {
  errors.push('summary-llm-mlc.js must pin @mlc-ai/web-llm@0.2.84');
}
if (!summaryLlmGguf.includes('RianellLlmGguf')) {
  errors.push('summary-llm-gguf.js must export RianellLlmGguf');
}
if (!summaryLlmGguf.includes('isAllowedGgufModel')) {
  errors.push('summary-llm-gguf.js must allowlist GGUF model ids');
}
if (!summaryLlmGguf.includes('getGgufPathStatus')) {
  errors.push('summary-llm-gguf.js must expose getGgufPathStatus');
}
if (!summaryLlm.includes('isLlmNetworkAllowed')) {
  errors.push('summary-llm.js must gate downloads with isLlmNetworkAllowed (local-only mode)');
}
if (!summaryLlm.includes('isPwaOnDeviceLlmOnly')) {
  errors.push('summary-llm.js must expose isPwaOnDeviceLlmOnly');
}
if (/api\.openai\.com|api\.anthropic\.com|openrouter\.ai/i.test(summaryLlm)) {
  errors.push('summary-llm.js must not reference commercial LLM API hosts');
}
if (!summaryLlm.includes("cachedActiveEngine === 'gguf'")) {
  errors.push('summary-llm.js must wire GGUF engine in runChatInference');
}
if (!summaryLlm.includes('generateHealthChatWithLLM')) {
  errors.push('summary-llm.js must export generateHealthChatWithLLM alias for health chat');
}

const aiChatPath = 'apps/pwa-webapp/modules/ai-chat.js';
if (!existsSync(join(root, aiChatPath))) {
  errors.push('missing apps/pwa-webapp/modules/ai-chat.js');
} else {
  const aiChat = read(aiChatPath);
  if (/localStorage|sessionStorage|indexedDB/i.test(aiChat)) {
    errors.push('ai-chat.js must not persist chat to storage (ephemeral only)');
  }
  if (!/wipeState|beforeunload/.test(aiChat)) {
    errors.push('ai-chat.js must clear state on close and beforeunload');
  }
  if (!/generateHealthChatWithLLM|generateWeekChatWithLLM/.test(aiChat)) {
    errors.push('ai-chat.js must call on-device generateHealthChatWithLLM');
  }
  if (!/buildChatContext/.test(aiChat)) {
    errors.push('ai-chat.js must assemble context via buildChatContext');
  }
  if (/api\.openai\.com|api\.anthropic\.com|openrouter\.ai/i.test(aiChat)) {
    errors.push('ai-chat.js must not reference commercial LLM API hosts');
  }
}

const chatContext = read('packages/shared/src/ai/chatContext.mjs');
if (!chatContext.includes('isScreeningField')) {
  errors.push('chatContext.mjs must exclude screening fields from prompts');
}
if (!chatContext.includes('MAX_HEALTH_CHAT_TURNS')) {
  errors.push('chatContext.mjs must define MAX_HEALTH_CHAT_TURNS');
}
if (!indexHtml.includes('llm-runtime-profiles-sync.js')) {
  errors.push('index.html must load llm-runtime-profiles-sync.js');
}

const vendorManifest = join(root, 'apps/pwa-webapp/vendor/transformers/vendor-manifest.json');
if (hasVendorPath && !existsSync(vendorManifest)) {
  errors.push('missing vendor manifest — run npm run vendor:transformers');
}

const csp = read('apps/pwa-webapp/index.html');
if (!/connect-src[^;]*huggingface\.co/i.test(csp)) {
  errors.push('index.html CSP connect-src must allow huggingface.co');
}
if (!/cdn\.jsdelivr\.net/i.test(csp)) {
  errors.push('index.html CSP must allow cdn.jsdelivr.net for Transformers.js CDN fallback');
}

if (errors.length) {
  console.error('llm-security-contract FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log('llm-security-contract OK');
process.exit(0);
