#!/usr/bin/env node
/**
 * Benchmark the on-device LLM shortlist through the real PWA worker
 * (workers/llm-worker.js + modules/llm-worker-client.js) in Chromium.
 *
 * Usage (serve apps/pwa-webapp first, e.g. on :8765):
 *   node scripts/models/benchmark-llm-shortlist.mjs [--base=http://127.0.0.1:8765/]
 *     [--models=qwen3.5-0.8b,lfm2.5-1.2b] [--devices=webgpu,wasm] [--out=docs/research/llm-shortlist-benchmark-2026-10.json]
 *   node scripts/models/benchmark-llm-shortlist.mjs --dry-run
 *
 * WebGPU runs use a headed browser (headless Chromium has no adapter on Windows).
 * WASM runs are single-threaded, like the installed PWA without cross-origin isolation,
 * and stand in for phones (expect phones to be several times slower).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const SHORTLIST = [
  {
    slug: 'qwen2.5-0.5b',
    id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    revision: 'cc5cc01a65cc3ff17bdb73a7de33d879f62599b0',
    licence: 'apache-2.0',
    role: 'baseline (current small tier)',
    variants: [{ device: 'webgpu', dtype: 'q4f16', mb: 461 }, { device: 'wasm', dtype: 'q4', mb: 750 }],
  },
  {
    slug: 'qwen3.5-0.8b',
    id: 'onnx-community/Qwen3.5-0.8B-Text-ONNX',
    revision: '1e45daba048899e7f771657ada617ec49350aa91',
    licence: 'apache-2.0',
    role: 'small tier candidate',
    thinking: true,
    // The q4 graph uses GatherBlockQuantized, which the ORT WASM backend does not implement.
    variants: [{ device: 'webgpu', dtype: 'q4f16', mb: 448 }, { device: 'wasm', dtype: 'quantized', mb: 895 }],
  },
  {
    slug: 'lfm2.5-1.2b',
    id: 'LiquidAI/LFM2.5-1.2B-Instruct-ONNX',
    revision: '10f72e70abf67ac0fd7ebf15bc5854726891d864',
    licence: 'lfm1.0 (other)',
    role: 'small/large tier candidate (licence review required)',
    variants: [{ device: 'webgpu', dtype: 'q4f16', mb: 725 }, { device: 'wasm', dtype: 'q4', mb: 811 }],
  },
  {
    slug: 'qwen3.5-2b',
    id: 'onnx-community/Qwen3.5-2B-ONNX',
    revision: 'b1fc7ca3afafcb8e4b13d29715a6b9ea5af1d1cb',
    licence: 'apache-2.0',
    role: 'large tier candidate',
    thinking: true,
    variants: [{ device: 'webgpu', dtype: { embed_tokens: 'q4f16', decoder_model_merged: 'q4f16' }, mb: 1320 }],
  },
  {
    slug: 'qwen3.5-2b-opt',
    id: 'onnx-community/Qwen3.5-2B-ONNX-OPT',
    revision: '2ea7886f48b926aca97de8b0e041ffca7e3ebaa9',
    licence: 'apache-2.0 (base model)',
    role: 'large tier candidate (graph-optimised export)',
    thinking: true,
    variants: [{ device: 'webgpu', dtype: { embed_tokens: 'q4f16', decoder_model_merged: 'q4f16' }, mb: 1318 }],
  },
  {
    slug: 'gemma-4-e2b',
    id: 'onnx-community/gemma-4-E2B-it-qat-mobile-ONNX',
    revision: '5cd5514efd375abf2801c856a3936b259cc00133',
    licence: 'apache-2.0',
    role: 'large tier candidate (WebGPU only, q2f16)',
    variants: [{ device: 'webgpu', dtype: { embed_tokens: 'q2f16', decoder_model_merged: 'q2f16' }, mb: 2185 }],
  },
];

const PACK = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/pwa-webapp/i18n-packs/prompt-packs/v1/en-GB.json'), 'utf8')).strings;

/** Same prompts the app sends (summary-llm.js prompt builders, en-GB pack). */
export const TASKS = [
  { kind: 'motd', system: PACK['motd.system'], user: PACK['motd.user'] + ' Theme: drinking water.', max: 40 },
  { kind: 'motd', system: PACK['motd.system'], user: PACK['motd.user'] + ' Theme: a calm bedtime routine.', max: 40 },
  { kind: 'motd', system: PACK['motd.system'], user: PACK['motd.user'] + ' Theme: a short walk outside.', max: 40 },
  {
    kind: 'chat',
    system: PACK['healthChat.system'],
    user: 'Health log context (last 7 days): average sleep 6.4 hours; lowest 5 hours on Tuesday; mood average 6/10; steps average 7,200.\nUser question: How did my sleep look this week?',
    expect: /6\.4|5 hours|Tuesday/i,
    max: 160,
  },
  {
    kind: 'chat',
    system: PACK['healthChat.system'],
    user: 'Health log context (last 30 days): flare days 4 (down from 7 last month); fatigue average 5/10; hydration logged on 21 days.\nUser question: Are my flares getting better?',
    expect: /4|7|flare/i,
    max: 160,
  },
  {
    kind: 'summary',
    system: PACK['summary.system'],
    user: 'Data: Range: last 30 days. HEADLINE: Sleep improved from 6.1 to 6.9 hours on average. Mood was higher on days with more than 7,000 steps. ACTION: Keep a consistent bedtime this week.',
    expect: /6\.9|sleep/i,
    max: 120,
  },
];

const MOTD_BLOCKLIST_RE = /\b(users?|devices?|alarms?|passwords?|log\s?in|login|account|click|tap|button|settings?|website|browser|android|iphone|ios|alexa|google|siri|according to|the answer|years? old|per cent|percent|app is helpful)\b/i;
const MOTD_RELEVANCE_RE = /\b(water|sleep|walk|stretch|breathe|breath|food|eat|meal|rest|sunlight|sun|fresh air|move|movement|steps|hydrat|calm|gentle|balance|health|well|body|mind|stress|pause|quiet|nature|outdoor|warm|cool|light|day|morning|evening|night|energy|recover|repair|kind|simple|small|daily|habit|care|self)\b/i;

/** Quality checks mirroring the app's acceptance rules for each feature. */
function isRepetitive(text) {
  const lines = text.split(/\n+/).map((l) => l.trim().toLowerCase()).filter(Boolean);
  const lineCounts = {};
  for (const l of lines) if ((lineCounts[l] = (lineCounts[l] || 0) + 1) >= 3) return true;
  const words = text.toLowerCase().split(/[^a-z0-9/.]+/).filter(Boolean);
  const grams = {};
  for (let i = 0; i + 2 < words.length; i++) {
    const g = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
    if ((grams[g] = (grams[g] || 0) + 1) >= 3) return true;
  }
  return /(\b\w+\b)(?:[\s,]+\1\b){3,}/i.test(text);
}

export function scoreOutput(task, text) {
  const t = String(text || '').trim();
  const issues = [];
  const words = t.split(/\s+/).filter(Boolean).length;
  if (!t) issues.push('empty');
  if (/<\/?think>/i.test(t)) issues.push('thinking-leak');
  if (t && isRepetitive(t)) issues.push('repetitive');
  const promptHead = String(task.user || '').slice(0, 24).toLowerCase();
  if (promptHead && t.toLowerCase().includes(promptHead)) issues.push('echoes-prompt');
  if (task.kind === 'motd') {
    if (words > 24) issues.push('too-long');
    if (/\d/.test(t) || MOTD_BLOCKLIST_RE.test(t) || !MOTD_RELEVANCE_RE.test(t)) issues.push('rejected-by-motd-filter');
  } else {
    const sentences = t.split(/[.!?]+\s/).filter((s) => s.trim()).length;
    if (sentences > 4 || words > 90) issues.push('too-long');
    if (task.expect && !task.expect.test(t)) issues.push('not-grounded');
    if (/as an ai|i am an ai|consult (a|your) (doctor|healthcare provider)|contact your healthcare provider/i.test(t)) issues.push('boilerplate');
  }
  return { ok: issues.length === 0, issues };
}

function parseArgs(argv) {
  const args = { base: 'http://127.0.0.1:8765/', models: null, devices: null, out: 'docs/research/llm-shortlist-benchmark-2026-10.json', dryRun: false };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--base=')) args.base = a.slice(7).replace(/\/?$/, '/');
    else if (a.startsWith('--models=')) args.models = a.slice(9).split(',');
    else if (a.startsWith('--devices=')) args.devices = a.slice(10).split(',');
    else if (a.startsWith('--out=')) args.out = a.slice(6);
  }
  return args;
}

export function planRuns(args) {
  const runs = [];
  for (const m of SHORTLIST) {
    if (args.models && !args.models.includes(m.slug)) continue;
    for (const v of m.variants) {
      if (args.devices && !args.devices.includes(v.device)) continue;
      runs.push({ model: m, variant: v });
    }
  }
  return runs;
}

async function runInPage(page, base, model, variant) {
  return page.evaluate(async ({ base, model, variant, tasks }) => {
    if (!window.RianellLlmWorkerClient) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = base + 'modules/llm-worker-client.js';
        s.onload = res;
        s.onerror = () => rej(new Error('worker client script failed to load'));
        document.head.appendChild(s);
      });
    }
    const client = window.RianellLlmWorkerClient.createLlmWorkerClient({ workerUrl: base + 'workers/llm-worker.js' });
    const result = { loadMs: null, error: null, outputs: [] };
    const t0 = performance.now();
    try {
      await client.load({
        modelId: model.id,
        revision: model.revision,
        device: variant.device,
        dtype: variant.dtype,
        runtimeUrl: base + 'vendor/transformers/transformers.min.js',
        wasmBase: base + 'vendor/transformers/',
        remoteHost: 'https://huggingface.co/',
        useBrowserCache: true,
      }, () => {});
      result.loadMs = Math.round(performance.now() - t0);
      for (const task of tasks) {
        const messages = [{ role: 'system', content: task.system }, { role: 'user', content: task.user }];
        const opts = { max_new_tokens: task.max, do_sample: false };
        if (model.thinking) opts.tokenizer_encode_kwargs = { enable_thinking: false };
        const g0 = performance.now();
        const out = await client.generate(messages, opts);
        const ms = Math.round(performance.now() - g0);
        const gt = out && out[0] && out[0].generated_text;
        const text = Array.isArray(gt) ? String((gt[gt.length - 1] || {}).content || '') : String(gt || '');
        result.outputs.push({ kind: task.kind, ms, text: text.trim() });
      }
    } catch (e) {
      result.error = String((e && e.message) || e).slice(0, 300);
    } finally {
      client.terminate('benchmark done');
    }
    return result;
  }, { base, model: { id: model.id, revision: model.revision, thinking: !!model.thinking }, variant, tasks: TASKS.map(({ expect, ...t }) => t) });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runs = planRuns(args);
  if (args.dryRun) {
    for (const r of runs) console.log(`PLAN ${r.model.slug} ${r.variant.device} ${JSON.stringify(r.variant.dtype)} ~${r.variant.mb} MB`);
    return;
  }
  const { chromium } = await import('playwright');
  const profileDir = path.join(os.tmpdir(), 'rianell-llm-benchmark-profile');
  const ctx = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    args: ['--enable-unsafe-webgpu', '--enable-features=WebGPU'],
    viewport: { width: 900, height: 600 },
  });
  const results = [];
  const outPath = path.resolve(ROOT, args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  let adapter = null;
  const writeResults = () => {
    fs.writeFileSync(outPath, JSON.stringify({ ranAt: new Date().toISOString(), adapter, results }, null, 2) + '\n');
  };
  const openPage = async () => {
    const page = await ctx.newPage();
    await page.goto(args.base + 'privacy.html', { waitUntil: 'load', timeout: 60000 });
    return page;
  };
  try {
    const probe = await openPage();
    adapter = await probe.evaluate(async () => {
      const a = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
      return a ? `${a.info?.vendor || '?'} ${a.info?.architecture || ''}`.trim() : null;
    });
    await probe.close();
    for (const { model, variant } of runs) {
      if (variant.device === 'webgpu' && !adapter) {
        results.push({ model: model.slug, device: variant.device, skipped: 'no WebGPU adapter' });
        continue;
      }
      console.log(`RUN ${model.slug} ${variant.device} ${JSON.stringify(variant.dtype)}`);
      // A fresh page per run releases GPU memory, and a renderer crash only loses that run.
      let r;
      const page = await openPage();
      try {
        r = await runInPage(page, args.base, model, variant);
      } catch (e) {
        r = { loadMs: null, outputs: [], error: 'page crashed: ' + String((e && e.message) || e).slice(0, 200) };
      } finally {
        await page.close().catch(() => {});
      }
      const scored = r.outputs.map((o, i) => Object.assign(o, scoreOutput(TASKS[i], o.text)));
      const passed = scored.filter((o) => o.ok).length;
      const gen = scored.map((o) => o.ms);
      const summary = {
        model: model.slug,
        id: model.id,
        revision: model.revision,
        licence: model.licence,
        device: variant.device,
        dtype: variant.dtype,
        downloadMb: variant.mb,
        loadMs: r.loadMs,
        medianGenerateMs: gen.length ? gen.slice().sort((a, b) => a - b)[Math.floor(gen.length / 2)] : null,
        quality: `${passed}/${TASKS.length}`,
        error: r.error,
        outputs: scored,
      };
      console.log(`  load=${summary.loadMs}ms medianGen=${summary.medianGenerateMs}ms quality=${summary.quality}${r.error ? ' error=' + r.error : ''}`);
      results.push(summary);
      writeResults();
    }
    writeResults();
    console.log(`wrote ${path.relative(ROOT, outPath)}`);
  } finally {
    await ctx.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
