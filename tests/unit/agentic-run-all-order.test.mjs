import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAllOrder } from '../../scripts/dev/agentic-pipeline/catalog.mjs';
import { PACK_HANDLERS } from '../../scripts/dev/agentic-pipeline/pack-handlers.mjs';

test('run-all order is exactly 16 packs', () => {
  const order = runAllOrder();
  assert.deepEqual(order, [
    'design', 'planning', 'i18n', 'rtl', 'a11y', 'seo', 'privacy', 'security',
    'deps', 'migration', 'changelog', 'wikisync', 'image', 'bootllm', 'perf', 'visual',
  ]);
});

test('every run-all pack has a handler', () => {
  for (const id of runAllOrder()) {
    assert.equal(typeof PACK_HANDLERS[id], 'function', id);
  }
});
