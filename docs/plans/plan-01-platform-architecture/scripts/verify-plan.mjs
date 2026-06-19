#!/usr/bin/env node
/** Plan 01 pre-rollout verify — run from repo root: node docs/plans/plan-01-platform-architecture\scripts\verify-plan.mjs */
import { spawnSync } from 'node:child_process';
const steps = [
  { cmd: 'npm', args: ['run', 'test:unit'] },
  { cmd: 'npm', args: ['run', 'build:web'] },
  { cmd: 'npm', args: ['run', 'verify:root-hygiene'] },
];
for (const s of steps) {
  if (!s.cmd) continue;
  console.log('>', s.cmd, ...s.args);
  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('PLAN_VERIFY_OK');