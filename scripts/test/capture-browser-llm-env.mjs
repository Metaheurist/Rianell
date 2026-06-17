#!/usr/bin/env node
/**
 * Capture browser LLM environment (WebGPU, WebNN, ORT vendor, activeBackend) via Playwright.
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
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => {
    console.warn('page.goto failed (server may be down):', e.message);
  });
  const env = await page.evaluate(async () => {
    var gpu = null;
    var adapterInfo = null;
    try {
      if (navigator.gpu && navigator.gpu.requestAdapter) {
        var adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        gpu = { webgpu: !!adapter };
        if (adapter && adapter.info) {
          adapterInfo = {
            vendor: adapter.info.vendor || null,
            architecture: adapter.info.architecture || null,
            device: adapter.info.device || null,
          };
        }
      }
    } catch (e) {
      gpu = { webgpu: false, error: String(e.message || e) };
    }
    var webnn = null;
    try {
      webnn = {
        navigatorMl: typeof navigator.ml !== 'undefined',
        createContext: !!(navigator.ml && typeof navigator.ml.createContext === 'function'),
      };
    } catch (e) {
      webnn = { error: String(e.message || e) };
    }
    var vendorRequests = [];
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      performance.getEntriesByType('resource').forEach(function (entry) {
        var n = entry.name || '';
        if (/vendor\/transformers|transformers\.min|ort-wasm|huggingface\.co/i.test(n)) {
          vendorRequests.push({ name: n, duration: entry.duration });
        }
      });
    }
    var modelStatus = null;
    if (typeof window.getAiModelStatus === 'function') {
      try { modelStatus = window.getAiModelStatus(); } catch (e) {}
    }
    return {
      userAgent: navigator.userAgent,
      deviceMemory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      webgpu: gpu,
      webgpuAdapterInfo: adapterInfo,
      webnn: webnn,
      sessionWebGpuCache: (function () {
        try { return sessionStorage.getItem('rianell.webgpu.adapterOk'); } catch (e) { return null; }
      })(),
      gpuPipelineFail: (function () {
        try { return sessionStorage.getItem('rianell.llm.gpuPipelineFail'); } catch (e) { return null; }
      })(),
      vendorRequests: vendorRequests.slice(0, 20),
      activeBackend: modelStatus && modelStatus.activeBackend ? modelStatus.activeBackend : null,
      activeEngine: modelStatus && modelStatus.activeEngine ? modelStatus.activeEngine : null,
      ts: Date.now(),
    };
  });
  writeFileSync(outPath, JSON.stringify(env, null, 2));
  console.log('Wrote', outPath);
} finally {
  await browser.close();
}
