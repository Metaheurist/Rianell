#!/usr/bin/env node
/**
 * Resume-safe Ollama queue: one prompt → one SVG/anim per register entry.
 *
 * Usage:
 *   node scripts/dev/visual-gen-queue.mjs              # process pending
 *   node scripts/dev/visual-gen-queue.mjs --status
 *   node scripts/dev/visual-gen-queue.mjs --limit=20
 *   node scripts/dev/visual-gen-queue.mjs --kinds=sprite,avatar
 *   node scripts/dev/visual-gen-queue.mjs --force-failed
 *   node scripts/dev/visual-gen-queue.mjs --reset-completed   # wipe checkpoint; redo all non-skip
 *
 * Env: OLLAMA_HOST, OLLAMA_MODEL (default qwen3.6:35b), VISUAL_GEN_CONCURRENCY (default 2)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Agent, setGlobalDispatcher } from 'undici';
import { THEME_FX_TOKENS } from '@rianell/tokens';

// MoE first-load + long SVG gens need generous undici timeouts
setGlobalDispatcher(new Agent({
  headersTimeout: 30 * 60 * 1000,
  bodyTimeout: 30 * 60 * 1000,
  connectTimeout: 60 * 1000,
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
const artRoot = path.join(root, 'artifacts/visual-gen');
const checkpointPath = path.join(artRoot, 'checkpoint.json');

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'qwen3.6:35b';
const CONCURRENCY = Math.max(1, Number(process.env.VISUAL_GEN_CONCURRENCY || 1));

const args = process.argv.slice(2);
const statusOnly = args.includes('--status');
const forceFailed = args.includes('--force-failed');
const resetCompleted = args.includes('--reset-completed');
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const kindsArg = args.find((a) => a.startsWith('--kinds='));
const KIND_FILTER = kindsArg
  ? new Set(kindsArg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean))
  : null;

function loadRegister() {
  if (!fs.existsSync(registerPath)) {
    throw new Error('visual-register.json missing — run npm run visual:register first');
  }
  return JSON.parse(fs.readFileSync(registerPath, 'utf8'));
}

function loadCheckpoint() {
  if (!fs.existsSync(checkpointPath)) return { completed: {}, failed: {}, updatedAt: null };
  try {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
  } catch {
    return { completed: {}, failed: {}, updatedAt: null };
  }
}

function saveCheckpoint(cp) {
  fs.mkdirSync(artRoot, { recursive: true });
  cp.updatedAt = new Date().toISOString();
  fs.writeFileSync(checkpointPath, JSON.stringify(cp, null, 2) + '\n');
}

function stripFences(text) {
  let t = String(text || '').trim();
  // Qwen thinking models may leak think blocks into the string
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '');
  t = t.replace(/^```(?:svg|xml|html|css|javascript|js)?\s*/i, '');
  t = t.replace(/\s*```$/i, '');
  return t.trim();
}

/** If the model returns multiple root graphics, keep the first complete unit. */
function extractFirstUnit(text, mode) {
  let t = String(text || '').trim();
  if (mode === 'anim') {
    const m = t.match(/@keyframes\s+[^{\s]+[\s\S]*?(?=@keyframes\s+|$)/i);
    if (m) return m[0].trim();
    return t;
  }
  const svg = t.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/i);
  if (svg) return svg[0].trim();
  const symbol = t.match(/<symbol\b[^>]*>[\s\S]*?<\/symbol>/i);
  if (symbol) return symbol[0].trim();
  // Fragment: take until a second top-level <svg|<symbol or end
  const second = t.search(/<\/(?:svg|symbol)>\s*<(?:svg|symbol)\b/i);
  if (second > 0) {
    const end = t.indexOf('>', second) >= 0 ? t.indexOf('>', second) + 1 : second;
    // cut after first closing tag
    const close = t.search(/<\/(?:svg|symbol)>/i);
    if (close >= 0) return t.slice(0, close + (t.startsWith('<svg') ? 6 : 9)).trim();
  }
  // Prefer inner markup starting at first shape tag
  const shape = t.search(/<(?:g|path|circle|rect|ellipse|polygon|line|polyline)\b/i);
  if (shape > 0) t = t.slice(shape);
  return t.trim();
}

function validateOutput(entry, raw) {
  let text = stripFences(raw);
  if (!text || text.length < 8) return { ok: false, reason: 'empty' };
  if (/<script[\s>]/i.test(text) || /\bon\w+\s*=/i.test(text)) {
    return { ok: false, reason: 'script/handler forbidden' };
  }

  const isAnim = entry.promptMode === 'single-anim' || entry.kind === 'animation' || entry.kind === 'fx';
  text = extractFirstUnit(text, isAnim ? 'anim' : 'svg');

  if (isAnim) {
    if (entry.kind === 'animation' && !/@keyframes\s+/.test(text) && !text.includes('{')) {
      return { ok: false, reason: 'missing keyframes/css' };
    }
    if (text.length > 24_000) return { ok: false, reason: 'anim too large' };
    return { ok: true, text };
  }

  const hasShape = /<(?:svg|symbol|g|path|circle|rect|ellipse|polygon|line|polyline)\b/i.test(text);
  if (!hasShape) return { ok: false, reason: 'no svg shapes' };
  if (text.length > 16_000) return { ok: false, reason: 'svg too large' };
  return { ok: true, text };
}

function buildPrompt(entry) {
  const team = entry.team;
  const tok = team && THEME_FX_TOKENS.teams[team] ? THEME_FX_TOKENS.teams[team] : null;
  const lines = [
    '/no_think',
    'Rianell PWA. Output ONE graphic/anim only. No markdown. No extra icons. No reasoning.',
    `ID=${entry.id} KIND=${entry.kind}${entry.viewBox ? ` VB=${entry.viewBox}` : ''}`,
    tok ? `TEAM=${team} glow=${tok.glow} alt=${tok.particleColorAlt || ''}` : '',
    String(entry.context || '').slice(0, 400),
    'PAYLOAD:',
    String(entry.currentPayload || '').slice(0, 1200),
    entry.promptMode === 'single-anim'
      ? 'Return only the @keyframes block or JS snippet.'
      : 'Return only SVG markup (inner paths/g) for this one id. Prefer path/circle/rect. Keep currentColor/CSS vars.',
  ];
  return lines.filter(Boolean).join('\n');
}

async function ollamaGenerate(prompt, numPredict) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      keep_alive: '60m',
      options: {
        temperature: 0.25,
        num_predict: numPredict,
        num_ctx: Number(process.env.VISUAL_GEN_NUM_CTX || 8192),
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  // Prefer final response; if empty (think-only truncate), fall back carefully
  return String(data.response || '').trim() || String(data.thinking || '').trim();
}

async function processEntry(entry, cp) {
  const outAbs = path.join(root, entry.outputPath);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  const prompt = buildPrompt(entry);
  const numPredict = entry.promptMode === 'single-anim' ? 1200 : 900;
  let lastErr = '';
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const raw = await ollamaGenerate(prompt, numPredict);
      const validated = validateOutput(entry, raw);
      if (!validated.ok) {
        lastErr = validated.reason;
        continue;
      }
      fs.writeFileSync(outAbs, validated.text + '\n', 'utf8');
      cp.completed[entry.id] = {
        at: new Date().toISOString(),
        outputPath: entry.outputPath,
        bytes: Buffer.byteLength(validated.text, 'utf8'),
        attempt,
      };
      delete cp.failed[entry.id];
      saveCheckpoint(cp);
      return { ok: true };
    } catch (err) {
      lastErr = err.message || String(err);
    }
  }
  cp.failed[entry.id] = { at: new Date().toISOString(), reason: lastErr };
  saveCheckpoint(cp);
  return { ok: false, reason: lastErr };
}

async function poolMap(items, concurrency, worker) {
  let idx = 0;
  const results = [];
  async function run() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
  return results;
}

async function main() {
  const register = loadRegister();
  let cp = loadCheckpoint();
  const all = register.entries || [];

  if (statusOnly) {
    const pending = all.filter((e) => e.genStatus !== 'skip' && !cp.completed[e.id] && !cp.failed[e.id]);
    console.log(JSON.stringify({
      total: all.length,
      skip: all.filter((e) => e.genStatus === 'skip').length,
      completed: Object.keys(cp.completed).length,
      failed: Object.keys(cp.failed).length,
      pending: pending.length,
      concurrency: CONCURRENCY,
      model: MODEL,
      updatedAt: cp.updatedAt,
    }, null, 2));
    return;
  }

  if (resetCompleted) {
    const prevDone = Object.keys(cp.completed || {}).length;
    const prevFail = Object.keys(cp.failed || {}).length;
    cp = { completed: {}, failed: {}, updatedAt: null, model: MODEL, resetReason: 'model-switch-redo' };
    saveCheckpoint(cp);
    console.log(`[visual-gen] reset checkpoint (cleared completed=${prevDone} failed=${prevFail}) for model=${MODEL}`);
  }

  let queue = all.filter((e) => e.genStatus !== 'skip');
  if (KIND_FILTER) queue = queue.filter((e) => KIND_FILTER.has(e.kind));
  queue = queue.filter((e) => {
    if (cp.completed[e.id]) return false;
    if (cp.failed[e.id] && !forceFailed && !resetCompleted) return false;
    return true;
  });
  if (Number.isFinite(LIMIT)) queue = queue.slice(0, LIMIT);

  console.log(`[visual-gen] host=${HOST} model=${MODEL} concurrency=${CONCURRENCY} queue=${queue.length}`);
  if (!queue.length) {
    console.log('[visual-gen] nothing to do');
    return;
  }

  let done = 0;
  let failed = 0;
  const t0 = Date.now();
  await poolMap(queue, CONCURRENCY, async (entry) => {
    const res = await processEntry(entry, cp);
    done += 1;
    if (!res.ok) failed += 1;
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`[visual-gen] ${done}/${queue.length} ${res.ok ? 'OK' : 'FAIL'} ${entry.id}${res.ok ? '' : ` (${res.reason})`} ${elapsed}s`);
  });

  // sync genStatus onto register snapshot for humans
  for (const e of register.entries) {
    if (cp.completed[e.id]) e.genStatus = 'done';
    else if (cp.failed[e.id]) e.genStatus = 'failed';
    else if (e.genStatus !== 'skip') e.genStatus = 'pending';
  }
  fs.writeFileSync(registerPath, JSON.stringify(register, null, 2) + '\n');
  console.log(`[visual-gen] finished ok=${done - failed} failed=${failed}`);
}

main().catch((err) => {
  console.error('[visual-gen] fatal', err);
  process.exit(1);
});
