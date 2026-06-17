import { modelOnnxAttempts } from './runtime-profiles.mjs';

const MAX_PWA_ATTEMPTS = 8;

/**
 * Build ordered Transformers.js load attempts (GPU first, WASM never included).
 * @param {{ platformKind: string, gpuCandidates: string[] }} options
 */
export function buildPwaLoadAttempts(options = {}) {
  const { platformKind = 'pwa_desktop', gpuCandidates = [] } = options;
  const plans = [];
  const seen = new Set();

  function add(device, dtype) {
    const key = device + ':' + dtype;
    if (seen.has(key) || plans.length >= MAX_PWA_ATTEMPTS) return;
    seen.add(key);
    plans.push({ device, dtype, revision: 'main' });
  }

  const devices = Array.isArray(gpuCandidates) ? gpuCandidates : [];
  const skipWebgl = platformKind === 'pwa_mobile' || platformKind === 'rn_expo_go';

  for (const device of devices) {
    if (device === 'webgpu') {
      add('webgpu', 'q4f16');
      add('webgpu', 'q4');
    } else if (device === 'webgl' && !skipWebgl) {
      add('webgl', 'q4');
    }
  }

  return plans;
}

/** WASM / CPU last resort for PWA. */
export function buildPwaWasmAttempt() {
  return { revision: 'main', dtype: 'q4' };
}

/** Expo Go: WASM only (no WebGPU in RN JS runtime). */
export function buildExpoGoLoadAttempts() {
  return [{ revision: 'main', dtype: 'q4' }];
}

/**
 * RN ORT: execution provider × quant attempts.
 * @param {{ platformKind: string, modelId: string }} options
 */
export function buildRnLoadAttempts(options = {}) {
  const { platformKind = 'rn_android', modelId } = options;
  const onnxAttempts = modelOnnxAttempts(modelId);
  const epOrder =
    platformKind === 'rn_ios'
      ? [['coreml', 'cpu'], ['cpu']]
      : [['nnapi', 'cpu'], ['cpu']];

  const plans = [];
  for (const eps of epOrder) {
    for (const onnx of onnxAttempts) {
      plans.push({
        executionProviders: eps,
        onnxPath: onnx.onnxPath,
        quant: onnx.quant,
        externalData: onnx.externalData,
      });
    }
  }
  return plans;
}

export function backendLabelFromAttempt(attempt) {
  if (!attempt) return 'wasm';
  if (attempt.device) return attempt.device;
  const eps = attempt.executionProviders;
  if (Array.isArray(eps) && eps.length) return String(eps[0]);
  return 'wasm';
}
