/**
 * Verify AI engine benchmark reports against ai-thresholds.json (--strict exits 1).
 */
import fs from 'fs';
import path from 'path';
import { getRepoRoot } from '../lib/toolkit-env.mjs';
import { loadAiThresholds } from '../lib/ai-engine-probes.mjs';

const SLUGS = ['ai-engine-package', 'ai-engine-layers', 'ai-engine-algos', 'ai-engine-rn'];

function checkRegression(slug, payload, thresholds) {
  const failures = [];
  const histPath = path.join(getRepoRoot(), 'benchmarks', slug, 'history.json');
  if (!fs.existsSync(histPath)) return failures;
  let prev = [];
  try {
    prev = JSON.parse(fs.readFileSync(histPath, 'utf8'));
  } catch {
    return failures;
  }
  const prior = prev.find((r) => r.status === 'ok');
  if (!prior) return failures;

  const reg = thresholds.regression || {};
  if (slug === 'ai-engine-layers') {
    const curFwd = payload.probes?.find((p) => p.probe_id === 'forward_full' && p.fixture === 'logs_30');
    const prevFwd = prior.probes?.find((p) => p.probe_id === 'forward_full' && p.fixture === 'logs_30');
    if (curFwd?.ms && prevFwd?.ms && reg.forward_full_delta_pct) {
      const delta = ((curFwd.ms - prevFwd.ms) / prevFwd.ms) * 100;
      if (delta > reg.forward_full_delta_pct) {
        failures.push(`forward_full regression +${delta.toFixed(1)}%`);
      }
    }
    const curInput = payload.probes?.find((p) => p.probe_id === 'layerInput' && p.fixture === 'logs_30');
    const prevInput = prior.probes?.find((p) => p.probe_id === 'layerInput' && p.fixture === 'logs_30');
    if (curInput?.ms && prevInput?.ms && reg.layerInput_delta_pct) {
      const delta = ((curInput.ms - prevInput.ms) / prevInput.ms) * 100;
      if (delta > reg.layerInput_delta_pct) {
        failures.push(`layerInput regression +${delta.toFixed(1)}%`);
      }
    }
  }
  return failures;
}

function main() {
  const strict = process.argv.includes('--strict');
  const repoRoot = getRepoRoot();
  const thresholds = loadAiThresholds();
  let allFailures = [];

  for (const slug of SLUGS) {
    const p = path.join(repoRoot, 'benchmarks', slug, 'latest.run.json');
    if (!fs.existsSync(p)) {
      if (strict) allFailures.push(`missing ${slug}/latest.run.json`);
      continue;
    }
    const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (payload.status !== 'ok') allFailures.push(`${slug} status ${payload.status}`);
    for (const probe of payload.probes || []) {
      if (probe.status === 'fail') {
        allFailures.push(`${slug}/${probe.fixture}/${probe.probe_id}`);
      }
    }
    if (payload.meta?.llm_blocked === false && slug.startsWith('ai-engine-') && slug !== 'ai-engine-package' && slug !== 'ai-engine-rn') {
      allFailures.push(`${slug} meta.llm_blocked !== true`);
    }
    allFailures.push(...checkRegression(slug, payload, thresholds));
  }

  if (allFailures.length) {
    console.error('[verify-ai-engine] failures:', allFailures);
    if (strict) process.exit(1);
  } else {
    console.log('[verify-ai-engine] ok');
  }
}

main();
