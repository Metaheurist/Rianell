import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAiEnginePayload } from '../../benchmarks/reporters/write-run-json.mjs';
import { FIXTURES, FIXTURE_IDS, getFixture } from '../../benchmarks/scripts/lib/ai-fixtures.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');

test('ai-engine-catalog has 15 layers, 12 algos, 5 exports', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(REPO, 'benchmarks', 'toolkit', 'ai-engine-catalog.json'), 'utf8'),
  );
  assert.equal(catalog.layers.length, 15);
  assert.equal(catalog.algos.length, 12);
  assert.equal(catalog.package_exports.length, 5);
  assert.ok(catalog.layers.some((l) => l.id === 'forward_full'));
  assert.ok(catalog.layers.some((l) => l.id === 'layerInput'));
});

test('ai-engine-catalog layer methods exist in AIEngine.js', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(REPO, 'benchmarks', 'toolkit', 'ai-engine-catalog.json'), 'utf8'),
  );
  const aiJs = fs.readFileSync(path.join(REPO, 'apps', 'pwa-webapp', 'AIEngine.js'), 'utf8');
  for (const layer of catalog.layers) {
    if (layer.id === 'forward_full') {
      assert.ok(aiJs.includes('this.forward = async function'), 'forward');
    } else {
      assert.ok(
        aiJs.includes(`this.${layer.method} =`),
        `missing layer method ${layer.method}`,
      );
    }
  }
  for (const algo of catalog.algos) {
    assert.ok(
      aiJs.includes(`${algo.call}:`) || aiJs.includes(`${algo.call} =`),
      `missing algo ${algo.call}`,
    );
  }
});

test('buildAiEnginePayload schema v4', () => {
  const payload = buildAiEnginePayload({
    slug: 'ai-engine-package',
    kind: 'ai_engine_package',
    meta: { git_sha: 'abc' },
    probes: [
      { fixture: 'logs_30', probe_id: 'analyzeHealthMetrics', probe_type: 'package_export', ms: 12, status: 'ok' },
    ],
  });
  assert.equal(payload.schema_version, 4);
  assert.equal(payload.status, 'ok');
  assert.equal(payload.meta.probe_count, 1);
});

test('ai-fixtures are deterministic and synthetic', () => {
  assert.equal(FIXTURE_IDS.length, 5);
  const a = getFixture('logs_30');
  const b = getFixture('logs_30');
  assert.deepEqual(a, b);
  assert.equal(a.length, 30);
  assert.equal(FIXTURES.logs_1200.length, 1200);
  const sparse = FIXTURES.sparse_no_food;
  assert.ok(sparse.every((l) => !l.food && !l.exercise));
});
