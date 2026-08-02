/**
 * Local Firecrawl API key (security/.env). Never return the raw key to clients.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './state.mjs';

const SECURITY_ENV = path.join(ROOT, 'security', '.env');
const ROOT_ENV = path.join(ROOT, '.env');
const KEY_RE = /^FIRECRAWL_API_KEY=(.*)$/m;
const URL_RE = /^FIRECRAWL_API_URL=(.*)$/m;

function stripQuotes(v) {
  const s = String(v || '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return '';
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseFromText(text, re) {
  const m = String(text || '').match(re);
  return m ? stripQuotes(m[1]) : '';
}

/**
 * Resolve key: process.env → security/.env → root .env
 */
export function getFirecrawlApiKey() {
  const fromEnv = stripQuotes(process.env.FIRECRAWL_API_KEY || '');
  if (fromEnv) return { key: fromEnv, source: 'env' };
  const sec = parseFromText(readEnvFile(SECURITY_ENV), KEY_RE);
  if (sec) return { key: sec, source: 'security/.env' };
  const root = parseFromText(readEnvFile(ROOT_ENV), KEY_RE);
  if (root) return { key: root, source: '.env' };
  return { key: '', source: null };
}

export function getFirecrawlApiUrl() {
  const fromEnv = stripQuotes(process.env.FIRECRAWL_API_URL || '');
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const sec = parseFromText(readEnvFile(SECURITY_ENV), URL_RE);
  if (sec) return sec.replace(/\/$/, '');
  const root = parseFromText(readEnvFile(ROOT_ENV), URL_RE);
  if (root) return root.replace(/\/$/, '');
  return 'https://api.firecrawl.dev';
}

export function redactKey(key) {
  const k = String(key || '');
  if (!k) return null;
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 3)}…${k.slice(-4)}`;
}

/** Public status for loopback Settings UI (never includes full key). */
export function getFirecrawlStatus() {
  const { key, source } = getFirecrawlApiKey();
  return {
    configured: Boolean(key),
    source,
    hint: redactKey(key),
    apiUrl: getFirecrawlApiUrl(),
    envPath: path.relative(ROOT, SECURITY_ENV).replace(/\\/g, '/'),
  };
}

function upsertEnvLine(text, name, value) {
  const line = `${name}=${value}`;
  const re = new RegExp(`^${name}=.*$`, 'm');
  if (re.test(text)) return text.replace(re, line);
  const body = text.endsWith('\n') || !text ? text : `${text}\n`;
  const header = text.includes('FIRECRAWL_API_KEY') || text.includes('Firecrawl')
    ? ''
    : '\n# Firecrawl (shared Research stage — local only; never commit)\n';
  return `${body}${header}${line}\n`;
}

/**
 * Persist key to security/.env (gitignored). Updates process.env for this process.
 */
export function setFirecrawlApiKey(rawKey) {
  const key = stripQuotes(rawKey);
  if (!key || !/^fc-[A-Za-z0-9_-]{8,}$/.test(key)) {
    return { ok: false, error: { code: 'invalid', message: 'FIRECRAWL_API_KEY must look like fc-…' } };
  }
  const dir = path.dirname(SECURITY_ENV);
  fs.mkdirSync(dir, { recursive: true });
  let text = readEnvFile(SECURITY_ENV);
  if (!text && fs.existsSync(path.join(dir, '.env.example'))) {
    try { text = fs.readFileSync(path.join(dir, '.env.example'), 'utf8'); } catch { /* ignore */ }
  }
  text = upsertEnvLine(text, 'FIRECRAWL_API_KEY', key);
  fs.writeFileSync(SECURITY_ENV, text, 'utf8');
  process.env.FIRECRAWL_API_KEY = key;
  return { ok: true, data: getFirecrawlStatus(), error: null };
}

export function clearFirecrawlApiKey() {
  let text = readEnvFile(SECURITY_ENV);
  if (KEY_RE.test(text)) {
    text = text.replace(KEY_RE, 'FIRECRAWL_API_KEY=');
    fs.writeFileSync(SECURITY_ENV, text, 'utf8');
  }
  delete process.env.FIRECRAWL_API_KEY;
  return { ok: true, data: getFirecrawlStatus(), error: null };
}
