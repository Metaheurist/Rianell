#!/usr/bin/env node
import {
  executeRunAll,
  getRunAllStatus,
  pauseRunAll,
  resumeRunAll,
  cancelRunAll,
} from '../dev/agentic-pipeline/run-all.mjs';

const dryRun = process.argv.includes('--dry-run') || process.env.AGENTIC_DRY_RUN === '1';
const stopOnBroken = !process.argv.includes('--no-stop-on-broken');
const skipArg = process.argv.find((a) => a.startsWith('--skip='));
const skip = skipArg ? skipArg.slice('--skip='.length).split(',').filter(Boolean) : [];

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

const state = await executeRunAll({ dryRun, stopOnBroken, skip });
console.log(JSON.stringify(state, null, 2));
process.exit(state.status === 'passed' || state.status === 'idle' ? 0 : 1);
