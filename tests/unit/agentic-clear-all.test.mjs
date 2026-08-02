import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-agentic-clear-'));
process.env.AGENTIC_ROOT = tmpRoot;

const {
  clearAllAndUnload,
  WORKER_CMD_PATTERNS,
} = await import('../../scripts/dev/agentic-pipeline/clear-all.mjs');
const {
  getAgenticRoot,
  ensureDir,
  packDir,
  readPackState,
  readRunAllState,
  writePackState,
  writeRunAllState,
} = await import('../../scripts/dev/agentic-pipeline/state.mjs');
const { writeProposal, emptyProposal } = await import('../../scripts/dev/agentic-pipeline/proposal.mjs');

after(() => {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch { /* ignore */ }
  delete process.env.AGENTIC_ROOT;
});

test('worker kill patterns match scripts, not agentic-*.test.mjs files', () => {
  const trap = 'tests/unit/agentic-run-all-order.test.mjs';
  for (const pat of WORKER_CMD_PATTERNS) {
    assert.ok(pat.endsWith('.mjs'), `pattern should be a script basename: ${pat}`);
    assert.equal(trap.includes(pat), false, `pattern ${pat} must not match ${trap}`);
  }
});

test('clearAllAndUnload cancels run-all, wipes pending proposal, resets packs to idle', async () => {
  assert.equal(getAgenticRoot(), tmpRoot);
  ensureDir(getAgenticRoot());
  writeRunAllState({
    status: 'running',
    stepIndex: 2,
    currentPack: 'i18n',
    order: ['design', 'planning', 'i18n'],
    results: { design: { ok: true, needsApproval: true } },
  });
  writePackState('design', {
    packId: 'design',
    status: 'pending_approval',
    model: 'qwen2.5-coder:32b',
    stage: 'pending_approval',
  });
  writeProposal('design', emptyProposal('design', {
    status: 'pending_approval',
    summary: 'test pending',
    items: [{
      id: 't1', kind: 'ack_only', title: 't', detail: '', risk: 'low',
      selected: true, applyAdapter: 'ack', targets: [],
    }],
  }));
  const proposeDir = path.join(packDir('i18n'), 'fill-proposals');
  fs.mkdirSync(proposeDir, { recursive: true });
  fs.writeFileSync(path.join(proposeDir, 'pt-BR.json'), '{"entries":[]}\n');

  const result = await clearAllAndUnload();
  assert.equal(result.ok, true);

  const run = readRunAllState();
  assert.equal(run.status, 'idle');
  assert.equal(run.currentPack, null);
  assert.deepEqual(run.results || {}, {});

  const design = readPackState('design');
  assert.equal(design.status, 'idle');
  assert.ok(!fs.existsSync(path.join(packDir('design'), 'proposal.json')));
  assert.ok(!fs.existsSync(path.join(proposeDir, 'pt-BR.json')));
});
