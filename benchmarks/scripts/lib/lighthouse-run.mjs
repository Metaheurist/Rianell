import { launch as launchChrome } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const FLAGS = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];

/** Per-run hard ceiling — Lighthouse can stall forever waiting for network quiet on SPAs. */
const DEFAULT_RUN_TIMEOUT_MS = 90_000;

function medianOf(nums) {
  const vals = nums.filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

/**
 * @param {string} url
 * @param {number} [runs=3]
 * @returns {Promise<{ median: Record<string, number|null>, runs: Record<string, number|null>[] }>}
 */
export async function lighthouseMedian(url, runs = 3) {
  const runTimeoutMs = Number(process.env.BENCHMARK_LH_RUN_TIMEOUT_MS || DEFAULT_RUN_TIMEOUT_MS);
  console.log(`[benchmarks] lighthouseMedian start url=${url} runs=${runs} timeoutMs=${runTimeoutMs}`);
  const chrome = await launchChrome({ chromeFlags: FLAGS });
  try {
    const port = chrome.port;
    console.log(`[benchmarks] chrome launched port=${port}`);
    const batch = [];
    for (let i = 0; i < runs; i++) {
      const label = `lighthouse run ${i + 1}/${runs}`;
      console.log(`[benchmarks] ${label}…`);
      const opts = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port,
        // Bound wait so SPA/CDN chatter cannot hang the CI job indefinitely.
        maxWaitForLoad: 45_000,
        maxWaitForFcp: 15_000,
        settings: {
          formFactor: 'desktop',
          screenEmulation: { disabled: true },
          throttlingMethod: 'provided',
          maxWaitForLoad: 45_000,
          maxWaitForFcp: 15_000,
        },
      };
      const result = await withTimeout(lighthouse(url, opts), runTimeoutMs, label);
      const audits = result?.lhr?.audits ?? {};
      const fcp = audits['first-contentful-paint']?.numericValue;
      const lcp = audits['largest-contentful-paint']?.numericValue;
      const tbt = audits['total-blocking-time']?.numericValue;
      const cls = audits['cumulative-layout-shift']?.numericValue;
      const si = audits['speed-index']?.numericValue;
      const tti = audits['interactive']?.numericValue;
      const row = {
        FCP_ms: fcp != null ? Math.round(fcp) : null,
        LCP_ms: lcp != null ? Math.round(lcp) : null,
        TBT_ms: tbt != null ? Math.round(tbt) : null,
        CLS: cls != null ? Number(cls.toFixed(4)) : null,
        SpeedIndex_ms: si != null ? Math.round(si) : null,
        TTI_ms: tti != null ? Math.round(tti) : null,
      };
      batch.push(row);
      console.log(`[benchmarks] ${label} done FCP=${row.FCP_ms} LCP=${row.LCP_ms} TBT=${row.TBT_ms}`);
    }

    const median = {};
    for (const k of Object.keys(batch[0])) {
      const m = medianOf(batch.map((r) => r[k]));
      if (k === 'CLS' && m != null) median[k] = Number(m.toFixed(4));
      else if (m != null) median[k] = Math.round(m);
      else median[k] = null;
    }
    console.log('[benchmarks] lighthouseMedian complete');
    return { median, runs: batch };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* Windows can throw EPERM cleaning chrome-launcher temp dirs */
    }
  }
}
