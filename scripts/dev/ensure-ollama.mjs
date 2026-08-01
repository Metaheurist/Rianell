#!/usr/bin/env node
/**
 * Preflight for the split-execution harness (.cursor/rules/local-agent-orchestrator.mdc).
 *
 * Guarantees the local "brain" is ready before any agentic task runs:
 *   1. Ping the Ollama daemon at OLLAMA_HOST (default http://localhost:11434).
 *   2. If unreachable, start `ollama serve` detached and wait until it responds.
 *   3. Confirm the target model is present; if missing, `ollama pull` it.
 *
 * Exit 0 => brain is served and the model is available.
 * Exit 1 => could not reach/start Ollama or pull the model.
 *
 * Usage:
 *   node scripts/dev/ensure-ollama.mjs                 # uses default model
 *   node scripts/dev/ensure-ollama.mjs qwen3.6:35b
 *   node scripts/dev/ensure-ollama.mjs --model=qwen2.5-coder:32b
 *   node scripts/dev/ensure-ollama.mjs --pack=security
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const SERVE_TIMEOUT_MS = Number(process.env.OLLAMA_SERVE_TIMEOUT_MS || 30_000);

function resolveModelArg() {
  const args = process.argv.slice(2);
  let model = process.env.OLLAMA_MODEL || '';
  let pack = '';
  for (const a of args) {
    if (a.startsWith('--model=')) model = a.slice('--model='.length);
    else if (a.startsWith('--pack=')) pack = a.slice('--pack='.length);
    else if (!a.startsWith('--') && !model) model = a;
  }
  if (pack) {
    try {
      const catalogPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'agentic-pipeline',
        'model-catalog.json',
      );
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      const entry = catalog.packs?.[pack];
      if (entry?.recommended) model = entry.recommended;
    } catch {
      /* fall through */
    }
  }
  return model || 'qwen2.5-coder:32b';
}

const MODEL = resolveModelArg();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isServerUp() {
  try {
    const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function listModels() {
  const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`GET /api/tags -> ${res.status}`);
  const data = await res.json();
  return (data.models || []).map((m) => m.name);
}

function ollamaOnPath() {
  const probe = spawnSync('ollama', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return !probe.error && (probe.status === 0 || probe.status === null);
}

async function startServer() {
  console.log('[ensure-ollama] daemon not reachable, starting `ollama serve`...');
  const child = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  child.unref();

  const deadline = Date.now() + SERVE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(1000);
    if (await isServerUp()) {
      console.log('[ensure-ollama] daemon is up.');
      return true;
    }
  }
  return false;
}

function pullModel(model) {
  console.log(`[ensure-ollama] pulling model "${model}" (first run may take a while)...`);
  const res = spawnSync('ollama', ['pull', model], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return res.status === 0;
}

function modelPresent(names, model) {
  // A bare model name (no ":tag") implies the ":latest" tag in Ollama.
  const wanted = model.includes(':') ? model : `${model}:latest`;
  return names.some((n) => n === model || n === wanted);
}

async function main() {
  if (!ollamaOnPath()) {
    console.error('[ensure-ollama] `ollama` CLI not found on PATH. Install from https://ollama.com/download');
    process.exit(1);
  }

  if (!(await isServerUp())) {
    const ok = await startServer();
    if (!ok) {
      console.error(`[ensure-ollama] Ollama did not become reachable at ${HOST} within ${SERVE_TIMEOUT_MS}ms.`);
      process.exit(1);
    }
  } else {
    console.log(`[ensure-ollama] daemon already reachable at ${HOST}.`);
  }

  let names;
  try {
    names = await listModels();
  } catch (err) {
    console.error(`[ensure-ollama] failed to list models: ${err.message}`);
    process.exit(1);
  }

  if (!modelPresent(names, MODEL)) {
    if (!pullModel(MODEL)) {
      console.error(`[ensure-ollama] failed to pull "${MODEL}".`);
      process.exit(1);
    }
  }

  console.log(`[ensure-ollama] READY -> ${HOST} serving "${MODEL}".`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`[ensure-ollama] unexpected error: ${err?.stack || err}`);
  process.exit(1);
});
