import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const summaryLlm = fs.readFileSync(
  new URL('../../../apps/pwa-webapp/summary-llm.js', import.meta.url),
  'utf8',
);
const summaryLlmMlc = fs.readFileSync(
  new URL('../../../apps/pwa-webapp/summary-llm-mlc.js', import.meta.url),
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

test('MLC adapter allowlists small + base models (not a single-model gate)', () => {
  assert.match(summaryLlmMlc, /var ALLOWED_MODELS = \[MLC_SMALL_MODEL, MLC_BASE_MODEL\]/);
  assert.match(summaryLlmMlc, /Qwen2\.5-0\.5B-Instruct-q4f16_1-MLC/);
  assert.match(summaryLlmMlc, /Qwen2\.5-1\.5B-Instruct-q4f16_1-MLC/);
  assert.match(summaryLlmMlc, /function isAllowedModel/);
  assert.match(summaryLlmMlc, /function resolveModelForTier/);
  // The old hard single-model equality gate must be gone.
  assert.doesNotMatch(summaryLlmMlc, /mid !== ALLOWED_MODEL/);
  // Exposes the tier resolver + model ids for the primary path.
  assert.match(summaryLlmMlc, /smallModel: MLC_SMALL_MODEL/);
  assert.match(summaryLlmMlc, /resolveModelForTier: resolveModelForTier/);
});

test('summary-llm loads MLC as the primary WebGPU engine for all tiers', () => {
  assert.match(summaryLlm, /loading WebLLM MLC \(primary WebGPU engine\)/);
  assert.match(summaryLlm, /function resolveMlcModelIdForModel/);
  // MLC attempt is no longer gated to MODEL_BASE only.
  assert.doesNotMatch(summaryLlm, /loadModelId === MODEL_BASE && enginePref !== 'onnx' && enginePref !== 'gguf'/);
  // MLC path is tried before the ONNX transformers.js path.
  const mlcIdx = summaryLlm.indexOf('loading WebLLM MLC (primary WebGPU engine)');
  const onnxIdx = summaryLlm.indexOf('Path 2: ONNX transformers.js');
  assert.ok(mlcIdx > 0 && onnxIdx > 0 && mlcIdx < onnxIdx, 'MLC path should precede ONNX path');
});

test('summary-llm gives MLC first-run a longer load budget', () => {
  assert.match(summaryLlm, /var LOAD_TIMEOUT_MS = 240000/);
  assert.match(summaryLlm, /var FINALIZE_TIMEOUT_MS = 180000/);
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

test('MLC adapter dedupes an in-flight download (claims activeModelId before reload)', () => {
  // activeModelId is set up-front so a second ensureMlcEngine call during the ~30s
  // reload returns the same promise instead of spawning a duplicate Worker/download.
  const claimIdx = summaryLlmMlc.indexOf('activeModelId = mid;');
  const reloadIdx = summaryLlmMlc.indexOf('await engine.reload(mid)');
  assert.ok(claimIdx > 0 && reloadIdx > 0 && claimIdx < reloadIdx,
    'activeModelId must be claimed before engine.reload()');
  // Error cleanup only clears shared state if this call still owns the slot.
  assert.match(summaryLlmMlc, /if \(enginePromise === thisPromise\)/);
  // Switching to a different allowlisted model disposes the previous engine.
  assert.match(summaryLlmMlc, /activeModelId !== mid[\s\S]*?disposeMlcEngine/);
});

test('runChatInference loads first then dispatches on the resolved engine', () => {
  // The engine is only known after ensurePipelineLoaded settles, so dispatch must
  // happen after the load — never call a worker-backed marker as a function.
  const src = summaryLlm.slice(
    summaryLlm.indexOf('async function runChatInference'),
    summaryLlm.indexOf('function isPipelineReadyForChat'),
  );
  const loadIdx = src.indexOf('var pipe = await ensurePipelineLoaded');
  const mlcIdx = src.indexOf("cachedActiveEngine === 'mlc'");
  const callIdx = src.indexOf('await pipe(');
  assert.ok(loadIdx > 0 && mlcIdx > 0 && loadIdx < mlcIdx, 'load must precede engine dispatch');
  assert.ok(callIdx > loadIdx, 'the callable pipe path runs after load');
  assert.match(src, /typeof pipe !== 'function'/, 'guards against calling a non-callable engine marker');
});

test('model is pinned per session (after WebGPU is known) to avoid mid-load re-download', () => {
  // Tier depends on async signals (WebGPU probe, benchmark). Pinning the model after
  // ensureGpuCandidatesReady() stops a small→large upgrade from re-downloading.
  assert.match(summaryLlm, /var sessionModelId = null/);
  assert.match(summaryLlm, /return sessionModelId \|\| computeResolvedModelId\(\)/);
  const src = summaryLlm.slice(
    summaryLlm.indexOf('async function ensurePipelineLoaded'),
    summaryLlm.indexOf('async function getPipeline'),
  );
  const gpuIdx = src.indexOf('await ensureGpuCandidatesReady()');
  const pinIdx = src.indexOf('if (!sessionModelId) sessionModelId = computeResolvedModelId()');
  assert.ok(gpuIdx > 0 && pinIdx > 0 && gpuIdx < pinIdx, 'model must be pinned after GPU readiness');
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
