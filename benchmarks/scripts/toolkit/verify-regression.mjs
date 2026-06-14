/**
 * Verify tier-matrix / settings-matrix against thresholds.json (--strict exits 1).
 */
import fs from 'fs';
import path from 'path';
import { getRepoRoot, loadThresholds } from '../lib/toolkit-env.mjs';

const SLUGS = ['tier-matrix', 'settings-matrix', 'full-suite'];

function checkRun(run, thresholds, slug) {
  const failures = [];
  const row = thresholds[slug]?.[run.id] || thresholds['tier-matrix']?.[run.id] || {};
  const aspects = run.aspects || {};
  if (row.cold_load_ms != null && aspects.cold_load_ms > row.cold_load_ms) {
    failures.push(`${run.id} cold_load_ms`);
  }
  if (row.ai_engine_ms != null && aspects.ai_engine_ms > row.ai_engine_ms) {
    failures.push(`${run.id} ai_engine_ms`);
  }
  if (row.ai_llm_network_requests != null && aspects.ai_llm_network_requests > row.ai_llm_network_requests) {
    failures.push(`${run.id} llm_network`);
  }
  if (row.max_errors != null && (run.console?.error || 0) > row.max_errors) {
    failures.push(`${run.id} console errors`);
  }
  return failures;
}

function main() {
  const strict = process.argv.includes('--strict');
  const repoRoot = getRepoRoot();
  const thresholds = loadThresholds();
  let allFailures = [];

  for (const slug of SLUGS) {
    const p = path.join(repoRoot, 'benchmarks', slug, 'latest.run.json');
    if (!fs.existsSync(p)) {
      if (strict) allFailures.push(`missing ${slug}/latest.run.json`);
      continue;
    }
    const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (payload.status !== 'ok') allFailures.push(`${slug} status ${payload.status}`);
    for (const run of payload.runs || []) {
      allFailures.push(...checkRun(run, thresholds, slug === 'settings-matrix' ? 'settings-matrix' : 'tier-matrix'));
      if (run.status === 'fail') allFailures.push(`${slug}/${run.id} failed`);
    }
  }

  if (allFailures.length) {
    console.error('[verify-regression] failures:', allFailures);
    if (strict) process.exit(1);
  } else {
    console.log('[verify-regression] ok');
  }
}

main();
