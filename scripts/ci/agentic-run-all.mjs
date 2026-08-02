#!/usr/bin/env node
import {
  executeRunAll,
  getRunAllStatus,
  pauseRunAll,
  resumeRunAll,
  cancelRunAll,
} from '../dev/agentic-pipeline/run-all.mjs';

function arg(name) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : null;
}

const dryRun = process.argv.includes('--dry-run') || process.env.AGENTIC_DRY_RUN === '1';
// Default: continue through all packs so proposals accumulate for later Approve.
// Opt into early abort with --stop-on-broken (legacy: --no-stop-on-broken still means continue).
const stopOnBroken = process.argv.includes('--stop-on-broken')
  && !process.argv.includes('--no-stop-on-broken');
const skipArg = process.argv.find((a) => a.startsWith('--skip='));
const skip = skipArg ? skipArg.slice('--skip='.length).split(',').filter(Boolean) : [];
const autoApprove = process.argv.includes('--auto-approve');
const autoApproveMode = arg('auto-approve-mode') || 'ack';
const confirmProductWrite = process.argv.includes('--confirm-product-write');
const allowDependencyBump = process.argv.includes('--allow-dependency-bump');
const gitCommitOnApprove = process.argv.includes('--git-commit-on-approve');

if (process.argv.includes('--status')) {
  console.log(JSON.stringify(getRunAllStatus(), null, 2));
  process.exit(0);
}
if (process.argv.includes('--pause')) {
  console.log(JSON.stringify(pauseRunAll(), null, 2));
  process.exit(0);
}
if (process.argv.includes('--resume')) {
  console.log(JSON.stringify(resumeRunAll(), null, 2));
  process.exit(0);
}
if (process.argv.includes('--cancel')) {
  console.log(JSON.stringify(cancelRunAll(), null, 2));
  process.exit(0);
}

const state = await executeRunAll({
  dryRun,
  stopOnBroken,
  skip,
  autoApprove,
  autoApproveMode,
  confirmProductWrite,
  allowDependencyBump,
  gitCommitOnApprove,
});
console.log(JSON.stringify(state, null, 2));
const ok = state.status === 'passed'
  || state.status === 'idle'
  || state.status === 'awaiting_approvals'
  || (dryRun && state.status !== 'broken' && state.status !== 'cancelled');
process.exit(ok ? 0 : 1);
