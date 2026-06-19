#!/usr/bin/env node
/** Plan 05 pre-rollout verify — run from repo root: node docs/plans/plan-05-privacy-compliance\scripts\verify-plan.mjs */
import { spawnSync } from 'node:child_process';
const steps = [
  { cmd: 'npm', args: ['run', 'verify:privacy-docs'] },
  { cmd: process.execPath, args: ['scripts/verify/verify-no-service-role-in-clients.mjs'] },
];
for (const s of steps) {
  if (!s.cmd) continue;
  console.log('>', s.cmd, ...s.args);
  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('PLAN_VERIFY_OK');