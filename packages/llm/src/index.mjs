export const LLM_MODEL_SMALL = 'SmolLM2-360M-Instruct';
export const LLM_MODEL_BASE = 'Llama-3.2-1B-Instruct';

/** Transformers.js / self-hosted path ids (under /models/{id}/resolve/…). */
export const LLM_MODEL_SMALL_ID = 'onnx-community/SmolLM2-360M-Instruct';
export const LLM_MODEL_BASE_ID = 'onnx-community/Llama-3.2-1B-Instruct';

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

/** Public Supabase Storage base for mirrored /models/… tree (bucket must be public-read). */
export function buildSupabaseModelsPublicBase(supabaseProjectUrl, bucketName) {
  const url = String(supabaseProjectUrl || '').replace(/\/$/, '');
  const bucket = String(bucketName || '').trim();
  if (!url || !bucket) return '';
  return `${url}/storage/v1/object/public/${bucket}/`;
}

export const DEFAULT_MODELS_STORAGE_BUCKET = 'llm-models';

export const MODELS_REMOTE_PATH_TEMPLATE = 'models/{model}/resolve/{revision}/';

/** Resolve remoteHost + pathTemplate for Transformers.js (Supabase > caller-supplied > Hugging Face). */
export function resolveModelsRemoteHost(options) {
  options = options || {};
  const supabaseBase = buildSupabaseModelsPublicBase(
    options.supabaseUrl,
    options.modelsStorageBucket || DEFAULT_MODELS_STORAGE_BUCKET
  );
  if (options.preferSupabase !== false && supabaseBase) {
    return { remoteHost: supabaseBase, remotePathTemplate: MODELS_REMOTE_PATH_TEMPLATE, source: 'supabase' };
  }
  if (options.appOriginBase) {
    return {
      remoteHost: options.appOriginBase,
      remotePathTemplate: MODELS_REMOTE_PATH_TEMPLATE,
      source: 'app-origin',
    };
  }
  return {
    remoteHost: 'https://huggingface.co/',
    remotePathTemplate: '{model}/resolve/{revision}/',
    source: 'huggingface',
  };
}

export function buildModelsManifestUrl(baseUrl) {
  const base = String(baseUrl || '/').replace(/\/?$/, '/');
  return `${base}models/manifest.json`;
}

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

/** Shared LLM request shape for web and RN adapters. */
export function buildLlmContext(intent, payload) {
  return { intent, payload, ts: Date.now() };
}
