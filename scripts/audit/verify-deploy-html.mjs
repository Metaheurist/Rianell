/**
 * Verify deploy HTML serves fingerprinted app.*.min.js.
 * CI post-deploy: set PROBE_URL=http://127.0.0.1:9876/ (same site/ as GitHub Pages, local server).
 * Manual prod check: omit PROBE_URL — uses VERIFY_URLS (default rianell.com + github.io).
 */
import { chromium } from 'playwright';

const pattern = /app\.[a-f0-9]+\.min\.js/;
const preloadRe = /<link\s+[^>]*rel="preload"[^>]*href="([^"]*app\.[a-f0-9]+\.min\.js)"[^>]*>/i;
const preloadAltRe = /<link\s+[^>]*rel="preload"[^>]*as="script"[^>]*href="([^"]*app\.[a-f0-9]+\.min\.js)"[^>]*>/i;
const scriptRe = /<script\s+[^>]*src="([^"]*app\.[a-f0-9]+\.min\.js)"[^>]*><\/script>/i;

function hasAnonymousCrossorigin(tagHtml) {
  return /\scrossorigin="anonymous"/i.test(tagHtml);
}

function findPreloadTag(html) {
  return html.match(preloadRe) || html.match(preloadAltRe);
}

function urlsToCheck() {
  if (process.env.PROBE_URL) {
    return [process.env.PROBE_URL.replace(/\/?$/, '/')];
  }
  return (process.env.VERIFY_URLS || 'https://rianell.com/,https://metaheurist.github.io/Rianell/')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const urls = urlsToCheck();
const localProbe = Boolean(process.env.PROBE_URL);
const attempts = Number(process.env.VERIFY_ATTEMPTS || (localProbe ? 1 : 10));
const delayMs = Number(process.env.VERIFY_DELAY_MS || (localProbe ? 0 : 20000));
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36';

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage', '--no-sandbox'],
});
const page = await browser.newContext({
  userAgent: CHROME_UA,
  viewport: { width: 1280, height: 720 },
}).then((ctx) => ctx.newPage());
try {
  for (let i = 1; i <= attempts; i++) {
    for (const url of urls) {
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const status = resp ? resp.status() : 0;
        const html = await page.content();
        if (pattern.test(html)) {
          const preload = findPreloadTag(html);
          const script = html.match(scriptRe);
          if (!preload || !script) throw new Error('Deploy HTML missing preload or script tag for app bundle');
          if (!hasAnonymousCrossorigin(preload[0]) || !hasAnonymousCrossorigin(script[0])) {
            throw new Error('Deploy HTML missing crossorigin=\"anonymous\" on preload/script app bundle tags');
          }
          console.log(`Deploy HTML contains fingerprinted app bundle (${url}, status=${status})`);
          process.exit(0);
        }
        console.log(`${url} status=${status} — fingerprint not found yet`);
      } catch (err) {
        console.warn(`${url} attempt ${i}:`, err.message);
      }
    }
    if (i < attempts && delayMs > 0) {
      console.log(`Waiting for Pages HTML (${i}/${attempts})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.error('Deploy HTML missing app.<hash>.min.js');
  process.exit(1);
} finally {
  await browser.close();
}
