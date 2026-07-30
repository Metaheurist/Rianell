#!/usr/bin/env node
/**
 * Durable pause / resume for the visual polish + QA pipeline.
 *
 * Usage:
 *   node scripts/dev/visual-pipeline-state.mjs --status
 *   node scripts/dev/visual-pipeline-state.mjs --pause
 *   node scripts/dev/visual-pipeline-state.mjs --resume
 *
 * Pause snapshots:
 *   - active command argv (qa-loop / queue / screenshot-qa)
 *   - remaining runtimeIds (broken.json minus already re-completed)
 *   - qa-loop round / maxRounds
 *   - checkpoint counts + hash
 *   - loaded Ollama models
 *
 * Resume NEVER re-runs --repolish-from-qa (that deletes completed[id]).
 * It restores via --ids= and --start-round=N.
 */
import { spawn, execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeQaProgress, QA_PROGRESS_PATH, QA_BROKEN_PATH } from './visual-polish-qa-status.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const artRoot = path.join(root, 'artifacts/visual-gen');
const STATE_PATH = path.join(artRoot, 'pipeline-state.json');
const polishCpPath = path.join(artRoot, 'polish-checkpoint.json');
const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const DEFAULT_MODEL = process.env.VISUAL_POLISH_MODEL || process.env.OLLAMA_MODEL || 'gemma4:31b-it-qat';

const args = process.argv.slice(2);
const doPause = args.includes('--pause');
const doResume = args.includes('--resume');
const doStatus = args.includes('--status') || (!doPause && !doResume);
/** Default resume is IDE terminals (print commands). Pass --detached to spawn invisible workers. */
const resumeDetached = args.includes('--detached');
const resumeIde = !resumeDetached; // --ide is the default; --detached opts out


function loadJson(p, fb) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fb;
  }
}

function fileHash(p) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

function listNodeWorkers() {
  const workers = [];
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'node.exe\'\\" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"',
        { encoding: 'utf8', windowsHide: true, timeout: 15000 },
      );
      const parsed = JSON.parse(out || '[]');
      const rows = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      for (const row of rows) {
        const cmd = String(row.CommandLine || '');
        if (!/visual-polish|visual:polish|visual-pipeline-state/.test(cmd)) continue;
        if (/visual-pipeline-state/.test(cmd)) continue;
        workers.push({ pid: Number(row.ProcessId), cmd });
      }
    } else {
      const out = execSync('ps -eo pid=,args=', { encoding: 'utf8' });
      for (const line of out.split('\n')) {
        if (!/visual-polish|visual:polish/.test(line)) continue;
        if (/visual-pipeline-state/.test(line)) continue;
        const m = line.trim().match(/^(\d+)\s+(.*)$/);
        if (m) workers.push({ pid: Number(m[1]), cmd: m[2] });
      }
    }
  } catch {
    /* ignore */
  }
  return workers;
}

function classifyWorker(cmd) {
  if (/visual-polish-qa-loop|visual:polish:qa-loop/.test(cmd)) {
    return { kind: 'qa-loop', npm: 'visual:polish:qa-loop' };
  }
  if (/--repolish-from-qa|visual:polish:repolish-qa/.test(cmd)) {
    return { kind: 'repolish', npm: 'visual:polish:repolish-qa' };
  }
  if (/visual-polish-screenshot-qa|visual:polish:screenshot-qa/.test(cmd)) {
    return { kind: 'screenshot-qa', npm: 'visual:polish:screenshot-qa' };
  }
  if (/visual-polish-queue\.mjs(?!.*--repolish)|visual:polish(?!:)/.test(cmd)
    && /visual-polish-queue|npm.*visual:polish[^-]/.test(cmd)
    && !/screenshot-qa|qa-loop|live|preview|repolish/.test(cmd)) {
    return { kind: 'polish-queue', npm: 'visual:polish' };
  }
  if (/visual-polish-live|visual:polish:live/.test(cmd)) {
    return { kind: 'live-preview', npm: 'visual:polish:live' };
  }
  return { kind: 'other', npm: null };
}

async function ollamaPs() {
  try {
    const res = await fetch(`${HOST}/api/ps`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { reachable: false, models: [] };
    const data = await res.json();
    return {
      reachable: true,
      models: (data.models || []).map((m) => ({
        name: m.name || m.model,
        sizeVram: m.size_vram || 0,
      })),
    };
  } catch {
    return { reachable: false, models: [] };
  }
}

function computeRuntimeIds(polishCp, broken) {
  const brokenIds = Array.isArray(broken?.ids) ? broken.ids : [];
  const completed = polishCp.completed || {};
  const brokenAt = broken?.at ? Date.parse(broken.at) : 0;
  const remaining = [];
  for (const id of brokenIds) {
    const done = completed[id];
    if (!done) {
      remaining.push(id);
      continue;
    }
    // Keep ids completed *after* the broken snapshot — they are already fixed.
    const doneAt = done.at ? Date.parse(done.at) : 0;
    if (brokenAt && doneAt && doneAt > brokenAt) continue;
    if (done.qaPatched) continue;
    remaining.push(id);
  }
  return remaining;
}

function detectActiveCommand(workers) {
  const classified = workers.map((w) => ({ ...w, ...classifyWorker(w.cmd) }));
  // Prefer the leaf worker (repolish / screenshot) over the parent qa-loop so
  // pause mid-repolish resumes the remaining ids instead of re-scanning from Pass 1.
  const prefer = ['repolish', 'screenshot-qa', 'polish-queue', 'qa-loop'];
  for (const kind of prefer) {
    const hit = classified.find((c) => c.kind === kind);
    if (hit) return hit;
  }
  return classified.find((c) => c.kind === 'live-preview') || null;
}

async function buildState() {
  const polishCp = loadJson(polishCpPath, { completed: {}, failed: {} });
  const progress = loadJson(QA_PROGRESS_PATH, {});
  const broken = loadJson(QA_BROKEN_PATH, { ids: [] });
  const workers = listNodeWorkers();
  const active = detectActiveCommand(workers);
  const ollama = await ollamaPs();
  const runtimeIds = computeRuntimeIds(polishCp, broken);
  const model = ollama.models?.[0]?.name
    || polishCp.model
    || DEFAULT_MODEL;

  return {
    version: 1,
    pausedAt: new Date().toISOString(),
    reason: 'durable pause — resume via visual:resume',
    activeCommand: active
      ? { kind: active.kind, npm: active.npm, pid: active.pid, cmd: active.cmd }
      : null,
    workers: workers.map((w) => ({ pid: w.pid, kind: classifyWorker(w.cmd).kind })),
    runtimeIds,
    qa: {
      round: progress.round ?? 1,
      maxRounds: progress.maxRounds ?? 8,
      stage: progress.stage || null,
      phase: progress.phase || null,
      current: progress.current ?? null,
      total: progress.total ?? null,
      passLabel: progress.passLabel || null,
      brokenSoFar: progress.brokenSoFar ?? broken.ids?.length ?? null,
      passedSoFar: progress.passedSoFar ?? null,
    },
    checkpoint: {
      updatedAt: polishCp.updatedAt || null,
      model: polishCp.model || model,
      pipeline: polishCp.pipeline || null,
      completed: Object.keys(polishCp.completed || {}).length,
      failed: Object.keys(polishCp.failed || {}).length,
      hash: fileHash(polishCpPath),
    },
    broken: {
      at: broken.at || null,
      count: Array.isArray(broken.ids) ? broken.ids.length : 0,
    },
    ollama: {
      host: HOST,
      model,
      models: ollama.models,
      reachable: ollama.reachable,
    },
  };
}

function killWorkers(workers) {
  for (const w of workers) {
    try {
      process.kill(w.pid);
      console.log(`[pipeline-state] stopped pid=${w.pid} (${classifyWorker(w.cmd).kind})`);
    } catch (err) {
      console.log(`[pipeline-state] skip pid=${w.pid}: ${err.message}`);
    }
  }
}

async function stopOllamaModels(models) {
  const names = (models || []).map((m) => m.name).filter(Boolean);
  if (!names.length) names.push(DEFAULT_MODEL);
  for (const name of names) {
    try {
      execSync(`ollama stop ${JSON.stringify(name).slice(1, -1)}`, {
        stdio: 'ignore',
        windowsHide: true,
        timeout: 60000,
      });
      console.log(`[pipeline-state] ollama stop ${name}`);
    } catch {
      try {
        await fetch(`${HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: name, keep_alive: 0, prompt: '' }),
          signal: AbortSignal.timeout(15000),
        });
        console.log(`[pipeline-state] keep_alive=0 ${name}`);
      } catch (err) {
        console.log(`[pipeline-state] unload ${name}: ${err.message}`);
      }
    }
  }
}

function spawnDetached(npmScript, extraArgs = []) {
  const npmArgs = ['run', npmScript, ...(extraArgs.length ? ['--', ...extraArgs] : [])];
  const child = spawn('npm', npmArgs, {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.unref();
  console.log(`[pipeline-state] started npm run ${npmScript} ${extraArgs.join(' ')} (pid=${child.pid})`);
  return child.pid;
}

/** IDE-friendly: print copy-paste commands instead of detaching invisible workers. */
function printIdeCommands(cmds) {
  const lines = [
    '[pipeline-state] Run these in separate IDE terminals (Terminal → New Terminal):',
    ...cmds.map((c, i) => `  ${i + 1}. ${c}`),
  ];
  for (const line of lines) console.log(line);
  const out = path.join(artRoot, 'ide-commands.json');
  fs.mkdirSync(artRoot, { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), commands: cmds }, null, 2) + '\n');
  console.log(`[pipeline-state] also wrote ${path.relative(root, out)}`);
}

async function pause() {
  const state = await buildState();
  fs.mkdirSync(artRoot, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
  console.log(`[pipeline-state] wrote ${path.relative(root, STATE_PATH)}`);
  console.log(`[pipeline-state] active=${state.activeCommand?.kind || 'none'} remainingIds=${state.runtimeIds.length} round=${state.qa.round}`);

  const workers = listNodeWorkers();
  killWorkers(workers);
  await stopOllamaModels(state.ollama.models);

  writeQaProgress({
    active: false,
    stage: 'paused',
    phase: state.qa.phase || 'paused',
    round: state.qa.round,
    maxRounds: state.qa.maxRounds,
    current: state.qa.current,
    total: state.qa.total,
    detail: `Paused · ${state.runtimeIds.length} ids remaining · Pass ${state.qa.round}/${state.qa.maxRounds}`,
    brokenSoFar: state.qa.brokenSoFar,
    passedSoFar: state.qa.passedSoFar,
  });

  const after = await ollamaPs();
  console.log(`[pipeline-state] paused · ollama models loaded=${after.models.length}`);
  return state;
}

async function resume() {
  const state = loadJson(STATE_PATH, null);
  if (!state) {
    console.error(`[pipeline-state] no state at ${STATE_PATH} — nothing to resume`);
    process.exit(1);
  }

  const model = state.ollama?.model || DEFAULT_MODEL;
  console.log(`[pipeline-state] ensuring model ${model}`);
  const ensureCode = await new Promise((resolve) => {
    const child = spawn('node', [path.join(__dirname, 'ensure-ollama.mjs'), model], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
  if (ensureCode !== 0) {
    console.error('[pipeline-state] ensure-ollama failed', ensureCode);
    process.exit(ensureCode);
  }

  // Live preview + worker: IDE terminals by default (visible logs).
  const living = listNodeWorkers().some((w) => classifyWorker(w.cmd).kind === 'live-preview');
  const cmds = [];
  if (!living) cmds.push('npm run visual:polish:live');

  const round = Math.max(1, Number(state.qa?.round || 1));
  const maxRounds = Math.max(round, Number(state.qa?.maxRounds || 8));
  const ids = Array.isArray(state.runtimeIds) ? state.runtimeIds.filter(Boolean) : [];
  const kind = state.activeCommand?.kind || (ids.length ? 'repolish' : 'qa-loop');

  writeQaProgress({
    active: true,
    stage: kind === 'screenshot-qa' ? 'screenshot-cards' : (kind === 'repolish' ? 'repolish' : 'waiting-polish'),
    phase: kind === 'screenshot-qa' ? 'screenshot-qa' : (kind === 'repolish' ? 'repolish' : 'polish'),
    round,
    maxRounds,
    current: 0,
    total: ids.length || state.qa?.total || 0,
    unit: ids.length ? 'broken' : 'icons',
    detail: `Resumed · ${kind} · Pass ${round}/${maxRounds} · ${ids.length} ids`,
    brokenSoFar: state.qa?.brokenSoFar,
    passedSoFar: state.qa?.passedSoFar,
  });

  const qaLoopCmd = `npm run visual:polish:qa-loop -- --start-round=${round} --max-rounds=${maxRounds} --now`;
  let workerCmd = null;
  if (kind === 'qa-loop' || kind === 'screenshot-qa') {
    workerCmd = qaLoopCmd;
  } else if (kind === 'repolish' || kind === 'polish-queue') {
    if (!ids.length) {
      console.log('[pipeline-state] no remaining ids — qa-loop from recorded round');
      workerCmd = qaLoopCmd;
    } else {
      const idsFile = path.join(artRoot, 'resume-ids.json');
      fs.writeFileSync(idsFile, JSON.stringify({ at: new Date().toISOString(), ids }, null, 2) + '\n');
      workerCmd = `npm run visual:polish -- --ids-file=${path.relative(root, idsFile).replace(/\\/g, '/')}`;
      console.log(`[pipeline-state] ${ids.length} remaining ids → ${path.relative(root, idsFile)} (never --repolish-from-qa)`);
    }
  } else {
    workerCmd = qaLoopCmd;
  }
  if (workerCmd) cmds.push(workerCmd);
  if (workerCmd && workerCmd.includes('visual:polish --')) {
    cmds.push(`# after polish finishes:\n${qaLoopCmd}`);
  }

  if (resumeIde) {
    printIdeCommands(cmds.filter((c) => !c.startsWith('#')));
    if (workerCmd && workerCmd.includes('visual:polish --')) {
      console.log(`[pipeline-state] after polish finishes, in a third terminal: ${qaLoopCmd}`);
    }
  } else {
    for (const c of cmds) {
      if (c.startsWith('#')) continue;
      if (c.includes('visual:polish:live')) spawnDetached('visual:polish:live');
      else if (c.includes('visual:polish:qa-loop')) {
        spawnDetached('visual:polish:qa-loop', [
          `--start-round=${round}`,
          `--max-rounds=${maxRounds}`,
          '--now',
        ]);
      } else if (c.includes('visual:polish')) {
        const idsFile = path.join(artRoot, 'resume-ids.json');
        spawnDetached('visual:polish', [`--ids-file=${idsFile}`]);
      }
    }
  }

  state.resumedAt = new Date().toISOString();
  state.resumeMode = resumeIde ? 'ide' : 'detached';
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
  console.log(`[pipeline-state] resume ready (mode=${resumeIde ? 'ide' : 'detached'})`);
}

async function status() {
  const state = loadJson(STATE_PATH, null);
  const workers = listNodeWorkers();
  const ollama = await ollamaPs();
  const polishCp = loadJson(polishCpPath, { completed: {}, failed: {} });
  const progress = loadJson(QA_PROGRESS_PATH, {});
  const out = {
    stateFile: fs.existsSync(STATE_PATH),
    pausedAt: state?.pausedAt || null,
    resumedAt: state?.resumedAt || null,
    activeCommand: state?.activeCommand?.kind || null,
    remainingIds: state?.runtimeIds?.length ?? null,
    qaRound: progress.round ?? state?.qa?.round ?? null,
    checkpoint: {
      completed: Object.keys(polishCp.completed || {}).length,
      failed: Object.keys(polishCp.failed || {}).length,
    },
    workers: workers.map((w) => ({ pid: w.pid, kind: classifyWorker(w.cmd).kind })),
    ollamaModels: ollama.models.map((m) => m.name),
  };
  console.log(JSON.stringify(out, null, 2));
}

async function main() {
  if (doPause) await pause();
  else if (doResume) await resume();
  else await status();
}

export {
  STATE_PATH,
  buildState,
  computeRuntimeIds,
  classifyWorker,
  listNodeWorkers,
};

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch((err) => {
    console.error('[pipeline-state] fatal', err);
    process.exit(1);
  });
}
