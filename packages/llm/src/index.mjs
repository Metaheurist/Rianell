export const LLM_MODEL_SMALL = 'SmolLM2-360M-Instruct';
export const LLM_MODEL_BASE = 'Llama-3.2-1B-Instruct';

/** Canonical Hugging Face repo ids (onnx-community *-ONNX mirrors). */
export const LLM_MODEL_SMALL_ID = 'onnx-community/SmolLM2-360M-Instruct-ONNX';
export const LLM_MODEL_BASE_ID = 'onnx-community/Llama-3.2-1B-Instruct-ONNX';

export const HF_REMOTE_HOST = 'https://huggingface.co/';
export const HF_REMOTE_PATH_TEMPLATE = '{model}/resolve/{revision}/';

export function buildHuggingFaceModelFileUrl(modelId, revision, filePath) {
  const base = HF_REMOTE_HOST.replace(/\/?$/, '/');
  const rev = revision || 'main';
  const p = String(filePath || '').replace(/^\/+/, '');
  return `${base}${modelId}/resolve/${rev}/${p}`;
}

export function resolveHfModelId(manifestEntry) {
  if (!manifestEntry) return '';
  if (typeof manifestEntry === 'string') return manifestEntry;
  return manifestEntry.sourceRepo || manifestEntry.id || '';
}

export function modelIdFromTier(tier) {
  if (tier === 'tier1' || tier === 'tier2') return LLM_MODEL_SMALL_ID;
  return LLM_MODEL_BASE_ID;
}

/** Build URL for a file on the app host (GitHub Pages, rianell.com, local dev server). */
export function buildSelfHostedModelFileUrl(baseUrl, modelId, revision, file) {
  const base = String(baseUrl || '/').replace(/\/?$/, '/');
  const rev = revision || 'main';
  const path = String(file || '').replace(/^\/+/, '');
  return `${base}models/${modelId}/resolve/${rev}/${path}`;
}

/** Public Supabase Storage base for mirrored /models/… tree (legacy upload script only). */
export function buildSupabaseModelsPublicBase(supabaseProjectUrl, bucketName) {
  const url = String(supabaseProjectUrl || '').replace(/\/$/, '');
  const bucket = String(bucketName || '').trim();
  if (!url || !bucket) return '';
  return `${url}/storage/v1/object/public/${bucket}/`;
}

export const DEFAULT_MODELS_STORAGE_BUCKET = 'llm-models';

export const MODELS_REMOTE_PATH_TEMPLATE = 'models/{model}/resolve/{revision}/';

/** Resolve remoteHost + pathTemplate for Transformers.js — HF Hub only at runtime. */
export function resolveModelsRemoteHost(options = {}) {
  if (options.preferSupabase === true && options.supabaseUrl) {
    const supabaseBase = buildSupabaseModelsPublicBase(
      options.supabaseUrl,
      options.modelsStorageBucket || DEFAULT_MODELS_STORAGE_BUCKET
    );
    if (supabaseBase) {
      return { remoteHost: supabaseBase, remotePathTemplate: MODELS_REMOTE_PATH_TEMPLATE, source: 'supabase' };
    }
  }
  return {
    remoteHost: HF_REMOTE_HOST,
    remotePathTemplate: HF_REMOTE_PATH_TEMPLATE,
    source: 'huggingface',
  };
}

export function buildModelsManifestUrl(baseUrl) {
  const base = String(baseUrl || '/').replace(/\/?$/, '/');
  return `${base}models/manifest.json`;
}

export const MANIFEST_CATALOG_URL = 'https://rianell.com/models/manifest.json';

export {
  DEFAULT_CHUNK_BYTE_LIMIT,
  chunkPartPath,
  planFileChunks,
  normalizeModelFileEntries,
  logicalFilePaths,
  buildModelFileUrl,
  mergeArrayBuffers,
} from './chunks.mjs';

export function defaultMotdFallback() {
  return [
    'A glass of water is a good way to start the day.',
    'Sleep is how your body repairs itself.',
    'Simple, steady habits build lasting health.',
  ];
}

export function pickMotdFallback(rng = Math.random) {
  const list = defaultMotdFallback();
  return list[Math.floor(rng() * list.length)];
}

export {
  msPer200kToTier,
  scoreMsToTier,
  tierToLlmModelSize,
  modelSizeFromTierNumber,
  TIER_KEYS,
} from './tier-benchmark.mjs';

export {
  INSTANT_LLM_FEATURES,
  isInstantLlmFeature,
  resolveLlmModelSizeForFeature,
} from './instant-tier.mjs';

export {
  PLATFORM_KINDS,
  resolvePlatformKind,
  resolveLlmPreset,
  shouldCapTierForMemory,
  resolveWasmOnlyCap,
  modelNeedsExternalData,
  modelOnnxAttempts,
  LAST_STABLE_PRESET_KEY,
  parseOomError,
} from './runtime-profiles.mjs';

export {
  buildPwaLoadAttempts,
  buildPwaWebNnAttempts,
  buildPwaWasmAttempt,
  buildExpoGoLoadAttempts,
  buildRnLoadAttempts,
  backendLabelFromAttempt,
} from './load-ladder.mjs';

export { classifyGpuLoadError, GPU_PIPELINE_FAIL_KEY } from './gpu-errors.mjs';
export { MLC_LLAMA_MODEL_ID, ALLOWED_MLC_MODEL_IDS, isAllowedMlcModelId } from './mlc-config.mjs';
export { GGUF_LLAMA_MODEL_ID, ALLOWED_GGUF_MODEL_IDS, isAllowedGgufModelId } from './gguf-config.mjs';

/** Shared LLM request shape for web and RN adapters. */
export function buildLlmContext(intent, payload) {
  return { intent, payload, ts: Date.now() };
}
