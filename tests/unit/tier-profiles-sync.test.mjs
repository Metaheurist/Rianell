import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');

test('tier-profiles.json syncs with device-benchmark.js', () => {
  const exportScript = path.join(REPO, 'benchmarks', 'scripts', 'export-tier-profiles.mjs');
  const r = spawnSync('node', [exportScript], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const jsonPath = path.join(REPO, 'benchmarks', 'toolkit', 'tier-profiles.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(data.benchmark_version, 4);
  for (const table of ['mobile', 'desktop']) {
    assert.ok(data[table], table);
    for (let tier = 1; tier <= 5; tier++) {
      const p = data[table][tier];
      assert.ok(p, `${table} tier ${tier}`);
      assert.equal(typeof p.deferAI, 'boolean');
      assert.equal(typeof p.maxChartPoints, 'number');
      if (tier <= 2) assert.equal(p.deferAI, true);
      if (tier >= 3) assert.equal(p.deferAI, false);
    }
  }
});

test('god-mode-catalog matches data-god-mode ids in app.js', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(REPO, 'benchmarks', 'toolkit', 'god-mode-catalog.json'), 'utf8'),
  );
  const appJs = fs.readFileSync(path.join(REPO, 'apps', 'pwa-webapp', 'app.js'), 'utf8');
  for (const step of catalog.steps) {
    assert.ok(appJs.includes(`labelKey: '${step.id}'`), `missing labelKey ${step.id}`);
    assert.ok(appJs.includes('data-god-mode'), 'app.js should render data-god-mode attrs');
  }
});
