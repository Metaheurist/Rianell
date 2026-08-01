import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalogPath = path.join(root, 'scripts/dev/agentic-pipeline/model-catalog.json');

test('model-catalog has 16 packs and locked runAllOrder', () => {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const packs = Object.keys(catalog.packs);
  assert.equal(packs.length, 16);
  assert.deepEqual(catalog.runAllOrder, [
    'design', 'planning', 'i18n', 'rtl', 'a11y', 'seo', 'privacy', 'security',
    'deps', 'migration', 'changelog', 'wikisync', 'image', 'bootllm', 'perf', 'visual',
  ]);
  for (const id of catalog.runAllOrder) {
    assert.ok(catalog.packs[id], `missing pack ${id}`);
    assert.ok(catalog.packs[id].recommended, `${id} needs recommended`);
    assert.ok(Array.isArray(catalog.packs[id].allowed));
    assert.ok(catalog.packs[id].allowed.includes(catalog.packs[id].recommended));
  }
});

test('72b is rejected as default in models map', () => {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.models['qwen2.5:72b-instruct-q3_k_m'].rejectedDefault, true);
});
