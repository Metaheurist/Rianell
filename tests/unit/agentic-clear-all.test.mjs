import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  clearAllAndUnload,
} from '../../scripts/dev/agentic-pipeline/clear-all.mjs';
import {
  AGENTIC_ROOT,
  ensureDir,
  packDir,
  readPackState,
  readRunAllState,
  writePackState,
  writeRunAllState,
} from '../../scripts/dev/agentic-pipeline/state.mjs';
import { writeProposal, emptyProposal } from '../../scripts/dev/agentic-pipeline/proposal.mjs';

test('clearAllAndUnload cancels run-all, wipes pending proposal, resets packs to idle', async () => {
  ensureDir(AGENTIC_ROOT);
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
