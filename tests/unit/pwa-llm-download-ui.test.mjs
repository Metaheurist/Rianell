import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const summaryLlm = fs.readFileSync(
  new URL('../../apps/pwa-webapp/summary-llm.js', import.meta.url),
  'utf8',
);
const uiFeedback = fs.readFileSync(
  new URL('../../apps/pwa-webapp/ui-feedback.js', import.meta.url),
  'utf8',
);
const styles = fs.readFileSync(
  new URL('../../apps/pwa-webapp/styles.css', import.meta.url),
  'utf8',
);
const appJs = fs.readFileSync(
  new URL('../../apps/pwa-webapp/app.js', import.meta.url),
  'utf8',
);

test('PWA LLM download UI uses generic i18n label (not Hugging Face filenames)', () => {
  assert.match(uiFeedback, /common\.downloading\.ai\.model/);
  assert.doesNotMatch(uiFeedback, /Downloading from Hugging Face/);
  assert.doesNotMatch(uiFeedback, /Downloading model parts/);
  assert.doesNotMatch(summaryLlm, /return 'model parts'/);
});

test('AI download modals stack above settings overlay', () => {
  assert.match(styles, /\.ai-model-download-consent[\s\S]*z-index:\s*100010/);
  assert.match(styles, /\.ai-model-download-progress[\s\S]*z-index:\s*100010/);
});

test('cancelAiModelDownload ignores late progress after cancel', () => {
  assert.match(summaryLlm, /if \(downloadCancelled\) return/);
  assert.match(summaryLlm, /window\.cancelAiModelDownload = cancelDownloadInFlight/);
});

test('summary-llm uses GPU load ladder not getPreferredDevice', () => {
  assert.doesNotMatch(summaryLlm, /getPreferredDevice/);
  assert.match(summaryLlm, /tryLoadWithPlans/);
  assert.match(summaryLlm, /warmupPipelineOrThrow/);
});

test('summary-llm does not pass webgl to Transformers load ladder', () => {
  assert.doesNotMatch(summaryLlm, /device:\s*'webgl'/);
  assert.match(summaryLlm, /probeWebGpuAdapterAsync/);
});

test('getAiModelStatus ready requires in-memory pipeline', () => {
  assert.match(summaryLlm, /state:\s*'ready'/);
  assert.match(summaryLlm, /inMemory:\s*true/);
  assert.match(summaryLlm, /cachedPipeline && cachedModelId/);
});

test('download progress tracks the dominant file and caps at 99% until final', () => {
  // Per-file byte tallies avoid the "reaches 100% then restarts" symptom where
  // each file cycles 0->100 independently.
  assert.match(summaryLlm, /var downloadFileBytes = \{\}/);
  assert.match(summaryLlm, /downloadFileBytes\[data\.file\]/);
  // Headline percent follows the single largest (weights) file.
  assert.match(summaryLlm, /pct = Math\.round\(frac \* 99\)/);
  assert.match(summaryLlm, /pct = Math\.max\(0, Math\.min\(99, pct\)\)/);
  assert.match(summaryLlm, /var weightsDone/);
});

test('normalises transformers.js progress whether 0-1 or 0-100', () => {
  assert.match(summaryLlm, /pct = Math\.round\(p > 1 \? p : p \* 100\)/);
});

test('finalize watchdog fails a hung compile/warmup instead of sticking at ~100%', () => {
  assert.match(summaryLlm, /var FINALIZE_TIMEOUT_MS = \d+/);
  assert.match(summaryLlm, /finalizeWatchdog/);
  assert.match(summaryLlm, /status = finalizing \? 'finalizing'/);
  assert.match(summaryLlm, /Model preparation timed out/);
  assert.match(summaryLlm, /function clearFinalizeWatchdog/);
});

test('pipeline load is stall-guarded so a hung backend falls through to WASM', () => {
  assert.match(summaryLlm, /var COMPILE_STALL_MS = \d+/);
  assert.match(summaryLlm, /function runChatGenerationPipelineGuarded/);
  assert.match(summaryLlm, /Model engine load stalled/);
  // Both the primary ladder and WASM fallbacks use the guarded loader.
  assert.doesNotMatch(summaryLlm, /= await runChatGenerationPipeline\(mod/);
});

test('finalizing phase relabels the download banner as "Preparing…"', () => {
  assert.match(uiFeedback, /function formatAiDownloadLabel/);
  assert.match(uiFeedback, /finalizing[\s\S]*common\.preparing\.on\.device\.ai/);
});

test('home Ask gate defers progress to the shared overlay and dedupes renders', () => {
  // No second inline progress bar in the home gate.
  assert.doesNotMatch(appJs, /home-ask-setup__progress-fill/);
  // Render-signature guard prevents the pill flashing every progress tick.
  assert.match(appJs, /data-render-sig/);
  assert.match(appJs, /home-ask-setup__spinner/);
  assert.match(styles, /\.home-ask-setup__spinner[\s\S]*homeAskSetupSpin/);
  assert.match(styles, /@keyframes homeAskSetupSpin/);
});
