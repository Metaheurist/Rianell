#!/usr/bin/env node
import { pausePack, resumePack, readPackState, readRunAllState } from './state.mjs';
import { runAllOrder } from './catalog.mjs';

const args = process.argv.slice(2);
const pauseAll = args.includes('--pause-all');
const resumeAll = args.includes('--resume-all');
const mode = args.includes('--pause') ? 'pause'
  : args.includes('--resume') ? 'resume'
    : 'status';
const packArg = args.find((a) => a.startsWith('--pack='));
const packId = packArg ? packArg.slice('--pack='.length) : '';

if (pauseAll || resumeAll) {
  const out = {};
  for (const id of runAllOrder()) {
    out[id] = pauseAll ? pausePack(id) : resumePack(id);
  }
  console.log(JSON.stringify({ action: pauseAll ? 'pause-all' : 'resume-all', packs: out }, null, 2));
  process.exit(0);
}

if (mode === 'status' && !packId) {
  console.log(JSON.stringify({
    runAll: readRunAllState(),
    packs: Object.fromEntries(runAllOrder().map((id) => [id, readPackState(id)])),
  }, null, 2));
  process.exit(0);
}

if (!packId) {
  console.error('Usage: --pack=<id> with --pause|--resume|--status (or --pause-all|--resume-all)');
  process.exit(1);
}

if (mode === 'pause') console.log(JSON.stringify(pausePack(packId), null, 2));
else if (mode === 'resume') console.log(JSON.stringify(resumePack(packId), null, 2));
else console.log(JSON.stringify(readPackState(packId), null, 2));
