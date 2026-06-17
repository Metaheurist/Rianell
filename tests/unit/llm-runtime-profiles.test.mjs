import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePlatformKind,
  resolveLlmPreset,
  shouldCapTierForMemory,
  resolveWasmOnlyCap,
  modelNeedsExternalData,
  LLM_MODEL_BASE_ID,
  LLM_MODEL_SMALL_ID,
} from '../../packages/llm/src/index.mjs';

test('resolvePlatformKind maps surfaces', () => {
  assert.equal(resolvePlatformKind({ isExpoGo: true }), 'rn_expo_go');
  assert.equal(resolvePlatformKind({ surface: 'rn', os: 'ios' }), 'rn_ios');
  assert.equal(resolvePlatformKind({ surface: 'rn', os: 'android' }), 'rn_android');
  assert.equal(resolvePlatformKind({ isMobile: true }), 'pwa_mobile');
  assert.equal(resolvePlatformKind({}), 'pwa_desktop');
});

test('resolveLlmPreset tier to model id', () => {
  const small = resolveLlmPreset({ tier: 1, userOverride: 'tier1' });
  assert.equal(small.modelId, LLM_MODEL_SMALL_ID);
  const large = resolveLlmPreset({ tier: 5, userOverride: 'tier5' });
  assert.equal(large.modelId, LLM_MODEL_BASE_ID);
});

test('shouldCapTierForMemory lowers tier on low RAM mobile', () => {
  const r = shouldCapTierForMemory({
    platformKind: 'pwa_mobile',
    tier: 'tier5',
    deviceMemory: 3,
  });
  assert.equal(r.capped, true);
  assert.equal(r.tier, 'tier3');
});

test('shouldCapTierForMemory lowers tier on low RAM desktop', () => {
  const r = shouldCapTierForMemory({
    platformKind: 'pwa_desktop',
    tier: 'tier5',
    deviceMemory: 3,
  });
  assert.equal(r.capped, true);
  assert.equal(r.tier, 'tier3');
});

test('resolveWasmOnlyCap lowers tier 5 to tier 2 when no webgpu', () => {
  const r = resolveWasmOnlyCap({ tier: 'tier5', webGpuAvailable: false });
  assert.equal(r.capped, true);
  assert.equal(r.tier, 'tier2');
});

test('resolveWasmOnlyCap allows large on wasm with override and memory floor', () => {
  const r = resolveWasmOnlyCap({
    tier: 'tier5',
    webGpuAvailable: false,
    forceLargeOnWasm: true,
    deviceMemory: 8,
  });
  assert.equal(r.capped, false);
  assert.equal(r.tier, 'tier5');
});

test('resolveWasmOnlyCap keeps tier when webgpu available', () => {
  const r = resolveWasmOnlyCap({ tier: 'tier5', webGpuAvailable: true });
  assert.equal(r.capped, false);
  assert.equal(r.tier, 'tier5');
});

test('modelNeedsExternalData only for Llama', () => {
  assert.equal(modelNeedsExternalData(LLM_MODEL_SMALL_ID), false);
  assert.equal(modelNeedsExternalData(LLM_MODEL_BASE_ID), true);
});
