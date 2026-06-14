/**
 * Full benchmark suite orchestrator.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRepoRoot, benchmarkMeta } from '../lib/toolkit-env.mjs';
import { buildTierMatrixPayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeTierMatrixMd } from '../../reporters/write-tier-matrix-md.mjs';
import { prepareSite } from './prepare-site.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runNode(scriptName, env = {}, extraArgs = []) {
  const script = path.join(__dirname, scriptName);
  const r = spawnSync('node', [script, ...extraArgs], {
    cwd: getRepoRoot(),
    stdio: 'inherit',
    env: { ...process.env, BENCHMARK_SKIP_BUILD: '1', ...env },
  });
  if (r.status !== 0) throw new Error(`${scriptName} exited ${r.status}`);
}

function readSlugStatus(slug) {
  const p = path.join(getRepoRoot(), 'benchmarks', slug, 'latest.run.json');
  if (!fs.existsSync(p)) return { slug, status: 'missing' };
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { slug, status: j.status || 'unknown' };
}

async function main() {
  prepareSite();
  const strict = process.argv.includes('--strict');

  const steps = [
    ['run-tier-matrix.mjs', {}, []],
    ['run-settings-matrix.mjs', {}, []],
    ['run-user-journey.mjs', { TIER_MATRIX_FILTER: '3' }, []],
    ['run-from-source.mjs', {}, []],
    ['run-god-mode-suite.mjs', {}, []],
    ['verify-regression.mjs', {}, strict ? ['--strict'] : []],
  ];

  const results = [];
  for (const [script, env, extraArgs] of steps) {
    try {
      runNode(script, env, extraArgs || []);
      results.push({ step: script, status: 'ok' });
    } catch (e) {
      results.push({ step: script, status: 'fail', error: String(e.message) });
    }
  }

  const slugs = ['tier-matrix', 'settings-matrix', 'user-journey-suite', 'source-built', 'god-mode-suite'];
  const slugStatuses = slugs.map(readSlugStatus);
  const allOk = slugStatuses.every((s) => s.status === 'ok') && results.every((r) => r.status === 'ok');

  const payload = buildTierMatrixPayload({
    slug: 'full-suite',
    meta: benchmarkMeta({ orchestrator: 'run-full-suite.mjs' }),
    runs: slugStatuses.map((s) => ({
      id: s.slug,
      tier: null,
      platformType: 'all',
      aspects: {},
      status: s.status === 'ok' ? 'ok' : 'fail',
    })),
    kind: 'full_suite',
    optimization: { steps: results },
  });
  payload.status = allOk ? 'ok' : 'fail';

  writeLatestRunJson(getRepoRoot(), 'full-suite', payload);
  writeTierMatrixMd(getRepoRoot(), payload);

  if (!allOk) process.exit(1);
  console.log('full-suite: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
