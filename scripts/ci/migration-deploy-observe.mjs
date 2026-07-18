#!/usr/bin/env node
/**
 * Phase 22 — deploy / observe fail-fast loop (local stages 1, 4–7; push/CI require operator).
 * Usage: npm run migrate:deploy-observe -- [--from-stage=N] [--dry-run]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fromIdx = args.indexOf('--from-stage');
const fromStage = fromIdx >= 0 ? Number(args[fromIdx + 1] || 1) : 1;

const STAGES = [
  { id: 'pre_push', label: 'Local verify', run: () => {
    runNpm('test:unit');
    runNode('scripts/verify/migration-complete.mjs');
  }},
  { id: 'push_main', label: 'Push main (manual)', run: () => {
    console.error('SKIP: merge/push to main — operator action');
  }},
  { id: 'ci_main', label: 'CI main green (manual)', run: () => {
    console.error('SKIP: poll gh run — operator action');
  }},
  { id: 'pages_deploy', label: 'Pages deploy probe', run: () => {
    console.error('SKIP: production HTTP probe — run after deploy');
  }},
  { id: 'pwa_warm_boot', label: 'PWA warm boot', run: () => {
    runNode('scripts/ci/deploy-probe-loop.mjs');
  }},
  { id: 'artifacts_manifests', label: 'Manifest JSON valid', run: () => {
    for (const rel of ['artifacts/Server/latest.json']) {
      const fp = path.join(root, rel);
      if (!fs.existsSync(fp)) throw new Error(`missing ${rel}`);
      JSON.parse(fs.readFileSync(fp, 'utf8'));
    }
  }},
];

function runNpm(script) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(cmd, ['run', script], {
    cwd: root, stdio: 'inherit', shell: /\.(cmd|bat)$/i.test(cmd),
  });
  if (r.status !== 0) throw new Error(`npm run ${script} failed`);
}

function runNode(rel) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${rel} failed`);
}

for (let i = fromStage - 1; i < STAGES.length; i++) {
  const s = STAGES[i];
  console.error(`\n[deploy-observe] Stage ${i + 1}: ${s.id} — ${s.label}`);
  if (dryRun) continue;
  try {
    s.run();
  } catch (e) {
    console.error(`STOP at stage ${i + 1} (${s.id}):`, e.message);
    process.exit(1);
  }
}

console.error('\n[deploy-observe] Local stages passed (remote stages require operator).');
process.exit(0);
