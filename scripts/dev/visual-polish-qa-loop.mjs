#!/usr/bin/env node
/**
 * Wait for polish pending≈0, then screenshot-QA → Gemma re-polish broken → loop until green.
 * Does NOT apply/wire/push icons.
 *
 * Usage:
 *   node scripts/dev/visual-polish-qa-loop.mjs
 *   node scripts/dev/visual-polish-qa-loop.mjs --now
 *   node scripts/dev/visual-polish-qa-loop.mjs --max-rounds=5
 *   node scripts/dev/visual-polish-qa-loop.mjs --start-round=3
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeQaProgress } from './visual-polish-qa-status.mjs';
import { buildState } from './visual-pipeline-state.mjs';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const qaRoot = path.join(root, 'artifacts/visual-gen/qa');
const quarantinePath = path.join(qaRoot, 'quarantine.json');
const itemRoundsPath = path.join(qaRoot, 'item-rounds.json');
const args = process.argv.slice(2);
const now = args.includes('--now');
const maxArg = args.find((a) => a.startsWith('--max-rounds='));
const startArg = args.find((a) => a.startsWith('--start-round='));
const MAX_ROUNDS = Math.max(1, Number(maxArg?.split('=')[1] || 8));
const START_ROUND = Math.max(1, Math.min(MAX_ROUNDS, Number(startArg?.split('=')[1] || 1)));
const MAX_ITEM_ROUNDS = Math.max(1, Number(process.env.VISUAL_POLISH_MAX_ITEM_ROUNDS || 3));

let shuttingDown = false;

function loadJson(p, fb) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fb;
  }
}

function quarantineRepeatOffenders(brokenIds) {
  const rounds = loadJson(itemRoundsPath, {});
  const q = loadJson(quarantinePath, { ids: [], reasons: {} });
  let added = 0;
  for (const id of brokenIds) {
    rounds[id] = (rounds[id] || 0) + 1;
    if (rounds[id] >= MAX_ITEM_ROUNDS) {
      if (!q.ids.includes(id)) {
        q.ids.push(id);
        added += 1;
      }
      q.reasons = q.reasons || {};
      q.reasons[id] = [`quarantine: failed ${rounds[id]} rounds (max ${MAX_ITEM_ROUNDS})`];
    }
  }
  fs.mkdirSync(qaRoot, { recursive: true });
  fs.writeFileSync(itemRoundsPath, JSON.stringify(rounds, null, 2) + '\n');
  q.at = new Date().toISOString();
  fs.writeFileSync(quarantinePath, JSON.stringify(q, null, 2) + '\n');
  return { quarantined: q.ids, added };
}

async function flushPauseState(reason) {
  try {
    const state = await buildState();
    state.reason = reason || state.reason;
    const artRoot = path.join(root, 'artifacts/visual-gen');
    fs.mkdirSync(artRoot, { recursive: true });
    fs.writeFileSync(path.join(artRoot, 'pipeline-state.json'), JSON.stringify(state, null, 2) + '\n');
    writeQaProgress({
      active: false,
      stage: 'paused',
      phase: 'paused',
      round: state.qa?.round,
      maxRounds: state.qa?.maxRounds ?? MAX_ROUNDS,
      detail: `Signal pause · Pass ${state.qa?.round}/${state.qa?.maxRounds}`,
    });
    console.log('[qa-loop] flushed pipeline-state.json on signal');
  } catch (err) {
    console.error('[qa-loop] flush pause state failed', err.message);
  }
}

function installSignalHandlers() {
  const onSignal = async (sig) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[qa-loop] ${sig} — banking state then exit`);
    await flushPauseState(`signal ${sig}`);
    process.exit(130);
  };
  process.on('SIGINT', () => { onSignal('SIGINT'); });
  process.on('SIGTERM', () => { onSignal('SIGTERM'); });
}

function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
      ...opts,
    });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', reject);
  });
}

async function status() {
  const polishCpPath = path.join(root, 'artifacts/visual-gen/polish-checkpoint.json');
  const genCpPath = path.join(root, 'artifacts/visual-gen/checkpoint.json');
  const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
  const reg = loadJson(registerPath, { entries: [] });
  const genCp = loadJson(genCpPath, { completed: {} });
  const polishCp = loadJson(polishCpPath, { completed: {}, failed: {} });
  const eligible = (reg.entries || []).filter((e) => e.genStatus !== 'skip' && genCp.completed?.[e.id]).length;
  const polished = Object.keys(polishCp.completed || {}).length;
  const failed = Object.keys(polishCp.failed || {}).length;
  return {
    eligible,
    polished,
    failed,
    pending: Math.max(0, eligible - polished - failed),
    updatedAt: polishCp.updatedAt || null,
  };
}

async function waitForPolishDone() {
  if (now) {
    console.log('[qa-loop] --now: skipping pending wait');
    return;
  }
  for (;;) {
    if (shuttingDown) return;
    const s = await status();
    console.log(`[qa-loop] waiting polish… polished=${s.polished} pending=${s.pending} failed=${s.failed}`);
    writeQaProgress({
      active: true,
      stage: 'waiting-polish',
      phase: 'polish',
      maxRounds: MAX_ROUNDS,
      current: s.polished,
      total: s.eligible || (s.polished + s.pending),
      unit: 'polished',
      detail: `${s.pending} pending · ${s.failed} queue-failed`,
    });
    if (Number(s.pending) <= 0) return;
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

async function main() {
  installSignalHandlers();
  await waitForPolishDone();
  if (shuttingDown) return;

  for (let round = START_ROUND; round <= MAX_ROUNDS; round += 1) {
    if (shuttingDown) return;
    // Early rounds: cheap tiers only. Spend vision once geometry is cleaner (round ≥ 3).
    const useVision = round >= 3;
    const tier = useVision ? 'all' : '2';
    console.log(`[qa-loop] === screenshot QA Pass ${round} (max ${MAX_ROUNDS}) tier=${tier} vision=${useVision} ===`);
    writeQaProgress({
      active: true,
      stage: 'screenshot-cards',
      phase: 'screenshot-qa',
      round,
      maxRounds: MAX_ROUNDS,
      current: 0,
      total: 0,
      unit: 'icons',
      detail: `Starting Pass ${round} (max ${MAX_ROUNDS}) · tier ${tier}`,
    });
    const qaArgs = ['run', 'visual:polish:screenshot-qa', '--'];
    if (now && round === START_ROUND) qaArgs.push('--now');
    qaArgs.push(`--tier=${tier}`);
    if (useVision) qaArgs.push('--gemma-review');
    const qaCode = await run('npm', qaArgs);
    if (qaCode === 0) {
      writeQaProgress({
        active: false,
        stage: 'passed',
        phase: 'report',
        round,
        maxRounds: MAX_ROUNDS,
        detail: `ALL PASS on Pass ${round}`,
        exitCode: 0,
      });
      console.log('[qa-loop] ALL PASS — do not apply/wire/push until you explicitly unlock Phase 4');
      process.exit(0);
    }
    if (qaCode === 2) {
      writeQaProgress({
        active: false,
        stage: 'waiting-polish',
        phase: 'polish',
        round,
        maxRounds: MAX_ROUNDS,
        detail: 'Polish still running (exit 2)',
        exitCode: 2,
      });
      console.log('[qa-loop] polish still running; exit 2');
      process.exit(2);
    }

    const broken = loadJson(path.join(qaRoot, 'broken.json'), { ids: [] });
    const qInfo = quarantineRepeatOffenders(broken.ids || []);
    if (qInfo.added) {
      console.log(`[qa-loop] quarantined ${qInfo.added} repeat offenders (total ${qInfo.quarantined.length})`);
    }

    console.log('[qa-loop] broken found — Gemma re-polish from qa/broken.json');
    writeQaProgress({
      active: true,
      stage: 'repolish',
      phase: 'repolish',
      round,
      maxRounds: MAX_ROUNDS,
      current: 0,
      total: 0,
      unit: 'broken',
      detail: `Re-polish broken · Pass ${round} (max ${MAX_ROUNDS})`,
    });
    const polishCode = await run('npm', ['run', 'visual:polish:repolish-qa']);
    if (polishCode !== 0) {
      writeQaProgress({
        active: false,
        stage: 'needs-fix',
        phase: 'repolish',
        round,
        maxRounds: MAX_ROUNDS,
        detail: `repolish failed (${polishCode})`,
        exitCode: polishCode,
      });
      console.error('[qa-loop] repolish failed', polishCode);
      process.exit(polishCode);
    }
  }

  console.error(`[qa-loop] still broken after ${MAX_ROUNDS} rounds`);
  writeQaProgress({
    active: false,
    stage: 'needs-fix',
    phase: 'report',
    round: MAX_ROUNDS,
    maxRounds: MAX_ROUNDS,
    detail: `Still broken after ${MAX_ROUNDS} rounds`,
    exitCode: 1,
  });
  process.exit(1);
}

main().catch((err) => {
  console.error('[qa-loop] fatal', err);
  try {
    writeQaProgress({
      active: false,
      stage: 'needs-fix',
      detail: String(err?.message || err),
      exitCode: 1,
    });
  } catch { /* ignore */ }
  process.exit(1);
});
