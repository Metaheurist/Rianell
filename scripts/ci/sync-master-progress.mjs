#!/usr/bin/env node
/** Plan 24 DC3 — sync MASTER progress summary counts from plan frontmatter. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const masterPath = path.join(root, 'docs/plans/MASTER.md');
const plansDir = path.join(root, 'docs/plans');
let done = 0;
for (const name of fs.readdirSync(plansDir)) {
  if (!name.startsWith('plan-')) continue;
  const planMd = path.join(plansDir, name, 'plan.md');
  if (!fs.existsSync(planMd)) continue;
  const text = fs.readFileSync(planMd, 'utf8');
  if (/status:\s*done/.test(text)) done += 1;
}
let master = fs.readFileSync(masterPath, 'utf8');
master = master.replace(
  /Execution plans complete \| \d+ \/ \d+/,
  `Execution plans complete | ${done} / 26`,
);
fs.writeFileSync(masterPath, master);
console.log(`MASTER_SYNC_OK plans_done=${done}`);
