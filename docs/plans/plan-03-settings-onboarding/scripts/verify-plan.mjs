#!/usr/bin/env node
/** Plan 03 pre-rollout verify — run from repo root: node docs/plans/plan-03-settings-onboarding\scripts\verify-plan.mjs */
import { spawnSync } from 'node:child_process';
const steps = [
  { cmd: 'npm', args: ['run', 'parity:inventory:check'] },
  { cmd: 'npm', args: ['run', 'test:unit'] },
];
for (const s of steps) {
  if (!s.cmd) continue;
  console.log('>', s.cmd, ...s.args);
  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('PLAN_VERIFY_OK');