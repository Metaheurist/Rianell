#!/usr/bin/env node
/**
 * Live product-write run-all loop (no commits).
 * On failure: reset tree to baseline stash commit and retry.
 *
 *   node scripts/dev/agentic-product-write-loop.mjs --max-attempts=3
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeRunAll, cancelRunAll } from './agentic-pipeline/run-all.mjs';
import { clearAllAndUnload } from './agentic-pipeline/clear-all.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE_FILE = path.join(ROOT, 'artifacts/agentic/pre-product-write-baseline.ref');
const RESULT_FILE = path.join(ROOT, 'artifacts/agentic/product-write-loop-result.json');

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
}

const maxAttempts = Math.max(1, Number(arg('max-attempts', '3')) || 3);

function git(args, opts = {}) {
  return spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    ...opts,
  });
}

function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    ...opts,
  });
}

function restoreBaseline(baseline) {
  console.log(`[loop] revert all changes -> baseline ${baseline.slice(0, 12)}`);
  git(['reset', '--hard', 'HEAD']);
  // Keep ignored runtime dirs; drop untracked product files from a failed run.
  git(['clean', '-fd', '--', 'apps', 'packages', 'i18n-packs', 'scripts', 'docs', 'wiki', 'tests', '.agents', '.cursor']);
  const co = git(['checkout', baseline, '--', '.']);
  if (co.status !== 0) {
    console.error(co.stderr || co.stdout);
    throw new Error('failed to restore baseline working tree');
  }
  const loopPath = path.join(ROOT, 'scripts/dev/agentic-product-write-loop.mjs');
  if (!fs.existsSync(loopPath)) {
    throw new Error('baseline missing agentic-product-write-loop.mjs — refresh stash baseline');
  }
}

function summarize(state) {
  const results = state?.results || {};
  const rows = Object.entries(results).map(([pack, r]) => ({
    pack,
    ok: Boolean(r?.ok),
    approvalState: r?.approvalState ?? null,
    needsApproval: Boolean(r?.needsApproval),
    error: r?.error || null,
    model: r?.model || null,
  }));
  const failed = rows.filter((r) => !r.ok);
  const pending = rows.filter((r) => r.needsApproval || r.approvalState === 'pending');
  const allOk = rows.length === 16 && failed.length === 0;
  const allApplied = allOk && pending.length === 0
    && rows.every((r) => r.approvalState === 'applied' || r.approvalState == null);
  return { rows, failed, pending, allOk, allApplied, status: state?.status };
}

async function oneAttempt(attempt) {
  console.log(`\n[loop] ===== attempt ${attempt}/${maxAttempts} =====`);
  try {
    await clearAllAndUnload();
  } catch (e) {
    console.warn('[loop] clear-all warning:', e?.message || e);
  }
  cancelRunAll();

  const state = await executeRunAll({
    dryRun: false,
    stopOnBroken: true,
    autoApprove: true,
    autoApproveMode: 'product-write',
    confirmProductWrite: true,
    allowDependencyBump: false,
    gitCommitOnApprove: false,
  });

  const summary = summarize(state);
  fs.mkdirSync(path.dirname(RESULT_FILE), { recursive: true });
  fs.writeFileSync(RESULT_FILE, `${JSON.stringify({ attempt, state, summary, at: new Date().toISOString() }, null, 2)}\n`);

  console.log(`[loop] status=${summary.status} allOk=${summary.allOk} allApplied=${summary.allApplied}`);
  for (const r of summary.rows) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    console.log(`  ${mark} ${r.pack} model=${r.model} appr=${r.approvalState}${r.error ? ` err=${r.error}` : ''}`);
  }
  return { state, summary };
}

async function main() {
  process.chdir(ROOT);
  process.env.AGENTIC_SKIP_GIT_PUSH = '1';
  process.env.AGENTIC_SKIP_COMMIT_LLM = '1';

  if (!fs.existsSync(BASELINE_FILE)) {
    throw new Error(`missing baseline ref file: ${BASELINE_FILE}`);
  }
  let baseline = fs.readFileSync(BASELINE_FILE, 'utf8').trim();
  if (!/^[0-9a-f]{7,40}$/i.test(baseline)) {
    throw new Error(`bad baseline ref: ${baseline}`);
  }
  console.log(`[loop] baseline=${baseline}`);
  console.log('[loop] live product-write · Qwen3 defaults · no dependency bumps · no git commit/push');

  restoreBaseline(baseline);

  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      baseline = fs.readFileSync(BASELINE_FILE, 'utf8').trim();
      restoreBaseline(baseline);
    }
    last = await oneAttempt(attempt);
    if (last.summary.allApplied || (last.summary.allOk && last.summary.pending.length === 0)) {
      console.log('\n[loop] SUCCESS - all 16 complete. Working tree left for your review (not committed).');
      console.log('[loop] Review: git status / git diff');
      process.exit(0);
    }

    console.log('\n[loop] FAIL - reverting ALL changes to baseline before next attempt');
    restoreBaseline(baseline);

    if (attempt === maxAttempts) break;

    const failedPacks = last.summary.failed.map((f) => f.pack);
    if (failedPacks.includes('seo')) {
      console.log('[loop] regenerating seo pages after seo failure...');
      sh('npm', ['run', 'seo:pages'], { stdio: 'inherit' });
      git(['add', '-A']);
      const created = git(['stash', 'create', 'baseline-after-seo-fix']);
      const next = (created.stdout || '').trim();
      if (next) {
        fs.writeFileSync(BASELINE_FILE, next);
        console.log('[loop] updated baseline ->', next.slice(0, 12));
      }
      git(['reset', 'HEAD']);
    }
  }

  console.error('\n[loop] exhausted attempts - tree restored to baseline. See artifacts/agentic/product-write-loop-result.json');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
