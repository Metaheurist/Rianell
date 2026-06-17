#!/usr/bin/env node
/**
 * WebNN availability smoke via Playwright (Stage 9).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = (process.env.PROBE_URL || 'http://127.0.0.1:8080/').replace(/\/?$/, '/');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outPath = join(root, 'audit-history', 'webnn-probe.json');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  const result = await page.evaluate(() => ({
    navigatorMl: typeof navigator.ml !== 'undefined',
    createContext: !!(navigator.ml && typeof navigator.ml.createContext === 'function'),
    userAgent: navigator.userAgent,
  }));
  mkdirSync(join(root, 'audit-history'), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ ...result, ts: Date.now() }, null, 2));
  console.log('WebNN probe:', result);
  console.log('Wrote', outPath);
} finally {
  await browser.close();
}
