#!/usr/bin/env node
/**
 * Capture browser LLM environment (Chrome UA, deviceMemory, WebGPU cache) via Playwright.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = (process.env.PROBE_URL || 'http://127.0.0.1:8080/').replace(/\/?$/, '/');
const outPath = process.env.CAPTURE_OUT
  || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'audit-history', 'browser-llm-env.json');

const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const env = await page.evaluate(async () => {
    var gpu = null;
    try {
      if (navigator.gpu && navigator.gpu.requestAdapter) {
        var adapter = await navigator.gpu.requestAdapter();
        gpu = { webgpu: !!adapter };
      }
    } catch (e) {
      gpu = { webgpu: false, error: String(e.message || e) };
    }
    return {
      userAgent: navigator.userAgent,
      deviceMemory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      webgpu: gpu,
      sessionWebGpuCache: (function () {
        try { return sessionStorage.getItem('rianell.webgpu.adapterOk'); } catch (e) { return null; }
      })(),
      ts: Date.now(),
    };
  });
  writeFileSync(outPath, JSON.stringify(env, null, 2));
  console.log('Wrote', outPath);
} finally {
  await browser.close();
}
