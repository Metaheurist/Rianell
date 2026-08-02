import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAllOrder } from '../../scripts/dev/agentic-pipeline/catalog.mjs';
import { PACK_HANDLERS } from '../../scripts/dev/agentic-pipeline/pack-handlers.mjs';
import { resolvePackModel } from '../../scripts/dev/agentic-pipeline/catalog.mjs';
import { sortJobsByModelGroup, modelGroupRanks } from '../../scripts/dev/agentic-pipeline/apply-queue.mjs';

test('run-all order is exactly 16 packs (model-grouped)', () => {
  const order = runAllOrder();
  assert.deepEqual(order, [
    'design', 'planning', 'rtl', 'a11y', 'seo', 'privacy', 'security',
    'deps', 'migration', 'bootllm', 'perf',
    'changelog', 'wikisync', 'image',
    'i18n',
    'visual',
  ]);
});

test('every run-all pack has a handler', () => {
  for (const id of runAllOrder()) {
    assert.equal(typeof PACK_HANDLERS[id], 'function', id);
  }
});

test('run-all order keeps same recommended model contiguous', () => {
  const order = runAllOrder();
  const models = order.map((id) => resolvePackModel(id).model);
  // Count model switches — must be fewer than pack count - 1 (old order had more thrash).
  let switches = 0;
  for (let i = 1; i < models.length; i++) {
    if (models[i] !== models[i - 1]) switches += 1;
  }
  assert.ok(switches <= 4, `expected ≤4 model switches, got ${switches}: ${models.join(' → ')}`);
});

test('apply-queue sorts jobs by model group then pack order', () => {
  const order = runAllOrder();
  const ranks = modelGroupRanks(order);
  assert.ok(ranks.has('qwen2.5-coder:32b'));
  assert.ok(ranks.get('qwen2.5-coder:32b') < ranks.get('translategemma:27b'));

  const jobs = [
    { id: '1', packId: 'i18n', model: 'translategemma:27b', enqueuedAt: '2026-01-01T00:00:02Z', status: 'queued' },
    { id: '2', packId: 'design', model: 'qwen2.5-coder:32b', enqueuedAt: '2026-01-01T00:00:01Z', status: 'queued' },
    { id: '3', packId: 'changelog', model: 'qwen2.5-coder:14b', enqueuedAt: '2026-01-01T00:00:00Z', status: 'queued' },
    { id: '4', packId: 'rtl', model: 'qwen2.5-coder:32b', enqueuedAt: '2026-01-01T00:00:03Z', status: 'queued' },
  ];
  const sorted = sortJobsByModelGroup(jobs, order);
  assert.deepEqual(sorted.map((j) => j.packId), ['design', 'rtl', 'changelog', 'i18n']);
});
