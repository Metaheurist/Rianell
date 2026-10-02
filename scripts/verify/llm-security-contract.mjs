#!/usr/bin/env node
/**
 * LLM security contract: HF-only runtime, pinned CDN or self-hosted vendor, revision-pinned
 * packages, single worker engine.
 */
import { createHash } from 'node:crypto';
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
  errors.push('summary-llm.js missing GPU load attempt (tryLoadWithPlans)');
}
if (!summaryLlm.includes('warmupPipelineOrThrow')) {
  errors.push('summary-llm.js missing warmupPipelineOrThrow before finishDownloadProgress');
}
if (/device:\s*['"]webgl['"]/.test(summaryLlm)) {
  errors.push('summary-llm.js must not load models on webgl');
}

// One engine: transformers.js in workers/llm-worker.js. The WebLLM (MLC) and GGUF engines
// pulled unpinned CDN code and weights from outside the revision-pinned Hub path.
const REMOVED_ENGINE_FILES = [
  'apps/pwa-webapp/summary-llm-mlc.js',
  'apps/pwa-webapp/llm-mlc-worker.js',
  'apps/pwa-webapp/summary-llm-gguf.js',
  'apps/pwa-webapp/llm-load-ladder-sync.js',
  'apps/pwa-webapp/llm-runtime-profiles-sync.js',
];
for (const rel of REMOVED_ENGINE_FILES) {
  if (existsSync(join(root, rel))) errors.push(`${rel} must stay removed (single transformers.js worker engine)`);
  const base = rel.split('/').pop();
  if (indexHtml.includes(base)) errors.push(`index.html must not load ${base}`);
}
if (/web-llm|RianellLlmMlc|RianellLlmGguf|wllama/i.test(summaryLlm)) {
  errors.push('summary-llm.js must not reference the removed MLC / GGUF engines');
}
if (!summaryLlm.includes('enable_thinking: false')) {
  errors.push('summary-llm.js must disable reasoning (enable_thinking: false) for Qwen3.5 packages');
}
const TRANSFORMERS_PIN = '4.3.0';
const hasCdnPin = summaryLlm.includes(`@huggingface/transformers@${TRANSFORMERS_PIN}`);
const hasVendorPath = summaryLlm.includes('vendor/transformers/transformers.min.js');
if (!hasCdnPin && !hasVendorPath) {
  errors.push(`summary-llm.js must pin Transformers ${TRANSFORMERS_PIN} (CDN fallback) or self-host vendor path`);
}
if (/transformers@\d+\.\d+\.\d+/.test(summaryLlm) && !hasCdnPin) {
  errors.push(`summary-llm.js Transformers.js CDN fallback version must be ${TRANSFORMERS_PIN}`);
}

// transformers.js runs in a module worker; model loads are pinned to Hub commits.
const workerPath = 'apps/pwa-webapp/workers/llm-worker.js';
const workerClientPath = 'apps/pwa-webapp/modules/llm-worker-client.js';
if (!existsSync(join(root, workerPath)) || !existsSync(join(root, workerClientPath))) {
  errors.push('missing workers/llm-worker.js or modules/llm-worker-client.js');
} else {
  const worker = read(workerPath);
  if (!worker.includes('COMMIT_SHA_RE') || !/\[0-9a-f\]\{40\}/.test(worker)) {
    errors.push('llm-worker.js must reject model revisions that are not 40-char commit SHAs');
  }
  if (!worker.includes("ALLOWED_REMOTE_HOST = 'https://huggingface.co/'")) {
    errors.push('llm-worker.js must only fetch models from https://huggingface.co/');
  }
  if (!worker.includes('isAllowedRuntimeUrl')) {
    errors.push('llm-worker.js must allowlist the transformers runtime URL (same origin or pinned CDN)');
  }
  if (!/pinModelRevision\(mod, config\.modelId, config\.revision\)/.test(worker)) {
    errors.push('llm-worker.js must rewrite resolve/main model requests to the pinned revision (pipeline() drops revision)');
  }
  if (/console\.(log|info|debug)\(/.test(worker)) {
    errors.push('llm-worker.js must not log (prompts and replies stay in memory)');
  }
}
if (!summaryLlm.includes("'workers/llm-worker.js'")) {
  errors.push('summary-llm.js must load transformers.js through workers/llm-worker.js');
}
if (/import\(\s*url\s*\)|\.pipeline\(\s*'text-generation'/.test(summaryLlm)) {
  errors.push('summary-llm.js must not import transformers.js or build pipelines on the main thread');
}
if (/revision:\s*['"]main['"]/.test(summaryLlm)) {
  errors.push("summary-llm.js must not load models from revision 'main'");
}
const packagesBlock = summaryLlm.slice(summaryLlm.indexOf('var LLM_PACKAGES = {'), summaryLlm.indexOf('var MODEL_SMALL ='));
const packagePins = [...packagesBlock.matchAll(/id:\s*'([^']+)',\s*revision:\s*'([^']*)'/g)];
if (packagePins.length < 3) {
  errors.push('summary-llm.js LLM_PACKAGES must declare id + revision for the small, large and wasm packages');
}
for (const [, model, sha] of packagePins) {
  if (!/^[0-9a-f]{40}$/.test(sha)) errors.push(`LLM_PACKAGES ${model} revision must be a 40-char commit SHA`);
}
if (summaryLlm.includes('supabase') && summaryLlm.includes('remoteHost')) {
  errors.push('summary-llm.js must not set Supabase as model remoteHost');
}
if (!existsSync(join(root, 'apps/pwa-webapp/llm-tier-benchmark-sync.js'))) {
  errors.push('missing apps/pwa-webapp/llm-tier-benchmark-sync.js — run npm run sync:llm-pwa');
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
const vendorDir = join(root, 'apps/pwa-webapp/vendor/transformers');
const vendorManifest = join(vendorDir, 'vendor-manifest.json');
if (hasVendorPath && !existsSync(vendorManifest)) {
  errors.push('missing vendor manifest — run npm run vendor:transformers');
} else if (hasVendorPath) {
  const manifest = JSON.parse(readFileSync(vendorManifest, 'utf8'));
  if (manifest.version !== TRANSFORMERS_PIN) {
    errors.push(`vendor manifest is transformers@${manifest.version}; expected ${TRANSFORMERS_PIN}`);
  }
  for (const [name, meta] of Object.entries(manifest.files || {})) {
    const file = join(vendorDir, name);
    if (!existsSync(file)) {
      errors.push(`vendor/transformers/${name} listed in manifest but missing`);
      continue;
    }
    const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (sha !== meta.sha256) errors.push(`vendor/transformers/${name} sha256 does not match vendor-manifest.json`);
  }
}

// Ask Rianell chat guardrails: deterministic health-scope + NSFW enforcement.
const guardrailsPath = 'packages/shared/src/ai/chatGuardrails.mjs';
if (!existsSync(join(root, guardrailsPath))) {
  errors.push('missing packages/shared/src/ai/chatGuardrails.mjs (health-scope + NSFW gate)');
} else {
  const guardrails = read(guardrailsPath);
  for (const symbol of ['classifyHealthChatMessage', 'isNsfwText', 'enforceHealthChatReply', 'NSFW_RE']) {
    if (!guardrails.includes(symbol)) {
      errors.push(`chatGuardrails.mjs must export ${symbol}`);
    }
  }
}
const sharedI18nIndex = read('packages/shared/src/i18n/index.mjs');
if (!sharedI18nIndex.includes("../ai/chatGuardrails.mjs")) {
  errors.push('i18n/index.mjs must re-export ../ai/chatGuardrails.mjs so guardrails reach window.RianellShared');
}
if (existsSync(join(root, aiChatPath))) {
  const aiChatSrc = read(aiChatPath);
  if (!aiChatSrc.includes('classifyHealthChatMessage')) {
    errors.push('ai-chat.js must gate input with classifyHealthChatMessage (health-scope + NSFW)');
  }
  if (!aiChatSrc.includes('isNsfwText')) {
    errors.push('ai-chat.js must gate model output with isNsfwText');
  }
}
if (!summaryLlm.includes('enforceHealthChatReply')) {
  errors.push('summary-llm.js must enforce NSFW output via enforceHealthChatReply (defense-in-depth)');
}
const localePack = JSON.parse(read('i18n-packs/locale-packs/v1/en-GB.json'));
const localeStrings = (localePack && localePack.strings) || {};
for (const key of ['ai.chat.blockedOffTopic', 'ai.chat.blockedUnsafe']) {
  if (!localeStrings[key]) {
    errors.push(`en-GB locale pack missing canned guardrail message ${key}`);
  }
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
