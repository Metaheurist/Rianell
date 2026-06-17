import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPwaLoadAttempts,
  buildPwaWasmAttempt,
  buildRnLoadAttempts,
  buildExpoGoLoadAttempts,
  backendLabelFromAttempt,
  LLM_MODEL_BASE_ID,
  LLM_MODEL_SMALL_ID,
} from '../../packages/llm/src/index.mjs';

test('buildPwaLoadAttempts orders webgpu before webgl', () => {
  const plans = buildPwaLoadAttempts({
    platformKind: 'pwa_desktop',
    gpuCandidates: ['webgpu', 'webgl'],
  });
  assert.ok(plans.length >= 3);
  assert.equal(plans[0].device, 'webgpu');
  assert.equal(plans[0].dtype, 'q4f16');
  assert.equal(plans[plans.length - 1].device, 'webgl');
});

test('pwa_mobile skips webgl', () => {
  const plans = buildPwaLoadAttempts({
    platformKind: 'pwa_mobile',
    gpuCandidates: ['webgl', 'webgpu'],
  });
  assert.ok(plans.every((p) => p.device !== 'webgl'));
});

test('buildPwaWasmAttempt is q4', () => {
  assert.deepEqual(buildPwaWasmAttempt(), { revision: 'main', dtype: 'q4' });
});

test('buildRnLoadAttempts nnapi before cpu only ep', () => {
  const plans = buildRnLoadAttempts({
    platformKind: 'rn_android',
    modelId: LLM_MODEL_SMALL_ID,
  });
  assert.equal(plans[0].executionProviders[0], 'nnapi');
  assert.ok(plans.some((p) => p.executionProviders.length === 1 && p.executionProviders[0] === 'cpu'));
});

test('buildRnLoadAttempts coreml on ios', () => {
  const plans = buildRnLoadAttempts({
    platformKind: 'rn_ios',
    modelId: LLM_MODEL_BASE_ID,
  });
  assert.equal(plans[0].executionProviders[0], 'coreml');
  assert.equal(plans[0].externalData, true);
});

test('expo go wasm only', () => {
  assert.deepEqual(buildExpoGoLoadAttempts(), [{ revision: 'main', dtype: 'q4' }]);
});

test('backendLabelFromAttempt', () => {
  assert.equal(backendLabelFromAttempt({ device: 'webgpu' }), 'webgpu');
  assert.equal(backendLabelFromAttempt({ executionProviders: ['nnapi', 'cpu'] }), 'nnapi');
});
