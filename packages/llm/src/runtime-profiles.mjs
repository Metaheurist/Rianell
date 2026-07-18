import { tierToLlmModelSize } from './tier-benchmark.mjs';

export const PLATFORM_KINDS = [
  'pwa_desktop',
  'pwa_mobile',
];

const LLAMA_ID = 'onnx-community/Llama-3.2-1B-Instruct-ONNX';
const SMOLLM_ID = 'onnx-community/SmolLM2-360M-Instruct-ONNX';

function modelIdFromTierKey(tierKey) {
  if (tierKey === 'tier1' || tierKey === 'tier2') return SMOLLM_ID;
  return LLAMA_ID;
}

export function resolvePlatformKind(options = {}) {
  const { isMobile } = options;
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
  const isMobile = platformKind === 'pwa_mobile';

  if (deviceMemory != null && deviceMemory > 0) {
    if (!isMobile && deviceMemory < 4 && (tierKey === 'tier5' || tierKey === 'tier4')) {
      return {
        tier: 'tier3',
        capped: true,
        warning: 'Limited system memory; tier lowered for stability.',
      };
    }
    if (isMobile && deviceMemory < 4 && (tierKey === 'tier5' || tierKey === 'tier4')) {
      return {
        tier: 'tier3',
        capped: true,
        warning: 'Device memory is limited; tier lowered for stability.',
      };
    }
    if (isMobile && deviceMemory < 3 && tierKey === 'tier3') {
      return {
        tier: 'tier2',
        capped: true,
        warning: 'Device memory is limited; using a smaller model tier.',
      };
    }
  }

  return { tier: tierKey, capped: false, warning: null };
}

/**
 * When WebGPU is unavailable, cap tier 3–5 to tier 2 (SmolLM) unless user opts into large-on-WASM.
 * @param {{ tier: string, webGpuAvailable: boolean, forceLargeOnWasm?: boolean, deviceMemory?: number|null }} options
 */
export function resolveWasmOnlyCap(options = {}) {
  const {
    tier = 'tier3',
    webGpuAvailable = false,
    forceLargeOnWasm = false,
    deviceMemory = null,
  } = options;
  const tierKey = /^tier[1-5]$/.test(tier) ? tier : tierToLlmModelSize(tier);

  if (webGpuAvailable) {
    return { tier: tierKey, capped: false, warning: null };
  }

  if (tierKey === 'tier1' || tierKey === 'tier2') {
    return { tier: tierKey, capped: false, warning: null };
  }

  if (forceLargeOnWasm && deviceMemory != null && deviceMemory >= 8) {
    return {
      tier: tierKey,
      capped: false,
      warning: 'Large model on WASM-only - may be slow or run out of memory.',
    };
  }

  return {
    tier: 'tier2',
    capped: true,
    warning: 'No GPU acceleration available; using smaller AI model for stability.',
  };
}

export const LAST_STABLE_PRESET_KEY = 'rianell.llm.lastStablePreset';

export function parseOomError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return /out of memory|oom|memory allocation|failed to allocate|array buffer allocation/i.test(msg);
}
