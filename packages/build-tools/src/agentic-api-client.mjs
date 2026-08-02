/**
 * Safe client for Rianell local Agentic harness (/api/agentic/*).
 * Browser + Node: loopback hosts only (`localhost`, `127.0.0.0/8`, `::1`).
 */

/** @param {string} hostname */
export function isLoopbackHostname(hostname) {
  const host = String(hostname || '')
    .trim()
    .replace(/^\[|\]$/g, '')
    .toLowerCase()
    .replace(/\.$/, '');
  if (!host) return false;
  if (host === 'localhost' || host === '::1') return true;
  // Entire IPv4 loopback net 127.0.0.0/8
  const m = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  return [m[1], m[2], m[3]].every((oct) => {
    const n = Number(oct);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

export function assertLoopbackBaseUrl(baseUrl) {
  let u;
  try {
    u = new URL(baseUrl);
  } catch {
    throw new Error('invalid baseUrl');
  }
  if (!isLoopbackHostname(u.hostname)) {
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
  // Browser pages on localhost / 127.* / ::1 are safe clients; refuse LAN hosts.
  assertLoopbackBaseUrl(baseUrl);
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const root = `${String(baseUrl).replace(/\/$/, '')}/api/agentic`;
  const safeClient = isLoopbackHostname(new URL(baseUrl).hostname);

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
    /** True when baseUrl host is localhost / 127.* / ::1 */
    safeClient,
    getHealth: () => request('GET', '/health'),
    getStatus: () => request('GET', '/status'),
    getCatalog: () => request('GET', '/catalog'),
    getGpus: () => request('GET', '/gpus'),
    getMode: () => request('GET', '/mode'),
    setMode: (modeOrPatch) => request(
      'POST',
      '/mode',
      typeof modeOrPatch === 'string' ? { mode: modeOrPatch } : (modeOrPatch || {}),
    ),
    loadModel: (model, gpuHint) => request('POST', '/models/load', { model, gpuHint }),
    unloadModel: (model) => request('POST', '/models/unload', { model }),
    pauseAll: () => request('POST', '/pause-all', {}),
    resumeAll: () => request('POST', '/resume-all', {}),
    clearAll: () => request('POST', '/clear-all', {}),
    getFirecrawl: () => request('GET', '/firecrawl'),
    setFirecrawlKey: (apiKey) => request('POST', '/firecrawl', { apiKey }),
    clearFirecrawlKey: () => request('POST', '/firecrawl', { clear: true }),
    getPackStatus: (pack) => request('GET', `/${pack}/status`),
    getPackReport: (pack) => request('GET', `/${pack}/report`),
    getPackActivity: (pack) => request('GET', `/${pack}/activity`),
    getPackProposal: (pack) => request('GET', `/${pack}/proposal`),
    getPackStream: (pack) => request('GET', `/${pack}/stream`),
    selectProposalItems: (pack, body) => request('POST', `/${pack}/proposal/select`, body),
    approvePack: (pack, body = {}) => request('POST', `/${pack}/approve`, body),
    rejectPack: (pack, body = {}) => request('POST', `/${pack}/reject`, body),
    startPack: (pack, opts = {}) => request('POST', `/${pack}/start`, opts),
    pausePack: (pack) => request('POST', `/${pack}/pause`, {}),
    resumePack: (pack) => request('POST', `/${pack}/resume`, {}),
    setPackModel: (pack, body) => request('POST', `/${pack}/model`, body),
    runAll: (opts = {}) => request('POST', '/run-all', opts),
    getRunAllStatus: () => request('GET', '/run-all'),
    getRunAllActivity: () => request('GET', '/run-all/activity'),
    pauseRunAll: () => request('POST', '/run-all/pause', {}),
    resumeRunAll: () => request('POST', '/run-all/resume', {}),
    cancelRunAll: () => request('POST', '/run-all/cancel', {}),
    getVisualLive: () => request('GET', '/visual/live'),
    getVisualQa: () => request('GET', '/visual/qa'),
  };
}

export default createAgenticClient;
