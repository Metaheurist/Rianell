#!/usr/bin/env node
/** Plan 08 pre-rollout verify — run from repo root: node docs/plans/plan-08-llm-nlp\scripts\verify-plan.mjs */
import { spawnSync } from 'node:child_process';
const steps = [
  { cmd: 'npm', args: ['run', 'verify:llm-security'] },
  { cmd: process.execPath, args: ['scripts/test/llm-golden-prompts.mjs'] },
];
for (const s of steps) {
  if (!s.cmd) continue;
  console.log('>', s.cmd, ...s.args);
  const r = spawnSync(s.cmd, s.args, { stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('PLAN_VERIFY_OK');