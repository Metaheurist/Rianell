import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadBrokenList,
  buildVisualPolishProposal,
  itemIdForVisualBroken,
  applyVisualRepolish,
} from '../../scripts/dev/agentic-pipeline/visual-qa-propose.mjs';
import { readModePrefs, writeModePrefs } from '../../scripts/dev/agentic-pipeline/mode-prefs.mjs';

/** Isolate mode.json so visualApplyAfterPolish prefs from a live dash don't flake tests. */
function withModePrefs(patch, fn) {
  const before = readModePrefs();
  try {
    writeModePrefs(patch);
    return fn();
  } finally {
    writeModePrefs(before);
  }
}

test('loadBrokenList reads { ids, reasons } shape', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-broken-'));
  const p = path.join(tmp, 'broken.json');
  fs.writeFileSync(p, JSON.stringify({
    at: '2026-01-01T00:00:00.000Z',
    ids: ['sprite:icon-a', 'sprite:icon-b'],
    reasons: { 'sprite:icon-a': ['seam'] },
  }));
  const got = loadBrokenList(p);
  assert.deepEqual(got.ids, ['sprite:icon-a', 'sprite:icon-b']);
  assert.equal(got.reasons['sprite:icon-a'][0], 'seam');
});

test('buildVisualPolishProposal creates visual_repolish items', () => {
  const qaRoot = path.join(process.cwd(), 'artifacts/visual-gen/qa');
  fs.mkdirSync(qaRoot, { recursive: true });
  const backup = path.join(qaRoot, `broken.test-backup-${Date.now()}.json`);
  const brokenPath = path.join(qaRoot, 'broken.json');
  let prev = null;
  if (fs.existsSync(brokenPath)) {
    prev = fs.readFileSync(brokenPath, 'utf8');
    fs.writeFileSync(backup, prev);
  }
  try {
    fs.writeFileSync(brokenPath, JSON.stringify({
      at: new Date().toISOString(),
      ids: ['sprite:test-visual-a'],
      reasons: { 'sprite:test-visual-a': ['unit-test'] },
    }));
    const prop = buildVisualPolishProposal({ dryRun: false, ranQa: true });
    assert.equal(prop.pack, 'visual');
    assert.equal(prop.status, 'pending_approval');
    assert.ok(prop.items.some((it) => it.kind === 'visual_repolish'));
    const it = prop.items.find((it) => it.visualId === 'sprite:test-visual-a');
    assert.ok(it);
    assert.equal(it.applyAdapter, 'visual-repolish');
    assert.equal(it.id, itemIdForVisualBroken('sprite:test-visual-a'));
  } finally {
    if (prev != null) fs.writeFileSync(brokenPath, prev);
    else if (fs.existsSync(brokenPath)) fs.unlinkSync(brokenPath);
    if (fs.existsSync(backup)) fs.unlinkSync(backup);
  }
});

test('buildVisualPolishProposal acks when no broken ids', () => {
  const qaRoot = path.join(process.cwd(), 'artifacts/visual-gen/qa');
  fs.mkdirSync(qaRoot, { recursive: true });
  const brokenPath = path.join(qaRoot, 'broken.json');
  let prev = null;
  if (fs.existsSync(brokenPath)) prev = fs.readFileSync(brokenPath, 'utf8');
  try {
    fs.writeFileSync(brokenPath, JSON.stringify({ ids: [], reasons: {} }));
    withModePrefs({ visualApplyAfterPolish: false, confirmProductWrite: false }, () => {
      const prop = buildVisualPolishProposal({ dryRun: true, ranQa: true });
      assert.equal(prop.status, 'dry_run');
      assert.equal(prop.items[0].kind, 'ack_only');
    });
  } finally {
    if (prev != null) fs.writeFileSync(brokenPath, prev);
  }
});

test('buildVisualPolishProposal offers visual_apply when amend prefs on and QA green', () => {
  const qaRoot = path.join(process.cwd(), 'artifacts/visual-gen/qa');
  fs.mkdirSync(qaRoot, { recursive: true });
  const brokenPath = path.join(qaRoot, 'broken.json');
  let prev = null;
  if (fs.existsSync(brokenPath)) prev = fs.readFileSync(brokenPath, 'utf8');
  try {
    fs.writeFileSync(brokenPath, JSON.stringify({ ids: [], reasons: {} }));
    withModePrefs({ visualApplyAfterPolish: true, confirmProductWrite: true }, () => {
      const prop = buildVisualPolishProposal({ dryRun: true, ranQa: true });
      assert.equal(prop.status, 'dry_run');
      assert.equal(prop.items[0].kind, 'visual_apply');
      assert.equal(prop.items[0].applyAdapter, 'visual-apply');
    });
  } finally {
    if (prev != null) fs.writeFileSync(brokenPath, prev);
  }
});

test('applyVisualRepolish writes approved-repolish-ids (spawn detached)', () => {
  const qaRoot = path.join(process.cwd(), 'artifacts/visual-gen/qa');
  fs.mkdirSync(qaRoot, { recursive: true });
  const brokenPath = path.join(qaRoot, 'broken.json');
  const approvedPath = path.join(qaRoot, 'approved-repolish-ids.json');
  let prevBroken = null;
  let prevApproved = null;
  if (fs.existsSync(brokenPath)) prevBroken = fs.readFileSync(brokenPath, 'utf8');
  if (fs.existsSync(approvedPath)) prevApproved = fs.readFileSync(approvedPath, 'utf8');
  const prevEnv = process.env.AGENTIC_VISUAL_TEST_NO_SPAWN;
  process.env.AGENTIC_VISUAL_TEST_NO_SPAWN = '1';
  try {
    const r = applyVisualRepolish([
      { visualId: 'sprite:unit-approve-a', title: 'sprite:unit-approve-a' },
      { visualId: 'sprite:unit-approve-b', title: 'sprite:unit-approve-b' },
    ]);
    assert.equal(r.ok, true);
    assert.equal(r.selected, 2);
    assert.equal(r.maxRounds, 8);
    assert.equal(r.deferred, true);
    const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
    assert.deepEqual(approved.ids, ['sprite:unit-approve-a', 'sprite:unit-approve-b']);
    const broken = JSON.parse(fs.readFileSync(brokenPath, 'utf8'));
    assert.deepEqual(broken.ids, approved.ids);
  } finally {
    if (prevEnv == null) delete process.env.AGENTIC_VISUAL_TEST_NO_SPAWN;
    else process.env.AGENTIC_VISUAL_TEST_NO_SPAWN = prevEnv;
    if (prevBroken != null) fs.writeFileSync(brokenPath, prevBroken);
    else if (fs.existsSync(brokenPath)) fs.unlinkSync(brokenPath);
    if (prevApproved != null) fs.writeFileSync(approvedPath, prevApproved);
    else if (fs.existsSync(approvedPath)) fs.unlinkSync(approvedPath);
  }
});
