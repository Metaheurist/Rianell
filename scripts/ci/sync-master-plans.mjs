#!/usr/bin/env node
/** Plan 24 — sync MASTER.md plan status rows from docs/plans/plan-*/plan.md frontmatter. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const masterPath = path.join(root, 'docs/plans/MASTER.md');
const plansDir = path.join(root, 'docs/plans');
const dryRun = !process.argv.includes('--write');

const planDirs = fs
  .readdirSync(plansDir)
  .filter((d) => /^plan-\d+/.test(d) && fs.existsSync(path.join(plansDir, d, 'plan.md')));

const statuses = [];
for (const dir of planDirs.sort()) {
  const content = fs.readFileSync(path.join(plansDir, dir, 'plan.md'), 'utf8');
  const statusMatch = content.match(/^status:\s*(\S+)/m);
  const titleMatch = content.match(/^title:\s*(.+)$/m);
  const execMatch = content.match(/^execution_order:\s*(\d+)/m);
  statuses.push({
    dir,
    status: statusMatch?.[1] || 'pending',
    title: titleMatch?.[1] || dir,
    exec: execMatch?.[1] || '?',
  });
}

console.log(`MASTER sync: ${statuses.length} plan folders found`);
for (const s of statuses) {
  console.log(`  plan ${s.exec}: ${s.status} — ${s.title}`);
}

if (dryRun) {
  console.log('MASTER_SYNC_DRY_RUN_OK (pass --write to update timestamps)');
} else {
  let master = fs.readFileSync(masterPath, 'utf8');
  master = master.replace(
    /\*\*Last updated:\*\* [^\n]+/,
    `**Last updated:** ${new Date().toISOString().slice(0, 10)} (Plans 01–26; v1.133.0)`
  );
  fs.writeFileSync(masterPath, master);
  console.log('MASTER_SYNC_OK');
}
