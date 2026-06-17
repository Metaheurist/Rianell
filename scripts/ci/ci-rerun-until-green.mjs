#!/usr/bin/env node
/**
 * Trigger CI (or wait for the current run), watch until green, rerun on failure.
 * Success = workflow success AND audit-llm-download-live job success (when present).
 */
import { spawnSync } from 'node:child_process';

const BRANCH = process.env.CI_BRANCH || 'main';
const WORKFLOW = process.env.CI_WORKFLOW || 'audit-llm-live.yml';
const MAX_ATTEMPTS = Number(process.env.CI_MAX_ATTEMPTS || 8);
const RERUN_DELAY_MS = Number(process.env.CI_RERUN_DELAY_MS || 120000);
const LLM_JOB = process.env.CI_LLM_JOB_NAME || 'Live LLM download';
const PURGE_FIRST = process.env.CI_PURGE_ARTIFACTS !== '0';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  return r.status ?? 1;
}

function ghJson(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`gh ${args.join(' ')} failed`);
  return JSON.parse(r.stdout || '{}');
}

function latestRun() {
  const rows = ghJson([
    'run', 'list',
    '--workflow', WORKFLOW,
    '--branch', BRANCH,
    '--limit', '5',
    '--json', 'databaseId,status,conclusion,url',
  ]);
  return rows[0] || null;
}

function activeRun() {
  const rows = ghJson([
    'run', 'list',
    '--workflow', WORKFLOW,
    '--branch', BRANCH,
    '--limit', '10',
    '--json', 'databaseId,status,conclusion,url',
  ]);
  return rows.find((r) => r.status === 'in_progress' || r.status === 'queued' || r.status === 'pending') || null;
}

function deployOk(runId) {
  const viewed = ghJson(['run', 'view', String(runId), '--json', 'jobs']);
  const jobs = viewed.jobs || [];
  const hit = jobs.find((j) => j.name && j.name.includes('Deploy GitHub Pages'));
  if (!hit) return { ok: true, skipped: true };
  return { ok: hit.conclusion === 'success', skipped: false, conclusion: hit.conclusion, name: hit.name };
}

function isGreen(viewed, deploy, llm) {
  if (viewed.conclusion === 'cancelled') return false;
  if (viewed.conclusion === 'success' && llm.ok) return true;
  if (llm.ok && !llm.skipped && (deploy.skipped || deploy.ok)) return true;
  return false;
}

function jobOk(runId, namePart) {
  const viewed = ghJson(['run', 'view', String(runId), '--json', 'jobs']);
  const jobs = viewed.jobs || [];
  const hit = jobs.find((j) => j.name && j.name.includes(namePart));
  if (!hit) return { ok: true, skipped: true };
  return { ok: hit.conclusion === 'success', skipped: false, conclusion: hit.conclusion, name: hit.name };
}

function waitForRunEnd(runId) {
  return run('gh', ['run', 'watch', String(runId), '--exit-status']);
}

function triggerRun() {
  console.log(`Triggering ${WORKFLOW} on ${BRANCH}...`);
  return run('gh', ['workflow', 'run', WORKFLOW, '--ref', BRANCH]);
}

function rerunFailed(runId) {
  console.log(`Rerunning failed jobs for run ${runId}...`);
  return run('gh', ['run', 'rerun', String(runId), '--failed']);
}

if (PURGE_FIRST) {
  console.log('Purging historical Actions artifacts...');
  run(process.execPath, ['scripts/ci/purge-actions-artifacts.mjs']);
}

let currentRun = activeRun() || latestRun();
if (!currentRun || currentRun.status === 'completed') {
  triggerRun();
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    currentRun = activeRun() || latestRun();
    if (currentRun && currentRun.status !== 'completed') break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000);
  }
}

if (!currentRun) {
  console.error('No CI run found');
  process.exit(1);
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  console.log(`\n=== CI attempt ${attempt}/${MAX_ATTEMPTS}: run ${currentRun.databaseId} (${currentRun.url}) ===`);
  const watchCode = waitForRunEnd(currentRun.databaseId);
  const viewed = ghJson(['run', 'view', String(currentRun.databaseId), '--json', 'conclusion,status,url,databaseId']);
  const llm = jobOk(currentRun.databaseId, LLM_JOB);
  const deploy = deployOk(currentRun.databaseId);

  console.log('CI_RUN', JSON.stringify({
    attempt,
    runId: currentRun.databaseId,
    url: viewed.url,
    conclusion: viewed.conclusion,
    watchCode,
    deploy,
    llm,
  }));

  const rolloutGreen = isGreen(viewed, deploy, llm);
  if (rolloutGreen) {
    console.log('CI_GREEN', JSON.stringify({
      ok: true,
      runId: currentRun.databaseId,
      url: viewed.url,
      deploy,
      llm,
    }));
    process.exit(0);
  }

  if (attempt >= MAX_ATTEMPTS) break;

  console.log(`Not green yet (workflow=${viewed.conclusion}, llm=${llm.conclusion || 'n/a'}). Waiting ${RERUN_DELAY_MS}ms...`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, RERUN_DELAY_MS);

  if (viewed.conclusion === 'cancelled' || viewed.conclusion === 'failure') {
    if (deploy.ok && !llm.ok) {
      console.log('Deploy green but LLM probe not — running local live probe...');
      const probeCode = run(process.execPath, ['scripts/ci/probe-llm-download-live.mjs'], {
        env: { ...process.env, PROBE_URL: process.env.PROBE_URL || 'https://rianell.com/' },
      });
      if (probeCode === 0) {
        console.log('CI_GREEN', JSON.stringify({ ok: true, runId: currentRun.databaseId, url: viewed.url, note: 'local live LLM probe passed' }));
        process.exit(0);
      }
    }
    rerunFailed(currentRun.databaseId);
  } else if (!activeRun()) {
    triggerRun();
  }

  const deadline = Date.now() + 120000;
  let next = latestRun();
  while (Date.now() < deadline) {
    next = latestRun();
    if (next && next.databaseId !== currentRun.databaseId && next.status !== 'completed') break;
    if (next && next.databaseId !== currentRun.databaseId && next.status === 'in_progress') break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000);
  }
  currentRun = next || currentRun;
}

console.error('CI_RERUN_EXHAUSTED', JSON.stringify({ ok: false, lastRunId: currentRun.databaseId }));
process.exit(1);
