#!/usr/bin/env node
/**
 * Delete GitHub Actions workflow artifacts to free storage quota.
 * Keeps nothing by default — binaries live in GitHub Releases (APK/EXE only).
 *
 * Usage:
 *   node scripts/ci/purge-actions-artifacts.mjs
 *   KEEP_LATEST=3 node scripts/ci/purge-actions-artifacts.mjs
 */
import { spawnSync } from 'node:child_process';

const REPO = process.env.GITHUB_REPOSITORY || 'Metaheurist/Rianell';
const KEEP_LATEST = Number(process.env.KEEP_LATEST || 0);
const DRY_RUN = process.env.DRY_RUN === '1';

function ghJson(args) {
  const r = spawnSync('gh', ['api', ...args], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`gh api ${args.join(' ')} failed: ${(r.stderr || r.stdout || '').trim()}`);
  }
  return JSON.parse(r.stdout || '[]');
}

function ghDelete(path) {
  if (DRY_RUN) {
    console.log('DRY_RUN delete', path);
    return;
  }
  const r = spawnSync('gh', ['api', '-X', 'DELETE', path], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`delete ${path} failed: ${(r.stderr || r.stdout || '').trim()}`);
  }
}

const all = [];
let page = 1;
while (true) {
  const batch = ghJson([
    `repos/${REPO}/actions/artifacts`,
    '-f', `per_page=100`,
    '-f', `page=${page}`,
  ]);
  const items = batch.artifacts || [];
  all.push(...items);
  if (items.length < 100) break;
  page += 1;
}

all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
const toDelete = KEEP_LATEST > 0 ? all.slice(KEEP_LATEST) : all;

console.log(`artifacts: total=${all.length} delete=${toDelete.length} keep=${all.length - toDelete.length}`);
let deleted = 0;
for (const art of toDelete) {
  const mb = ((art.size_in_bytes || 0) / (1024 * 1024)).toFixed(1);
  console.log(`- ${art.name} #${art.id} (${mb} MB, run ${art.workflow_run?.id || '?'})`);
  ghDelete(`repos/${REPO}/actions/artifacts/${art.id}`);
  deleted += 1;
}
console.log(`purge-actions-artifacts: deleted ${deleted}`);
