import { getChromium } from '@rianell/build-tools/probe-utils';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const url = process.env.PROBE_URL || 'http://127.0.0.1:8080/#home';
const outDir = path.dirname(fileURLToPath(import.meta.url));
const chromium = await getChromium();
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
const consoleLines = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => consoleLines.push(`[${m.type()}] ${m.text().slice(0, 300)}`));

let status = null;
try {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  status = resp?.status() ?? null;
} catch (e) {
  console.log(JSON.stringify({ fail: 'goto', message: e.message }, null, 2));
  await browser.close();
  process.exit(1);
}

await page.waitForTimeout(3000);
const snap = await page.evaluate(() => {
  const overlay = document.getElementById('loadingOverlay');
  const gate = document.getElementById('privacyRegionGateOverlay');
  const shell = document.getElementById('appShell');
  const oStyle = overlay ? getComputedStyle(overlay) : null;
  const gStyle = gate ? getComputedStyle(gate) : null;
  const sStyle = shell ? getComputedStyle(shell) : null;
  return {
    title: document.title,
    bodyClass: document.body?.className || '',
    loaded: document.body?.classList.contains('loaded'),
    privacyGate: document.body?.classList.contains('privacy-gate-active'),
    boot: !!window.__rianellBootAfterDomStarted,
    init: !!window.__rianellAppInitStarted,
    loadingClass: overlay?.className || null,
    loadingDisplay: oStyle?.display || null,
    loadingVis: oStyle?.visibility || null,
    loadingOpacity: oStyle?.opacity || null,
    gateDisplay: gate?.style?.display || gStyle?.display || null,
    gateVis: gStyle?.visibility || null,
    shellVis: sStyle?.visibility || null,
    shellOpacity: sStyle?.opacity || null,
    mainStylesheet: !!document.getElementById('mainStylesheet'),
    stylesToken: getComputedStyle(document.documentElement).getPropertyValue('--rianell-styles').trim(),
    appScript: document.querySelector('script[src*="app.js"]')?.getAttribute('src') || null,
    appScriptType: document.querySelector('script[src*="app.js"]')?.getAttribute('type') || null,
    visibleText: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 200) || '',
  };
});

await page.screenshot({ path: path.join(outDir, 'local-preview-screenshot.png') });
console.log(JSON.stringify({ status, snap, errors, console: consoleLines.slice(0, 15) }, null, 2));
await browser.close();
