import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSummaryLlm, withTimeout } from './helpers/summary-llm-harness.mjs';

test('preload on the WASM worker path settles (warmup must not queue behind its own load)', async () => {
  const { window, calls } = loadSummaryLlm({ webGpu: false });
  await withTimeout(window.preloadSummaryLLM({ skipConsent: true }), 5000, 'preloadSummaryLLM');
  assert.equal(window.getAiModelStatus().state, 'ready');
  assert.ok(calls.some((c) => c.type === 'load' && c.config.device === 'wasm'), 'loaded through the worker on WASM');
  assert.ok(calls.some((c) => c.type === 'generate'), 'warmup generated through the worker');
});
