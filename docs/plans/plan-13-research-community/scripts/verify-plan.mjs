#!/usr/bin/env node
/** Plan 13 pre-rollout verify — run from repo root: node docs/plans/plan-13-research-community\scripts\verify-plan.mjs */
import { spawnSync } from 'node:child_process';
const steps = [
  { cmd: 'npm', args: ['run', 'test:unit'] },
  // manual: No PII in anonymized payload audit
];
for (const s of steps) {
  if (!s.cmd) continue;
  console.log('>', s.cmd, ...s.args);
  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('PLAN_VERIFY_OK');