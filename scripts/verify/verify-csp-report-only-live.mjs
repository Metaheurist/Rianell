#!/usr/bin/env node
/**
 * Warn when live site sends a narrow Content-Security-Policy-Report-Only header
 * that conflicts with apps/pwa-webapp/index.html meta CSP (console noise + future break risk).
 *
 * Env:
 *   CSP_LIVE_URL — default https://rianell.com
 *   SKIP_CSP_LIVE — set to 1 to skip (offline / agentic)
 *   CSP_LIVE_STRICT — set to 1 to hard-fail on narrow Report-Only (opt-in)
 *
 * Cloudflare unavailable (network error, timeout, non-2xx) always skips with exit 0.
 * Narrow Report-Only warns and exits 0 unless CSP_LIVE_STRICT=1.
 */
const liveUrl = process.env.CSP_LIVE_URL || 'https://rianell.com';
const strict = process.env.CSP_LIVE_STRICT === '1';

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

function skipUnavailable(reason) {
  console.warn(
    'verify-csp-report-only-live: Cloudflare/live edge unavailable — skipped (not an error):',
    reason,
  );
  process.exit(0);
}

async function main() {
  let res;
  try {
    res = await fetch(liveUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } catch (e) {
    skipUnavailable(e && e.message ? e.message : String(e));
  }

  if (!res.ok) {
    skipUnavailable(`HTTP ${res.status} from ${liveUrl}`);
  }

  const reportOnly = res.headers.get('content-security-policy-report-only');
  if (!reportOnly) {
    console.log('verify-csp-report-only-live: OK (no Report-Only CSP header on', liveUrl + ')');
    return;
  }
  if (isNarrowReportOnlyPolicy(reportOnly)) {
    const msg =
      'verify-csp-report-only-live: narrow Content-Security-Policy-Report-Only on ' +
      liveUrl +
      ' — remove or align with apps/pwa-webapp/index.html (see security/cloudflare-headers-recommended.md)';
    const headerLine =
      '  header: ' + reportOnly.slice(0, 240) + (reportOnly.length > 240 ? '…' : '');
    if (strict) {
      console.error(msg);
      console.error(headerLine);
      process.exit(1);
    }
    console.warn(msg);
    console.warn(headerLine);
    console.warn(
      'verify-csp-report-only-live: advisory (not an error; set CSP_LIVE_STRICT=1 to hard-fail)',
    );
    return;
  }
  console.log('verify-csp-report-only-live: OK (Report-Only CSP present but not narrow)');
}

main().catch((e) => {
  skipUnavailable(e && e.message ? e.message : String(e));
});
