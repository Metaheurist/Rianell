/**
 * Endpoint validation for local LLM / research clients.
 * Ollama: loopback over http(s), or remote over https only.
 * Firecrawl: https, or loopback http for self-hosted instances.
 */

export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
export const DEFAULT_FIRECRAWL_API_URL = 'https://api.firecrawl.dev';

export function isLoopbackHostname(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '::1' || h === '0:0:0:0:0:0:0:1' || h === '0.0.0.0') return true;
  return /^127(?:\.\d{1,3}){3}$/.test(h);
}

function parseHttpUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `http://${s}`;
  let u;
  try {
    u = new URL(withScheme);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;
  return u;
}

function normalizeBase(u) {
  return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}`;
}

/**
 * @param {string} [raw]
 * @returns {{ ok: true, url: string } | { ok: false, error: string }}
 */
export function validateOllamaHost(raw) {
  const u = parseHttpUrl(raw);
  if (!u) return { ok: false, error: 'OLLAMA_HOST must be an http(s) URL' };
  if (isLoopbackHostname(u.hostname) || u.protocol === 'https:') {
    return { ok: true, url: normalizeBase(u) };
  }
  return { ok: false, error: `OLLAMA_HOST ${u.host} must be loopback or use https` };
}

/** Resolve OLLAMA_HOST, falling back to the loopback default when invalid. */
export function resolveOllamaHost(raw = process.env.OLLAMA_HOST) {
  if (!String(raw || '').trim()) return DEFAULT_OLLAMA_HOST;
  const v = validateOllamaHost(raw);
  if (v.ok) return v.url;
  console.warn(`[ollama] ${v.error}; using ${DEFAULT_OLLAMA_HOST}`);
  return DEFAULT_OLLAMA_HOST;
}

/**
 * @param {string} [raw]
 * @returns {{ ok: true, url: string } | { ok: false, error: string }}
 */
export function validateFirecrawlApiUrl(raw) {
  const s = String(raw || '').trim();
  if (!/^https?:\/\//i.test(s)) return { ok: false, error: 'FIRECRAWL_API_URL must be an http(s) URL' };
  const u = parseHttpUrl(s);
  if (!u) return { ok: false, error: 'FIRECRAWL_API_URL must be an http(s) URL' };
  if (u.protocol === 'https:' || isLoopbackHostname(u.hostname)) {
    return { ok: true, url: normalizeBase(u) };
  }
  return { ok: false, error: `FIRECRAWL_API_URL ${u.host} must use https (http allowed for loopback only)` };
}