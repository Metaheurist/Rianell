/**
 * Clear harness runtime state and unload all Ollama models in VRAM.
 * Keeps approval-log.jsonl and approved/ archives.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAllOrder } from './catalog.mjs';
import { ollamaPs, ollamaUnload } from './ollama-client.mjs';
import {
  AGENTIC_ROOT,
  ensureDir,
  packDir,
  writePackState,
  writeRunAllState,
} from './state.mjs';

const TRANSIENT = [
  'state.json',
  'proposal.json',
  'report.json',
  'broken.json',
  'llm-advisory.md',
  'llm-stream.partial.md',
  'llm-stream.meta.json',
  'fill-progress.json',
  'apply-unlock.json',
  'proposal.rejected.json',
];

function rmSafe(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return true;
  } catch {
    return false;
  }
}

function clearPackDir(packId) {
  const dir = packDir(packId);
  const removed = [];
  if (!fs.existsSync(dir)) {
    writePackState(packId, {
      packId,
      status: 'idle',
      model: null,
      stage: null,
      completed: [],
      failed: [],
      paused: false,
      updatedAt: new Date().toISOString(),
    });
    return removed;
  }
  for (const name of TRANSIENT) {
    const p = path.join(dir, name);
    if (rmSafe(p)) removed.push(name);
  }
  const propose = path.join(dir, 'fill-proposals');
  if (fs.existsSync(propose)) {
    for (const f of fs.readdirSync(propose)) {
      if (f.endsWith('.json')) rmSafe(path.join(propose, f));
    }
  }
  writePackState(packId, {
    packId,
    status: 'idle',
    model: null,
    stage: null,
    completed: [],
    failed: [],
    paused: false,
    updatedAt: new Date().toISOString(),
  });
  return removed;
}

export async function clearAllAndUnload() {
  ensureDir(AGENTIC_ROOT);

  writeRunAllState({
    status: 'idle',
    stepIndex: 0,
    order: [],
    skip: [],
    currentPack: null,
    results: {},
    dryRun: null,
    clearedAt: new Date().toISOString(),
  });

  const packs = {};
  for (const id of runAllOrder()) {
    packs[id] = { removed: clearPackDir(id), status: 'idle' };
  }

  const unloaded = [];
  const failed = [];
  let ps;
  try {
    ps = await ollamaPs();
  } catch (e) {
    ps = { models: [], error: String(e?.message || e) };
  }
  const models = (ps?.models || []).map((m) => m.name || m.model).filter(Boolean);
  for (const model of [...new Set(models)]) {
    try {
      await ollamaUnload(model);
      unloaded.push(model);
    } catch (e) {
      failed.push({ model, error: String(e?.message || e) });
    }
  }

  return {
    ok: true,
    clearedAt: new Date().toISOString(),
    packs,
    unloaded,
    unloadFailed: failed,
    ollamaPsError: ps?.error || null,
    note: 'Runtime state cleared; approval-log and approved/ kept. Models unloaded from VRAM.',
  };
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  clearAllAndUnload()
    .then((data) => {
      process.stdout.write(`${JSON.stringify({ ok: true, data, error: null })}\n`);
    })
    .catch((e) => {
      process.stdout.write(`${JSON.stringify({ ok: false, data: null, error: { message: String(e?.message || e) } })}\n`);
      process.exit(1);
    });
}
