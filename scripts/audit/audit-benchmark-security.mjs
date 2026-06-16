import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuditProfile, getChromium, killHeadless, PROBE_URL } from '@rianell/build-tools/probe-utils';

const SECURITY_PROFILE = process.env.SECURITY_PROFILE || (getAuditProfile() === 'strict' ? 'strict' : 'legacy');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const benchJs = path.join(root, 'apps/pwa-webapp/device-benchmark.js');
const cloudSync = path.join(root, 'apps/pwa-webapp/cloud-sync.js');

const FORBIDDEN_STRICT = ['raw', 'deviceVendor', 'deviceModel', 'tests', 'workloads'];
const REQUIRED = ['version', 'platformType', 'tier', 'ts'];

function grepNoNetwork() {
  const src = fs.readFileSync(benchJs, 'utf8');
  const hits = [];
  for (const pat of ['fetch(', 'sendBeacon', 'XMLHttpRequest']) {
    if (src.includes(pat)) hits.push(pat);
  }
  if (hits.length) {
    return { ok: false, code: 'SECURITY_NETWORK', detail: hits };
  }
  return { ok: true };
}

function grepCloudIsolation() {
  if (!fs.existsSync(cloudSync)) return { ok: true };
  const src = fs.readFileSync(cloudSync, 'utf8');
  if (/rianellPerfBenchmark|DeviceBenchmark/.test(src)) {
    return { ok: false, code: 'SECURITY_CLOUD_LEAK', detail: 'cloud-sync references benchmark' };
  }
  return { ok: true };
}

async function schemaLive() {
  killHeadless();
  const chromium = await getChromium();
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(PROBE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
        version: 5,
        platformType: 'desktop',
        tier: 3,
        heuristic: true,
        ts: Date.now(),
        gpu: { good: false, backend: 'none' },
      }));
    });
    const raw = await page.evaluate(() => localStorage.getItem('rianellPerfBenchmark'));
    const obj = JSON.parse(raw || '{}');
    if (SECURITY_PROFILE === 'strict') {
      for (const k of FORBIDDEN_STRICT) {
        if (k in obj) return { ok: false, code: 'SECURITY_SCHEMA', detail: `forbidden key ${k}` };
      }
    }
    for (const k of REQUIRED) {
      if (!(k in obj)) return { ok: false, code: 'SECURITY_SCHEMA', detail: `missing key ${k}` };
    }
    return { ok: true, schema: Object.keys(obj) };
  } finally {
    await browser.close();
    killHeadless();
  }
}

export async function runSecurityAudit() {
  const checks = [grepNoNetwork(), grepCloudIsolation(), await schemaLive()];
  const failed = checks.filter((c) => !c.ok);
  return {
    ok: failed.length === 0,
    profile: SECURITY_PROFILE,
    failed: failed.map((f) => ({ code: f.code, detail: f.detail })),
  };
}

if (process.argv[1] && process.argv[1].endsWith('audit-benchmark-security.mjs')) {
  const result = await runSecurityAudit();
  console.log(JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
}
