/**
 * Safe client for Rianell local Agentic harness (/api/agentic/*).
 * Browser: same-origin only. Node: loopback hosts only.
 */

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function assertLoopbackBaseUrl(baseUrl) {
  let u;
  try {
    u = new URL(baseUrl);
  } catch {
    throw new Error('invalid baseUrl');
  }
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (!LOOPBACK_HOSTS.has(host) && host !== '127.0.0.1') {
    throw new Error(`agentic-api-client refuses non-loopback host: ${u.hostname}`);
  }
  return u.origin;
}

/**
 * @param {{ baseUrl?: string, fetchImpl?: typeof fetch }} [opts]
 */
export function createAgenticClient(opts = {}) {
  const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';
  const baseUrl = opts.baseUrl
    || (isBrowser ? `${window.location.origin}` : 'http://127.0.0.1:8080');
  if (!isBrowser) assertLoopbackBaseUrl(baseUrl);
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const root = `${String(baseUrl).replace(/\/$/, '')}/api/agentic`;

  async function request(method, path, body) {
    const url = `${root}${path}`;
    const res = await fetchImpl(url, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error(`agentic API non-JSON ${res.status}`);
    }
    if (json.schemaVersion == null && json.ok == null) {
      throw new Error('agentic API invalid envelope');
    }
    if (!res.ok || json.ok === false) {
      const err = new Error(json.error?.message || `agentic API ${res.status}`);
      err.code = json.error?.code || res.status;
      err.schedulerReason = json.error?.schedulerReason;
      err.envelope = json;
      throw err;
    }
    return json.data;
  }

  return {
    baseUrl: root,
    getHealth: () => request('GET', '/health'),
    getStatus: () => request('GET', '/status'),
    getCatalog: () => request('GET', '/catalog'),
    getGpus: () => request('GET', '/gpus'),
    getMode: () => request('GET', '/mode'),
    setMode: (mode) => request('POST', '/mode', { mode }),
    loadModel: (model, gpuHint) => request('POST', '/models/load', { model, gpuHint }),
    unloadModel: (model) => request('POST', '/models/unload', { model }),
    pauseAll: () => request('POST', '/pause-all', {}),
    resumeAll: () => request('POST', '/resume-all', {}),
    getPackStatus: (pack) => request('GET', `/${pack}/status`),
    getPackReport: (pack) => request('GET', `/${pack}/report`),
    startPack: (pack, opts = {}) => request('POST', `/${pack}/start`, opts),
    pausePack: (pack) => request('POST', `/${pack}/pause`, {}),
    resumePack: (pack) => request('POST', `/${pack}/resume`, {}),
    setPackModel: (pack, body) => request('POST', `/${pack}/model`, body),
    runAll: (opts = {}) => request('POST', '/run-all', opts),
    getRunAllStatus: () => request('GET', '/run-all'),
    pauseRunAll: () => request('POST', '/run-all/pause', {}),
    resumeRunAll: () => request('POST', '/run-all/resume', {}),
    cancelRunAll: () => request('POST', '/run-all/cancel', {}),
    getVisualLive: () => request('GET', '/visual/live'),
  };
}

export default createAgenticClient;
