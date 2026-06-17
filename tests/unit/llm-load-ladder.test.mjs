import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPwaLoadAttempts,
  buildPwaWebNnAttempts,
  buildPwaWasmAttempt,
  buildRnLoadAttempts,
  buildExpoGoLoadAttempts,
  backendLabelFromAttempt,
  classifyGpuLoadError,
  LLM_MODEL_BASE_ID,
  LLM_MODEL_SMALL_ID,
} from '../../packages/llm/src/index.mjs';

test('buildPwaLoadAttempts orders webgpu dtypes only', () => {
  const plans = buildPwaLoadAttempts({
    platformKind: 'pwa_desktop',
    gpuCandidates: ['webgpu', 'webgl'],
  });
  assert.equal(plans.length, 2);
  assert.equal(plans[0].device, 'webgpu');
  assert.equal(plans[0].dtype, 'q4f16');
  assert.equal(plans[1].device, 'webgpu');
  assert.equal(plans[1].dtype, 'q4');
  assert.ok(plans.every((p) => p.device !== 'webgl'));
});

test('pwa_mobile never includes webgl', () => {
  const plans = buildPwaLoadAttempts({
    platformKind: 'pwa_mobile',
    gpuCandidates: ['webgl', 'webgpu'],
  });
  assert.ok(plans.every((p) => p.device !== 'webgl'));
  assert.equal(plans[0].device, 'webgpu');
});

test('buildPwaWasmAttempt is wasm q4', () => {
  assert.deepEqual(buildPwaWasmAttempt(), { revision: 'main', device: 'wasm', dtype: 'q4' });
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

test('buildPwaWebNnAttempts includes webnn devices', () => {
  const plans = buildPwaWebNnAttempts();
  assert.ok(plans.length >= 4);
  assert.ok(plans.some((p) => p.device === 'webnn-gpu'));
  assert.ok(plans.every((p) => p.device.startsWith('webnn')));
});

test('LLM_TRY_Q4_BEFORE_Q4F16 reorders webgpu dtypes', () => {
  const prev = process.env.LLM_TRY_Q4_BEFORE_Q4F16;
  process.env.LLM_TRY_Q4_BEFORE_Q4F16 = '1';
  const plans = buildPwaLoadAttempts({ gpuCandidates: ['webgpu'] });
  assert.equal(plans[0].dtype, 'q4');
  assert.equal(plans[1].dtype, 'q4f16');
  if (prev === undefined) delete process.env.LLM_TRY_Q4_BEFORE_Q4F16;
  else process.env.LLM_TRY_Q4_BEFORE_Q4F16 = prev;
});

test('classifyGpuLoadError detects 557856688', () => {
  const c = classifyGpuLoadError(new Error('WebGPU failed with code 557856688'));
  assert.equal(c.class, 'ort_webgpu_pipeline_fail');
  assert.equal(c.retryPath, 'mlc');
});
