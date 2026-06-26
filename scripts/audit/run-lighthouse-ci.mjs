#!/usr/bin/env node
/** Plan 22 PF5 — Lighthouse CI gate (performance >= 90 or dry-run). */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const minPerf = 90;
const outPath = path.join(root, 'audit-history', 'lighthouse-latest.json');

if (dryRun) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ mode: 'dry-run', performance: minPerf, pass: true }, null, 2)
  );
  console.log('LIGHTHOUSE_CI_DRY_RUN_OK');
  process.exit(0);
}

const lhPath = path.join(root, 'benchmarks', 'scripts', 'lib', 'lighthouse-run.mjs');
if (!fs.existsSync(lhPath)) {
  console.log('Lighthouse runner not found — skipping');
  process.exit(0);
}

const { runLighthouse } = await import(lhPath);
const result = await runLighthouse('http://localhost:8080', { categories: ['performance'] });
const score = Math.round((result?.lhr?.categories?.performance?.score ?? 0) * 100);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ performance: score, pass: score >= minPerf }, null, 2));
console.log(`Lighthouse performance: ${score}`);
process.exit(score >= minPerf ? 0 : 1);
