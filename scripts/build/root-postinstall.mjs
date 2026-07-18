#!/usr/bin/env node
/** Idempotent root postinstall — syncs LLM tier/ladder/runtime data into the PWA. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const stamp = path.join(root, 'node_modules', '.cache', 'rianell-root-postinstall.stamp');

function alreadyRan() {
  try {
    if (!fs.existsSync(stamp)) return false;
    const ageMs = Date.now() - fs.statSync(stamp).mtimeMs;
    return ageMs < 5 * 60 * 1000;
  } catch {
    return false;
  }
}

function markRan() {
  fs.mkdirSync(path.dirname(stamp), { recursive: true });
  fs.writeFileSync(stamp, `${Date.now()}\n`);
}

if (alreadyRan()) {
  process.exit(0);
}

const steps = [
  'node scripts/build/sync-llm-tier-benchmark.mjs',
  'node scripts/build/sync-llm-load-ladder.mjs',
  'node scripts/build/sync-llm-runtime-profiles.mjs',
];

for (const cmd of steps) {
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

markRan();
