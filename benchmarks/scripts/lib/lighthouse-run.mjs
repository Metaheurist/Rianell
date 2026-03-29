import { launch as launchChrome } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const FLAGS = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];

function medianOf(nums) {
  const vals = nums.filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * @param {string} url
 * @param {number} [runs=3]
 * @returns {Promise<{ median: Record<string, number|null>, runs: Record<string, number|null>[] }>}
 */
export async function lighthouseMedian(url, runs = 3) {
  const chrome = await launchChrome({ chromeFlags: FLAGS });
  try {
    const port = chrome.port;
    const batch = [];
    for (let i = 0; i < runs; i++) {
      const opts = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port,
        settings: {
          formFactor: 'desktop',
          screenEmulation: { disabled: true },
          throttlingMethod: 'provided',
        },
      };
      const result = await lighthouse(url, opts);
      const audits = result?.lhr?.audits ?? {};
      const fcp = audits['first-contentful-paint']?.numericValue;
      const lcp = audits['largest-contentful-paint']?.numericValue;
      const tbt = audits['total-blocking-time']?.numericValue;
      const cls = audits['cumulative-layout-shift']?.numericValue;
      const si = audits['speed-index']?.numericValue;
      const tti = audits['interactive']?.numericValue;
      batch.push({
        FCP_ms: fcp != null ? Math.round(fcp) : null,
        LCP_ms: lcp != null ? Math.round(lcp) : null,
        TBT_ms: tbt != null ? Math.round(tbt) : null,
        CLS: cls != null ? Number(cls.toFixed(4)) : null,
        SpeedIndex_ms: si != null ? Math.round(si) : null,
        TTI_ms: tti != null ? Math.round(tti) : null,
      });
    }

    const median = {};
    for (const k of Object.keys(batch[0])) {
      const m = medianOf(batch.map((r) => r[k]));
      if (k === 'CLS' && m != null) median[k] = Number(m.toFixed(4));
      else if (m != null) median[k] = Math.round(m);
      else median[k] = null;
    }
    return { median, runs: batch };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* Windows can throw EPERM cleaning chrome-launcher temp dirs */
    }
  }
}
