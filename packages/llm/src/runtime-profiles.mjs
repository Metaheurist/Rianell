import { tierToLlmModelSize } from './tier-benchmark.mjs';

export const PLATFORM_KINDS = [
  'pwa_desktop',
  'pwa_mobile',
  'rn_android',
  'rn_ios',
  'rn_expo_go',
];

const LLAMA_ID = 'onnx-community/Llama-3.2-1B-Instruct-ONNX';
const SMOLLM_ID = 'onnx-community/SmolLM2-360M-Instruct-ONNX';

function modelIdFromTierKey(tierKey) {
  if (tierKey === 'tier1' || tierKey === 'tier2') return SMOLLM_ID;
  return LLAMA_ID;
}

/** Llama ONNX uses external .onnx_data; SmolLM q4 is self-contained in manifest. */
export function modelNeedsExternalData(modelId) {
  return modelId === LLAMA_ID;
}

export function resolvePlatformKind(options = {}) {
  const { surface, os, isExpoGo, isMobile } = options;
  if (isExpoGo) return 'rn_expo_go';
  if (surface === 'rn' || surface === 'native') {
    if (os === 'ios') return 'rn_ios';
    if (os === 'android') return 'rn_android';
    return 'rn_android';
  }
  if (isMobile) return 'pwa_mobile';
  return 'pwa_desktop';
}

export function resolveLlmPreset(options = {}) {
  const {
    platformKind = 'pwa_desktop',
    tier = 3,
    userOverride,
    deviceMemory = null,
  } = options;

  let tierKey = userOverride && /^tier[1-5]$/.test(userOverride)
    ? userOverride
    : tierToLlmModelSize(tier);

  const capped = shouldCapTierForMemory({ platformKind, tier: tierKey, deviceMemory });
  if (capped.capped) tierKey = capped.tier;

  const modelId = modelIdFromTierKey(tierKey);
  return {
    platformKind,
    tierKey,
    modelId,
    memoryWarning: capped.warning || null,
  };
}

export function shouldCapTierForMemory({ platformKind, tier, deviceMemory }) {
  const tierKey = /^tier[1-5]$/.test(tier) ? tier : tierToLlmModelSize(tier);
  const isMobile = platformKind === 'pwa_mobile' || platformKind === 'rn_android' || platformKind === 'rn_ios' || platformKind === 'rn_expo_go';
  if (!isMobile || deviceMemory == null || deviceMemory <= 0) {
    return { tier: tierKey, capped: false, warning: null };
  }
  if (deviceMemory < 4 && (tierKey === 'tier5' || tierKey === 'tier4')) {
    return {
      tier: 'tier3',
      capped: true,
      warning: 'Device memory is limited; tier lowered for stability.',
    };
  }
  if (deviceMemory < 3 && tierKey === 'tier3') {
    return {
      tier: 'tier2',
      capped: true,
      warning: 'Device memory is limited; using a smaller model tier.',
    };
  }
  return { tier: tierKey, capped: false, warning: null };
}

/** ONNX relative paths per quant attempt (RN / manifest). */
export function modelOnnxAttempts(modelId) {
  const external = modelNeedsExternalData(modelId);
  return [
    { onnxPath: 'onnx/model_q4f16.onnx', quant: 'q4f16', externalData: external },
    { onnxPath: 'onnx/model_q4.onnx', quant: 'q4', externalData: external },
  ];
}

export const LAST_STABLE_PRESET_KEY = 'rianell.llm.lastStablePreset';

export function parseOomError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return /out of memory|oom|memory allocation|failed to allocate|array buffer allocation/i.test(msg);
}
