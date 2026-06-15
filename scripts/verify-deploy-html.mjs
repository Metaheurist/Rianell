/**
 * Verify GitHub Pages deploy serves fingerprinted app.*.min.js (CI post-deploy gate).
 * Uses Playwright — curl from GHA runners gets 403 from Cloudflare on rianell.com.
 */
import { chromium } from 'playwright';

const urls = (process.env.VERIFY_URLS || 'https://rianell.com/,https://metaheurist.github.io/Rianell/')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const attempts = Number(process.env.VERIFY_ATTEMPTS || 10);
const delayMs = Number(process.env.VERIFY_DELAY_MS || 20000);
const pattern = /app\.[a-f0-9]+\.min\.js/;

const browser = await chromium.launch();
const page = await browser.newPage();
try {
  for (let i = 1; i <= attempts; i++) {
    for (const url of urls) {
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const status = resp ? resp.status() : 0;
        if (status > 0 && status < 400) {
          const html = await page.content();
          if (pattern.test(html)) {
            console.log(`Deploy HTML contains fingerprinted app bundle (${url})`);
            process.exit(0);
          }
        }
        console.log(`${url} status=${status} — fingerprint not found yet`);
      } catch (err) {
        console.warn(`${url} attempt ${i}:`, err.message);
      }
    }
    if (i < attempts) {
      console.log(`Waiting for Pages HTML (${i}/${attempts})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.error('Deploy HTML missing app.<hash>.min.js');
  process.exit(1);
} finally {
  await browser.close();
}
