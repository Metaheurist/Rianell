#!/usr/bin/env node
/**
 * Wait for polish pending≈0, then screenshot-QA → Gemma re-polish broken → loop until green.
 * Does NOT apply/wire/push icons.
 *
 * Usage:
 *   node scripts/dev/visual-polish-qa-loop.mjs
 *   node scripts/dev/visual-polish-qa-loop.mjs --now   # skip wait (interim)
 *   node scripts/dev/visual-polish-qa-loop.mjs --max-rounds=5
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeQaProgress } from './visual-polish-qa-status.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const now = args.includes('--now');
const maxArg = args.find((a) => a.startsWith('--max-rounds='));
const MAX_ROUNDS = Math.max(1, Number(maxArg?.split('=')[1] || 8));

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
  const fs = await import('fs');
  const polishCpPath = path.join(root, 'artifacts/visual-gen/polish-checkpoint.json');
  const genCpPath = path.join(root, 'artifacts/visual-gen/checkpoint.json');
  const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
  const load = (p, fb) => {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return fb;
    }
  };
  const reg = load(registerPath, { entries: [] });
  const genCp = load(genCpPath, { completed: {} });
  const polishCp = load(polishCpPath, { completed: {}, failed: {} });
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
    const s = await status();
    console.log(`[qa-loop] waiting polish… polished=${s.polished} pending=${s.pending} failed=${s.failed}`);
    writeQaProgress({
      active: true,
      stage: 'waiting-polish',
      phase: 'polish',
      // do not set round:null — preserves Pass N across resume waits
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
  await waitForPolishDone();

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    console.log(`[qa-loop] === screenshot QA Pass ${round} (max ${MAX_ROUNDS}) (every icon + cohesion + location + description + offset) ===`);
    writeQaProgress({
      active: true,
      stage: 'screenshot-cards',
      phase: 'screenshot-qa',
      round,
      maxRounds: MAX_ROUNDS,
      current: 0,
      total: 0,
      unit: 'icons',
      detail: `Starting Pass ${round} (max ${MAX_ROUNDS})`,
    });
    const qaArgs = ['run', 'visual:polish:screenshot-qa', '--'];
    if (now && round === 1) qaArgs.push('--now');
    qaArgs.push('--gemma-review');
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
      detail: `fatal: ${err?.message || err}`,
      exitCode: 1,
    });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
