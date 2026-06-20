#!/usr/bin/env node
/**
 * Watch the main CI workflow after push. Exit 0 when green, 1 on failure/cancel/timeout.
 * Usage: node scripts/projects/watch-ci-main.mjs [run-id]
 * Env: CI_BRANCH=main, CI_WORKFLOW=ci.yml, CI_WATCH_TIMEOUT_MS=3600000
 */
import { spawnSync } from 'node:child_process';

const BRANCH = process.env.CI_BRANCH || 'main';
const WORKFLOW = process.env.CI_WORKFLOW || 'ci.yml';
const TIMEOUT_MS = Number(process.env.CI_WATCH_TIMEOUT_MS || 3600000);
const POLL_MS = Number(process.env.CI_POLL_MS || 5000);
const runIdArg = process.argv[2] || process.env.GH_RUN_ID;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return r.status ?? 1;
}

function ghJson(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`gh ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout || '[]');
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function latestRun() {
  const rows = ghJson([
    'run', 'list',
    '--workflow', WORKFLOW,
    '--branch', BRANCH,
    '--limit', '5',
    '--json', 'databaseId,status,conclusion,url,headSha,createdAt',
  ]);
  return rows[0] || null;
}

function resolveRunId() {
  if (runIdArg) return String(runIdArg);
  const deadline = Date.now() + 300000;
  let last = null;
  while (Date.now() < deadline) {
    const row = latestRun();
    if (row && (row.status === 'queued' || row.status === 'in_progress' || row.status === 'pending')) {
      return String(row.databaseId);
    }
    if (row && row.status === 'completed' && row !== last) {
      // Very recent completed run — may be from this push
      const age = Date.now() - new Date(row.createdAt).getTime();
      if (age < 120000) return String(row.databaseId);
    }
    last = row;
    sleep(POLL_MS);
  }
  const fallback = latestRun();
  if (!fallback) throw new Error('No CI run found for watch');
  return String(fallback.databaseId);
}

const runId = resolveRunId();
console.log(`Watching ${WORKFLOW} on ${BRANCH}, run ${runId}...`);

const watchStart = Date.now();
const watchCode = run('gh', ['run', 'watch', runId, '--exit-status']);
if (Date.now() - watchStart > TIMEOUT_MS) {
  console.error('CI_WATCH_TIMEOUT');
  process.exit(1);
}

const viewed = ghJson(['run', 'view', runId, '--json', 'conclusion,status,url,jobs']);
const failed = (viewed.jobs || []).filter((j) => j.conclusion === 'failure');
const cancelled = viewed.conclusion === 'cancelled';

console.log('CI_WATCH_RESULT', JSON.stringify({
  runId,
  url: viewed.url,
  conclusion: viewed.conclusion,
  watchCode,
  failedJobs: failed.map((j) => j.name),
}));

if (viewed.conclusion === 'success' && watchCode === 0) {
  console.log('CI_GREEN');
  process.exit(0);
}

if (cancelled) {
  console.error('CI cancelled — investigate gate jobs (unit-tests, deploy-pages, audit-boot-post-deploy).');
  process.exit(1);
}

console.error('CI failed — fix locally, re-run post-plan-gate, commit, push, watch again.');
for (const j of failed) {
  console.error(`  FAILED: ${j.name}`);
  run('gh', ['run', 'view', runId, '--log-failed']);
  break;
}
process.exit(watchCode || 1);
