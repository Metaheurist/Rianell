import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const summaryLlm = fs.readFileSync(
  new URL('../../../apps/pwa-webapp/summary-llm.js', import.meta.url),
  'utf8',
);
const aiChat = fs.readFileSync(
  new URL('../../../apps/pwa-webapp/modules/ai-chat.js', import.meta.url),
  'utf8',
);
const promptPack = JSON.parse(
  fs.readFileSync(
    new URL('../../../apps/pwa-webapp/i18n-packs/prompt-packs/v1/en-GB.json', import.meta.url),
    'utf8',
  ),
);

test('first-run load budget covers the large package download and shader compile', () => {
  assert.match(summaryLlm, /var LOAD_TIMEOUT_MS = 240000/);
  // Preparing watchdog is silence-based, so compile progress keeps re-arming it.
  assert.match(summaryLlm, /var FINALIZE_TIMEOUT_MS = 90000/);
  assert.match(summaryLlm, /if \(finalizing\) \{\s*\/\/[^\n]*\n[^\n]*\n\s*clearFinalizeWatchdog\(\);/);
});

test('buildSummaryContext emits a deterministic HEADLINE and ACTION chosen by AIEngine', () => {
  assert.match(summaryLlm, /parts\.push\('HEADLINE: ' \+ headline\)/);
  assert.match(summaryLlm, /parts\.push\('ACTION: ' \+ action\)/);
  // Headline is picked from the pre-computed insights/summary, not inferred by the model.
  assert.match(summaryLlm, /headline = stripMarkdown\(analysis\.prioritisedInsights\[0\]\)/);
  assert.match(summaryLlm, /action = stripMarkdown\(analysis\.advice\[0\]\)/);
});

test('summary prompt pack instructs the model to rephrase provided facts only', () => {
  assert.match(promptPack.strings['summary.system'], /rephrase only the facts provided/i);
  assert.match(promptPack.strings['summary.system'], /HEADLINE/);
  assert.match(promptPack.strings['summary.system'], /ACTION/);
  assert.match(promptPack.strings['summary.system.plain'], /rephrase only the facts provided/i);
  assert.match(promptPack.strings['healthChat.system'], /rephrase only the facts given/i);
  // Wellness guardrail preserved (audited by golden prompt tests).
  assert.match(promptPack.strings['summary.system'], /No medical disclaimers|Reply with only/i);
});

test('runChatInference loads first, then calls the worker-backed pipeline', () => {
  const src = summaryLlm.slice(
    summaryLlm.indexOf('async function runChatInference'),
    summaryLlm.indexOf('function isPipelineReadyForChat'),
  );
  const loadIdx = src.indexOf('await ensurePipelineLoaded');
  const dispatchIdx = src.indexOf('return runLoadedEngineChat(');
  assert.ok(loadIdx > 0 && dispatchIdx > loadIdx, 'load must precede inference');
  assert.match(src, /typeof pipe !== 'function'/, 'guards against inference before a pipeline exists');
  assert.match(src, /withModelGenerationOptions\(genOpts\)/, 'per-model generation options are applied');
});

test('model is pinned per session (after WebGPU is known) to avoid mid-load re-download', () => {
  assert.match(summaryLlm, /var sessionModelId = null/);
  assert.match(summaryLlm, /return sessionModelId \|\| computeResolvedModelId\(\)/);
  const src = summaryLlm.slice(
    summaryLlm.indexOf('async function ensurePipelineLoaded'),
    summaryLlm.indexOf('async function getPipeline'),
  );
  const gpuIdx = src.indexOf('await ensureWebGpuProbed()');
  const pinIdx = src.indexOf('if (!sessionModelId) sessionModelId = computeResolvedModelId()');
  assert.ok(gpuIdx > 0 && pinIdx > 0 && gpuIdx < pinIdx, 'model must be pinned after the WebGPU probe');
  // After a WebGPU -> WASM fallback the pin follows the package that actually loaded.
  assert.match(src, /sessionModelId = loadModelId;/);
  // The pin is released on cache clear / reset / cancel so the user can change models.
  assert.match(summaryLlm, /function clearSummaryLLMCache[\s\S]*?sessionModelId = null/);
  assert.match(summaryLlm, /function cancelDownloadInFlight[\s\S]*?sessionModelId = null/);
});

test('download progress is monotonic (no backwards 100%→restart jump)', () => {
  assert.match(summaryLlm, /var downloadPctPeak = 0/);
  assert.match(summaryLlm, /if \(data\.status === 'initiate'\) downloadPctPeak = 0/);
  assert.match(summaryLlm, /if \(pct < downloadPctPeak\) pct = downloadPctPeak;\s*else downloadPctPeak = pct;/);
});

test('ensurePipelineLoaded claims loadInFlight before awaiting consent', () => {
  const src = summaryLlm.slice(
    summaryLlm.indexOf('async function ensurePipelineLoaded'),
    summaryLlm.indexOf('async function getPipeline'),
  );
  const inFlightIdx = src.indexOf('loadInFlight = (async function');
  const consentIdx = src.indexOf('await ensureDownloadConsent()');
  assert.ok(inFlightIdx > 0 && consentIdx > 0 && inFlightIdx < consentIdx,
    'consent prompt must live inside the in-flight promise so concurrent callers dedupe');
});

test('ai-chat routes factual stat questions to the deterministic grounded reply', () => {
  assert.match(aiChat, /function isFactualStatQuestion/);
  assert.match(aiChat, /FASTPATH_STAT_RE/);
  assert.match(aiChat, /FASTPATH_ADVICE_RE/);
  // Fast-path returns the grounded fallback before assembling an LLM payload.
  const fastIdx = aiChat.indexOf('isFactualStatQuestion(userMessage) && fastPathDataReady()');
  const payloadIdx = aiChat.indexOf('var payload = assemblePayload(userMessage);');
  assert.ok(fastIdx > 0 && payloadIdx > 0 && fastIdx < payloadIdx, 'fast-path must precede LLM payload assembly');
});
