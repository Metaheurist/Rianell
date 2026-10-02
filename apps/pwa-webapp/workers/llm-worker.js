/**
 * On-device LLM worker (module worker). Hosts transformers.js so model download,
 * ONNX session compile and text generation run off the main thread. summary-llm.js
 * drives it through modules/llm-worker-client.js.
 *
 * Protocol (every request carries a numeric `id`):
 *   { type: 'load', config }          -> progress* then result { modelId, device, dtype }
 *   { type: 'generate', messages, options } -> result (plain generator output)
 *   { type: 'dispose' }               -> result true
 * Replies: { type: 'progress', id, data } | { type: 'result', id, ok, value | error }
 *
 * Prompts and replies stay in memory: nothing here is logged or persisted.
 */

const ALLOWED_REMOTE_HOST = 'https://huggingface.co/';
const CDN_RUNTIME_PREFIX = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@';
const COMMIT_SHA_RE = /^[0-9a-f]{40}$/;
const NOISY_WARNINGS = [
  'dtype not specified',
  'Unable to determine content-length from response headers',
  'Unable to add response to browser cache',
];

let runtime = null;
let runtimeUrl = '';
let generator = null;
let generatorKey = '';
let baseFetch = null;

function sanitizeError(err) {
  const message = err && err.message ? String(err.message) : String(err || 'Unknown error');
  return {
    name: err && err.name ? String(err.name) : 'Error',
    message: message.slice(0, 500),
  };
}

function isAllowedRuntimeUrl(url) {
  const value = String(url || '');
  const origin = self.location && self.location.origin ? self.location.origin : '';
  return (origin && value.startsWith(origin + '/')) || value.startsWith(CDN_RUNTIME_PREFIX);
}

function rebaseFile(url, base) {
  const name = String(url || '').split('/').pop();
  return name ? base + name : url;
}

/** Point ORT at self-hosted WASM, keeping the file variant transformers.js selected. */
function useSelfHostedWasm(mod, wasmBase) {
  const wasm = mod && mod.env && mod.env.backends && mod.env.backends.onnx && mod.env.backends.onnx.wasm;
  if (!wasm || !wasmBase) return;
  const paths = wasm.wasmPaths;
  if (paths && typeof paths === 'object') {
    wasm.wasmPaths = { mjs: rebaseFile(paths.mjs, wasmBase), wasm: rebaseFile(paths.wasm, wasmBase) };
  } else {
    wasm.wasmPaths = wasmBase;
  }
}

/**
 * transformers.js 4.3 pipeline() fetches its file list and progress-size probes without
 * the requested revision, so rewrite this model's `resolve/main/` URLs to the pinned SHA.
 */
function pinModelRevision(mod, modelId, revision) {
  if (!baseFetch) baseFetch = mod.env.fetch || ((input, init) => fetch(input, init));
  const unpinned = ALLOWED_REMOTE_HOST + modelId + '/resolve/main/';
  const pinned = ALLOWED_REMOTE_HOST + modelId + '/resolve/' + revision + '/';
  mod.env.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.startsWith(unpinned)) return baseFetch(pinned + url.slice(unpinned.length), init);
    return baseFetch(input, init);
  };
}

async function importRuntime(config) {
  if (runtime && runtimeUrl === config.runtimeUrl) return runtime;
  if (!isAllowedRuntimeUrl(config.runtimeUrl)) {
    throw new Error('Transformers runtime URL is not allowed');
  }
  const mod = await import(config.runtimeUrl);
  if (config.wasmBase) useSelfHostedWasm(mod, config.wasmBase);
  runtime = mod;
  runtimeUrl = config.runtimeUrl;
  return mod;
}

function toProgressData(data) {
  if (!data || typeof data !== 'object') return {};
  return {
    status: data.status != null ? String(data.status) : '',
    file: data.file != null ? String(data.file) : '',
    progress: typeof data.progress === 'number' ? data.progress : undefined,
    loaded: typeof data.loaded === 'number' ? data.loaded : undefined,
    total: typeof data.total === 'number' ? data.total : undefined,
  };
}

async function disposeGenerator() {
  const current = generator;
  generator = null;
  generatorKey = '';
  if (current && typeof current.dispose === 'function') {
    try { await current.dispose(); } catch (e) { /* already released */ }
  }
}

/** transformers.js accepts one dtype, or a per-component map for multi-session models. */
function isValidDtype(dtype) {
  if (dtype == null || typeof dtype === 'string') return true;
  if (typeof dtype !== 'object' || Array.isArray(dtype)) return false;
  return Object.keys(dtype).every((k) => typeof dtype[k] === 'string');
}

async function load(id, config) {
  if (!config || typeof config.modelId !== 'string' || !config.modelId) {
    throw new Error('Model id is required');
  }
  if (!COMMIT_SHA_RE.test(String(config.revision || ''))) {
    throw new Error('Model revision must be a pinned commit SHA');
  }
  if (config.remoteHost !== ALLOWED_REMOTE_HOST) {
    throw new Error('Model host is not allowed');
  }
  if (!isValidDtype(config.dtype)) {
    throw new Error('Model dtype must be a string or a map of component names to strings');
  }
  const key = [config.modelId, config.revision, config.device || 'wasm', JSON.stringify(config.dtype || '')].join('|');
  if (generator && generatorKey === key) {
    return { modelId: config.modelId, device: config.device || 'wasm', dtype: config.dtype || null };
  }
  await disposeGenerator();

  const mod = await importRuntime(config);
  mod.env.allowLocalModels = false;
  mod.env.remoteHost = ALLOWED_REMOTE_HOST;
  mod.env.remotePathTemplate = '{model}/resolve/{revision}/';
  mod.env.useBrowserCache = config.useBrowserCache !== false;
  pinModelRevision(mod, config.modelId, config.revision);

  const options = {
    revision: config.revision,
    progress_callback(data) {
      self.postMessage({ type: 'progress', id, data: toProgressData(data) });
    },
  };
  if (config.device) options.device = config.device;
  if (config.dtype) options.dtype = config.dtype;

  const origWarn = console.warn;
  console.warn = function (...args) {
    const first = args[0] != null ? String(args[0]) : '';
    if (NOISY_WARNINGS.some((s) => first.includes(s))) return;
    origWarn.apply(console, args);
  };
  try {
    generator = await mod.pipeline('text-generation', config.modelId, options);
  } finally {
    console.warn = origWarn;
  }
  generatorKey = key;
  return { modelId: config.modelId, device: config.device || 'wasm', dtype: config.dtype || null };
}

async function generate(messages, options) {
  if (!generator) throw new Error('Model is not loaded');
  if (!Array.isArray(messages) || messages.length === 0) throw new Error('Messages are required');
  const out = await generator(messages, options || {});
  return JSON.parse(JSON.stringify(out));
}

async function handle(msg) {
  switch (msg.type) {
    case 'load': return load(msg.id, msg.config);
    case 'generate': return generate(msg.messages, msg.options);
    case 'dispose': await disposeGenerator(); return true;
    default: throw new Error('Unknown request type');
  }
}

self.addEventListener('message', async (event) => {
  const msg = event && event.data;
  if (!msg || typeof msg.id !== 'number') return;
  try {
    const value = await handle(msg);
    self.postMessage({ type: 'result', id: msg.id, ok: true, value });
  } catch (err) {
    self.postMessage({ type: 'result', id: msg.id, ok: false, error: sanitizeError(err) });
  }
});
