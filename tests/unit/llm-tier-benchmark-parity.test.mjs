import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { msPer200kToTier, tierToLlmModelSize } from '../../packages/llm/src/tier-benchmark.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const syncPath = join(root, 'apps', 'pwa-webapp', 'llm-tier-benchmark-sync.js');

test('msPer200kToTier boundaries', () => {
  assert.equal(msPer200kToTier(8), 5);
  assert.equal(msPer200kToTier(8.1), 4);
  assert.equal(msPer200kToTier(26.1), 1);
});

test('tierToLlmModelSize maps 1-5', () => {
  assert.equal(tierToLlmModelSize(1), 'tier1');
  assert.equal(tierToLlmModelSize(5), 'tier5');
  assert.equal(tierToLlmModelSize('tier4'), 'tier4');
});

test('sync file exists and exposes RianellLlmTierBenchmark', () => {
  const src = readFileSync(syncPath, 'utf8');
  assert.match(src, /RianellLlmTierBenchmark/);
  assert.match(src, /msPer200kToTier/);
});
