const MAX_PWA_ATTEMPTS = 12;

const WEBGPU_DTYPES_DEFAULT = ['q4f16', 'q4'];
const WEBGPU_DTYPES_Q4_FIRST = ['q4', 'q4f16'];
const WEBNN_DEVICES = ['webnn-gpu', 'webnn-npu', 'webnn-cpu'];

function webgpuDtypeOrder() {
  if (process.env.LLM_TRY_Q4_BEFORE_Q4F16 === '1') return WEBGPU_DTYPES_Q4_FIRST;
  return WEBGPU_DTYPES_DEFAULT;
}

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

  for (const device of devices) {
    if (device === 'webgpu') {
      for (const dtype of webgpuDtypeOrder()) add('webgpu', dtype);
    } else if (device === 'webnn' || device.startsWith('webnn-')) {
      const webnnDevs = device === 'webnn' ? WEBNN_DEVICES : [device];
      for (const wn of webnnDevs) {
        for (const dtype of webgpuDtypeOrder()) add(wn, dtype);
      }
    }
  }

  return plans;
}

/** WebNN-only attempts (Stage 9 ladder slot). */
export function buildPwaWebNnAttempts(options = {}) {
  return buildPwaLoadAttempts({
    ...options,
    gpuCandidates: ['webnn-gpu', 'webnn-npu', 'webnn-cpu'],
  });
}

/** WASM / CPU last resort for PWA. */
export function buildPwaWasmAttempt() {
  return { revision: 'main', device: 'wasm', dtype: 'q4' };
}

export function backendLabelFromAttempt(attempt) {
  if (!attempt) return 'wasm';
  if (attempt.device) return attempt.device;
  return 'wasm';
}
