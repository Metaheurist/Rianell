import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canStartPack } from '../../scripts/dev/agentic-pipeline/scheduler.mjs';

test('dry-run always allowed', () => {
  const r = canStartPack({ packId: 'security', mode: 'dry-run' });
  assert.equal(r.ok, true);
  assert.equal(r.dryRun, true);
});

test('serial blocks when another model loaded', () => {
  const r = canStartPack({
    packId: 'security',
    mode: 'serial',
    loaded: [{ packId: 'perf', model: 'qwen2.5-coder:32b', estVramGb: 19 }],
  });
  assert.equal(r.ok, false);
  assert.equal(r.schedulerReason, 'serial-occupied');
});

test('rejects unknown model for pack', () => {
  const r = canStartPack({ packId: 'i18n', model: 'qwen2.5-coder:32b', mode: 'parallel', loaded: [] });
  assert.equal(r.ok, false);
});

test('allows recommended security model in parallel with empty load', () => {
  const r = canStartPack({ packId: 'security', mode: 'parallel', loaded: [] });
  assert.equal(r.ok, true);
  assert.equal(r.model, 'qwen2.5-coder:32b');
});
