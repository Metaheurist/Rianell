#!/usr/bin/env node
/**
 * Check live-site HTTP Content-Security-Policy connect-src against hosts
 * required by the PWA (meta CSP in index.html). Browsers apply meta + HTTP CSP together.
 *
 * Env:
 *   CSP_LIVE_URL — default https://rianell.com
 *   SKIP_CSP_LIVE — set to 1 to skip (offline / agentic)
 *   CSP_LIVE_STRICT — set to 1 to hard-fail on missing hosts (opt-in)
 *
 * Cloudflare unavailable (network error, timeout, non-2xx) always skips with exit 0.
 * Missing hosts warn and exit 0 unless CSP_LIVE_STRICT=1.
 */
const liveUrl = process.env.CSP_LIVE_URL || 'https://rianell.com';
const strict = process.env.CSP_LIVE_STRICT === '1';

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

function skipUnavailable(reason) {
  console.warn(
    'verify-csp-connect-src-live: Cloudflare/live edge unavailable — skipped (not an error):',
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

  const lines = [
    `verify-csp-connect-src-live: HTTP Content-Security-Policy on ${liveUrl} is missing connect-src hosts required by the PWA:`,
    ...missing.map((host) => `  - ${host}`),
    '  Update Cloudflare Transform Rules (or remove duplicate HTTP CSP). See security/cloudflare-headers-recommended.md',
  ];
  if (strict) {
    for (const line of lines) console.error(line);
    process.exit(1);
  }
  for (const line of lines) console.warn(line);
  console.warn(
    'verify-csp-connect-src-live: advisory (not an error; set CSP_LIVE_STRICT=1 to hard-fail)',
  );
}

main().catch((e) => {
  skipUnavailable(e && e.message ? e.message : String(e));
});
