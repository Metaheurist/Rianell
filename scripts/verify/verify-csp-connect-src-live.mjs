#!/usr/bin/env node
/**
 * Fail when the live site HTTP Content-Security-Policy connect-src omits hosts
 * required by the PWA (meta CSP in index.html). Browsers apply meta + HTTP CSP together.
 *
 * Env:
 *   CSP_LIVE_URL — default https://rianell.com
 *   SKIP_CSP_LIVE — set to 1 to skip (offline CI)
 */
const liveUrl = process.env.CSP_LIVE_URL || 'https://rianell.com';

const REQUIRED_CONNECT_HOSTS = [
  'https://api.open-meteo.com',
  'https://air-quality-api.open-meteo.com',
  'https://raw.githubusercontent.com',
  'https://world.openfoodfacts.org',
  'https://web-sdk.smartlook.com',
  'https://*.smartlook.com',
  'https://*.smartlook.cloud',
];

if (process.env.SKIP_CSP_LIVE === '1') {
  console.log('verify-csp-connect-src-live: skipped (SKIP_CSP_LIVE=1)');
  process.exit(0);
}

function connectSrcFromPolicy(policy) {
  if (!policy || typeof policy !== 'string') return '';
  const match = policy.match(/connect-src\s+([^;]+)/i);
  return match ? match[1] : '';
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

  const enforced = res.headers.get('content-security-policy');
  if (!enforced) {
    console.log(
      'verify-csp-connect-src-live: OK (no enforced HTTP CSP on',
      liveUrl + ' — meta tag only)',
    );
    return;
  }

  const connectSrc = connectSrcFromPolicy(enforced);
  const missing = REQUIRED_CONNECT_HOSTS.filter((host) => !connectSrc.includes(host));
  if (missing.length === 0) {
    console.log('verify-csp-connect-src-live: OK (HTTP connect-src includes required hosts)');
    return;
  }

  console.error(
    'verify-csp-connect-src-live: HTTP Content-Security-Policy on',
    liveUrl,
    'is missing connect-src hosts required by the PWA:',
  );
  for (const host of missing) {
    console.error('  -', host);
  }
  console.error(
    '  Update Cloudflare Transform Rules (or remove duplicate HTTP CSP). See security/cloudflare-headers-recommended.md',
  );
  process.exit(1);
}

main().catch((e) => {
  console.warn('verify-csp-connect-src-live: fetch failed (non-fatal):', e && e.message ? e.message : e);
  process.exit(0);
});
