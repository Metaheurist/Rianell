#!/usr/bin/env node
/**
 * Warn when live site sends a narrow Content-Security-Policy-Report-Only header
 * that conflicts with apps/pwa-webapp/index.html meta CSP (console noise + future break risk).
 *
 * Env:
 *   CSP_LIVE_URL — default https://rianell.com
 *   SKIP_CSP_LIVE — set to 1 to skip (offline CI)
 */
const liveUrl = process.env.CSP_LIVE_URL || 'https://rianell.com';

if (process.env.SKIP_CSP_LIVE === '1') {
  console.log('verify-csp-report-only-live: skipped (SKIP_CSP_LIVE=1)');
  process.exit(0);
}

function isNarrowReportOnlyPolicy(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.toLowerCase();
  if (!v.includes('script-src') && !v.includes('connect-src')) return false;
  const missingSelfScript = v.includes('script-src') && !v.includes("'self'");
  const connectNone = /connect-src\s+'none'/i.test(value);
  return missingSelfScript || connectNone;
}

async function main() {
  const res = await fetch(liveUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  const reportOnly = res.headers.get('content-security-policy-report-only');
  if (!reportOnly) {
    console.log('verify-csp-report-only-live: OK (no Report-Only CSP header on', liveUrl + ')');
    return;
  }
  if (isNarrowReportOnlyPolicy(reportOnly)) {
    console.error(
      'verify-csp-report-only-live: narrow Content-Security-Policy-Report-Only on',
      liveUrl,
      '— remove or align with apps/pwa-webapp/index.html (see security/cloudflare-headers-recommended.md)'
    );
    console.error('  header:', reportOnly.slice(0, 240) + (reportOnly.length > 240 ? '…' : ''));
    process.exit(1);
  }
  console.log('verify-csp-report-only-live: OK (Report-Only CSP present but not narrow)');
}

main().catch((e) => {
  console.warn('verify-csp-report-only-live: fetch failed (non-fatal):', e && e.message ? e.message : e);
  process.exit(0);
});
