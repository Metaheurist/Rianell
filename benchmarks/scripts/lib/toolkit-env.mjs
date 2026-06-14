import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getRepoRoot() {
  return process.env.BENCHMARK_REPO_ROOT || path.resolve(__dirname, '..', '..', '..');
}

export function getPwaRoot() {
  const repo = getRepoRoot();
  const env = process.env.BENCHMARK_PWA_ROOT;
  if (env) {
    const p = path.isAbsolute(env) ? env : path.join(repo, env);
    return path.resolve(p);
  }
  const min = path.join(repo, 'apps', 'pwa-webapp', '.android-dist');
  if (fs.existsSync(path.join(min, 'index.html'))) return min;
  return path.join(repo, 'apps', 'pwa-webapp');
}

export function benchmarkMeta(extra = {}) {
  return {
    timestamp_utc: new Date().toISOString(),
    git_sha: process.env.GITHUB_SHA || process.env.GIT_SHA || 'local',
    runner: process.platform,
    node: process.version,
    ...extra,
  };
}

export function loadTierProfiles() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'tier-profiles.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadThresholds() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'thresholds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadGodModeCatalog() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'god-mode-catalog.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadAllowlistedNetworkErrors() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'allowlisted-network-errors.json');
  if (!fs.existsSync(p)) return { patterns: [], allow_when: {} };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function parseTierFilter() {
  const raw = process.env.TIER_MATRIX_FILTER || '';
  if (!raw.trim()) return null;
  return raw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= 5);
}

export function parsePlatformFilter() {
  const raw = (process.env.TIER_MATRIX_PLATFORM || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'desktop' || raw === 'mobile') return raw;
  return null;
}

export const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
};

export const BENCHMARK_QUERY = 'benchmark_test=1';

export function entryUrl(base, extraQuery = '') {
  const q = extraQuery ? `${BENCHMARK_QUERY}&${extraQuery}` : BENCHMARK_QUERY;
  return `${base}/index.html?${q}`;
}
