/**
 * Shut down live pipelines, wipe harness runtime state (including pending
 * approvals/proposals), and unload all Ollama models in VRAM.
 * Keeps approval-log.jsonl and approved/ archives.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAllOrder } from './catalog.mjs';
import { ollamaPs, ollamaUnload } from './ollama-client.mjs';
import { cancelRunAll } from './run-all.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';
import {
  AGENTIC_ROOT,
  ensureDir,
  packDir,
  writePackState,
  writeRunAllState,
} from './state.mjs';

const WORKER_PID_FILE = path.join(AGENTIC_ROOT, 'run-all-worker.pid');

const TRANSIENT = [
  'state.json',
  'proposal.json',
  'report.json',
  'broken.json',
  'llm-advisory.md',
  'llm-stream.partial.md',
  'llm-stream.meta.json',
  'llm-context.md',
  'llm-context.meta.json',
  'fill-progress.json',
  'apply-unlock.json',
  'proposal.rejected.json',
];

const WORKER_CMD_PATTERNS = [
  'agentic-run-all',
  'agentic-pack-cli',
  'ollama-translate-gaps',
];

function rmSafe(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return true;
  } catch {
    return false;
  }
}

function rmDirContents(dir) {
  const removed = [];
  if (!fs.existsSync(dir)) return removed;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    try {
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        removed.push(...rmDirContents(p));
        fs.rmdirSync(p);
      } else if (rmSafe(p)) {
        removed.push(f);
      }
    } catch { /* ignore */ }
  }
  return removed;
}

function killPid(pid) {
  const n = Number(pid);
  if (!Number.isFinite(n) || n <= 0) return false;
  try {
    if (process.platform === 'win32') {
      silentSpawnSync('taskkill', ['/PID', String(n), '/T', '/F'], {
        cwd: AGENTIC_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } else {
      process.kill(n, 'SIGTERM');
    }
    return true;
  } catch {
    return false;
  }
}

/** Force-stop run-all / pack / i18n fill workers still holding the CPU. */
export function killAgenticWorkers() {
  const killed = [];
  if (fs.existsSync(WORKER_PID_FILE)) {
    try {
      const pid = String(fs.readFileSync(WORKER_PID_FILE, 'utf8')).trim();
      if (killPid(pid)) killed.push(Number(pid));
    } catch { /* ignore */ }
    rmSafe(WORKER_PID_FILE);
  }

  if (process.platform === 'win32') {
    const pattern = WORKER_CMD_PATTERNS.join('|');
    const ps = `
$re = [regex]'${pattern.replace(/\\/g, '\\\\')}'
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ForEach-Object {
  if ($_.CommandLine -and $re.IsMatch($_.CommandLine)) {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      $_.ProcessId
    } catch {}
  }
}
`.trim();
    const res = silentSpawnSync('powershell', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps,
    ], { cwd: AGENTIC_ROOT });
    const out = String(res.stdout || '');
    for (const line of out.split(/\r?\n/)) {
      const n = Number(line.trim());
      if (Number.isFinite(n) && n > 0) killed.push(n);
    }
  } else {
    for (const pat of ['agentic-run-all', 'agentic-pack-cli', 'ollama-translate-gaps']) {
      silentSpawnSync('pkill', ['-f', pat], { cwd: AGENTIC_ROOT });
    }
  }
  return [...new Set(killed)];
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
  removed.push(...rmDirContents(propose).map((f) => `fill-proposals/${f}`));
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

  // 1) Signal run-all to stop between packs
  let cancelled = null;
  try {
    cancelled = cancelRunAll();
  } catch (e) {
    cancelled = { error: String(e?.message || e) };
  }

  // 2) Kill any stuck workers (LLM / i18n fill / run-all node)
  const killedPids = killAgenticWorkers();

  // Brief pause so file locks release on Windows
  await new Promise((r) => setTimeout(r, 200));

  // 3) Wipe runtime state + pending approvals (proposals)
  writeRunAllState({
    status: 'idle',
    stepIndex: 0,
    order: [],
    skip: [],
    currentPack: null,
    results: {},
    dryRun: null,
    autoApprove: false,
    clearedAt: new Date().toISOString(),
  });

  const packs = {};
  for (const id of runAllOrder()) {
    packs[id] = { removed: clearPackDir(id), status: 'idle' };
  }

  rmSafe(path.join(AGENTIC_ROOT, 'run-all-worker.log'));
  rmSafe(WORKER_PID_FILE);

  // 4) Unload every model currently resident in Ollama VRAM
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
    cancelled,
    killedPids,
    packs,
    unloaded,
    unloadFailed: failed,
    ollamaPsError: ps?.error || null,
    note: 'Pipelines cancelled + workers killed; pending approvals/proposals cleared; models unloaded. approval-log and approved/ kept.',
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
