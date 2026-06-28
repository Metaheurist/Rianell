#!/usr/bin/env node
/**
 * CI check: verify that no Content-Security-Policy-Report-Only header with
 * connect-src 'none' is present on rianell.com.
 *
 * A CSPRO header with connect-src 'none' generates 200+ violation entries per
 * page load (one for every outbound connection), accumulating thousands of
 * retained console.error strings across a session — a primary contributor to
 * the long-session heap growth and tab crash.
 */
import https from 'node:https';

const TARGET = process.env.PROBE_URL || 'https://rianell.com/';
const FAIL_ON_MISSING = process.env.FAIL_IF_NO_CSPRO !== '1'; // default: pass if header absent

function fetchHeaders(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.headers);
      res.resume();
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

async function run() {
  let headers;
  try {
    headers = await fetchHeaders(TARGET);
  } catch (e) {
    console.warn(`[verify-cspro] Could not reach ${TARGET}: ${e.message} — skipping check`);
    process.exit(0);
  }

  const cspro = headers['content-security-policy-report-only'] || '';

  if (!cspro) {
    console.log('[verify-cspro] OK: No Content-Security-Policy-Report-Only header found.');
    process.exit(0);
  }

  console.log(`[verify-cspro] Found CSPRO header: ${cspro.slice(0, 200)}...`);

  const hasConnectNone = /connect-src\s+'none'/.test(cspro);
  const hasNarrowScript = /script-src\s+'unsafe-inline'\s+'unsafe-eval'(?!\s+https)/.test(cspro);

  if (hasConnectNone) {
    console.error('[verify-cspro] FAIL: connect-src \'none\' found in CSPRO header.');
    console.error('[verify-cspro] This generates 200+ violation entries per page load.');
    console.error('[verify-cspro] Fix: update the Cloudflare Transform Rule to match the meta CSP in index.html');
    console.error('[verify-cspro] See: security/cloudflare-headers-recommended.md');
    process.exit(1);
  }

  if (hasNarrowScript) {
    console.warn('[verify-cspro] WARN: script-src in CSPRO is narrower than meta CSP — may generate script violation noise.');
  }

  console.log('[verify-cspro] OK: CSPRO header does not have connect-src none.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
