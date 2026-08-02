#!/usr/bin/env node
/**
 * CI / local smoke: pull a tiny Ollama chat model, prove it loads, emit JSON summary.
 *
 * Default model: smollm:135m (~90–100 MB) — under the 200 MB CI budget.
 *
 *   node scripts/ci/agentic-ollama-smoke.mjs
 *   AGENTIC_SMOKE_MODEL=smollm:135m node scripts/ci/agentic-ollama-smoke.mjs
 *
 * Exit 0 = model listed + generate returned text.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const MODEL = process.env.AGENTIC_SMOKE_MODEL || 'smollm:135m';
const MAX_BYTES = Number(process.env.AGENTIC_SMOKE_MAX_BYTES || 220 * 1024 * 1024);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fail(msg, code = 1) {
  console.error(`[agentic-ollama-smoke] ${msg}`);
  process.exit(code);
}

async function waitForOllama(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  fail(`Ollama not reachable at ${HOST}`);
}

async function ensureModel() {
  const ensure = path.join(ROOT, 'scripts/dev/ensure-ollama.mjs');
  const res = spawnSync(process.execPath, [ensure, `--model=${MODEL}`], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) fail(`ensure-ollama failed for ${MODEL}`);
}

async function modelSizeBytes(name) {
  const tags = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(10_000) });
  if (tags.ok) {
    const data = await tags.json();
    const wanted = name.includes(':') ? name : `${name}:latest`;
    const hit = (data.models || []).find((m) => m.name === name || m.name === wanted);
    if (hit && Number.isFinite(Number(hit.size))) return Number(hit.size);
  }
  const res = await fetch(`${HOST}/api/show`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const size = Number(data.size || 0);
  return Number.isFinite(size) && size > 0 ? size : null;
}

async function generateSmoke() {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: 'Reply with exactly: OK',
      stream: false,
      options: { num_predict: 8, temperature: 0 },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    fail(`generate failed HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const text = String(data.response || '').trim();
  if (!text) fail('generate returned empty response');
  return text;
}

async function main() {
  await waitForOllama();
  await ensureModel();

  const size = await modelSizeBytes(MODEL);
  if (size != null && size > MAX_BYTES) {
    fail(`model ${MODEL} is ${size} bytes — over CI budget ${MAX_BYTES}`);
  }

  const reply = await generateSmoke();
  const summary = {
    ok: true,
    host: HOST,
    model: MODEL,
    sizeBytes: size,
    sizeMb: size != null ? Math.round(size / (1024 * 1024)) : null,
    reply: reply.slice(0, 120),
  };
  console.log(JSON.stringify(summary, null, 2));
  console.log(`[agentic-ollama-smoke] READY — loaded ${MODEL}`);
}

main().catch((err) => {
  fail(err?.stack || String(err));
});
