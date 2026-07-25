import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadStatusModuleWithTempQa(tmpQa) {
  // Re-import won't remount paths; test pure helpers via dynamic copy isn't needed —
  // we call deriveQaStatus after writing files into the real qa dir would pollute.
  // Instead, unit-test labels + logic by importing and stubbing via env is unavailable.
  // So we test against the module's exported functions with temp files by
  // temporarily writing into artifacts path under a sandbox via monkeypatch?
  // Simplest: exercise qaStageLabel always, and deriveQaStatus against real paths
  // using isolated temp by spawning a tiny inline module that redefines paths.
  const src = fs.readFileSync(
    path.join('scripts/dev/visual-polish-qa-status.mjs'),
    'utf8',
  );
  const patched = src
    .replace(
      /export const QA_ROOT = path\.join\(root, 'artifacts\/visual-gen\/qa'\);/,
      `export const QA_ROOT = ${JSON.stringify(tmpQa)};`,
    )
    .replace(
      /export const QA_PROGRESS_PATH = path\.join\(QA_ROOT, 'progress\.json'\);/,
      'export const QA_PROGRESS_PATH = path.join(QA_ROOT, \'progress.json\');',
    )
    .replace(
      /export const QA_REPORT_PATH = path\.join\(QA_ROOT, 'report\.json'\);/,
      'export const QA_REPORT_PATH = path.join(QA_ROOT, \'report.json\');',
    )
    .replace(
      /export const QA_BROKEN_PATH = path\.join\(QA_ROOT, 'broken\.json'\);/,
      'export const QA_BROKEN_PATH = path.join(QA_ROOT, \'broken.json\');',
    );
  const modPath = path.join(tmpQa, `_qa-status-${Date.now()}.mjs`);
  fs.mkdirSync(tmpQa, { recursive: true });
  fs.writeFileSync(modPath, patched);
  return import(pathToFileURL(modPath).href);
}

test('qaStageLabel covers core UI Q&A stages', async () => {
  const { qaStageLabel } = await import('../../../scripts/dev/visual-polish-qa-status.mjs');
  assert.match(qaStageLabel('screenshot-cards'), /UI Q&A/);
  assert.match(qaStageLabel('gemma-vision'), /Gemma/);
  assert.match(qaStageLabel('passed'), /all pass/i);
});

test('deriveQaStatus prefers active progress heartbeat', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-qa-status-'));
  const mod = await loadStatusModuleWithTempQa(tmp);
  mod.writeQaProgress({
    active: true,
    stage: 'gemma-vision',
    current: 40,
    total: 200,
    unit: 'icons',
    detail: 'sprite:icon-user',
    brokenSoFar: 3,
  });
  const st = mod.deriveQaStatus({ pending: 0, polished: 200, eligible: 200 });
  assert.equal(st.stage, 'gemma-vision');
  assert.equal(st.active, true);
  assert.equal(st.current, 40);
  assert.equal(st.total, 200);
  assert.equal(st.pct, 20);
  assert.match(st.label, /Gemma|Q&A/i);
});

test('deriveQaStatus falls back to polish when pending and idle', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-qa-status-'));
  const mod = await loadStatusModuleWithTempQa(tmp);
  const st = mod.deriveQaStatus({ pending: 12, polished: 88, eligible: 100 });
  assert.equal(st.stage, 'polish');
  assert.equal(st.current, 88);
  assert.equal(st.total, 100);
});

test('deriveQaStatus keeps Pass N during re-polish pending', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-qa-status-'));
  const mod = await loadStatusModuleWithTempQa(tmp);
  mod.writeQaProgress({
    active: false,
    stage: 'needs-fix',
    round: 2,
    maxRounds: 8,
    brokenSoFar: 40,
    detail: '40 broken',
  });
  fs.writeFileSync(
    path.join(tmp, 'report.json'),
    JSON.stringify({
      at: '2026-07-23T01:00:00.000Z',
      scanned: 100,
      passed: 60,
      brokenCount: 40,
    }),
  );
  fs.writeFileSync(
    path.join(tmp, 'broken.json'),
    JSON.stringify({ at: '2026-07-23T01:00:00.000Z', ids: ['a'], reasons: {} }),
  );
  const st = mod.deriveQaStatus({ pending: 40, polished: 60, eligible: 100 });
  assert.equal(st.stage, 'repolish');
  assert.equal(st.round, 2);
  assert.equal(st.maxRounds, 8);
  assert.equal(st.passLabel, 'Pass 2 (max 8)');
  assert.match(st.label, /Pass 2/);
  assert.match(st.detail, /Pass 2/);
});

test('formatQaPass + writeQaProgress preserve round across stage flips', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-qa-status-'));
  const mod = await loadStatusModuleWithTempQa(tmp);
  assert.equal(mod.formatQaPass(1, 8), 'Pass 1 (max 8)');
  mod.writeQaProgress({
    active: true,
    stage: 'screenshot-cards',
    round: 1,
    maxRounds: 8,
  });
  mod.writeQaProgress({
    active: false,
    stage: 'needs-fix',
    detail: 'broken',
  });
  const raw = JSON.parse(fs.readFileSync(path.join(tmp, 'progress.json'), 'utf8'));
  assert.equal(raw.round, 1);
  assert.equal(raw.maxRounds, 8);
  assert.match(raw.label, /Pass 1/);
});

test('deriveQaStatus uses last report when QA finished', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-qa-status-'));
  const mod = await loadStatusModuleWithTempQa(tmp);
  fs.writeFileSync(
    path.join(tmp, 'report.json'),
    JSON.stringify({
      at: '2026-07-22T12:00:00.000Z',
      scanned: 50,
      passed: 47,
      brokenCount: 3,
      gemmaVision: true,
    }),
  );
  const st = mod.deriveQaStatus({ pending: 0, polished: 50, eligible: 50 });
  assert.equal(st.stage, 'needs-fix');
  assert.equal(st.reportBroken, 3);
  assert.equal(st.pct, Math.round((47 / 50) * 100));
});

test('live preview HTML exposes UI Q&A stage chrome', () => {
  const html = fs.readFileSync('scripts/dev/visual-polish-live-preview.html', 'utf8');
  assert.match(html, /id="qaStrip"/);
  assert.match(html, /id="hudQa"/);
  assert.match(html, /id="hqPass"/);
  assert.match(html, /function paintQa/);
  assert.match(html, /UI Q&amp;A stage/);
  assert.match(html, /passLabel|Pass /);
});

test('live preview API wires deriveQaStatus', () => {
  const src = fs.readFileSync('scripts/dev/visual-polish-live-preview.mjs', 'utf8');
  assert.match(src, /deriveQaStatus/);
  assert.match(src, /qa:\s*deriveQaStatus/);
});

test('screenshot-qa writes progress heartbeats', () => {
  const src = fs.readFileSync('scripts/dev/visual-polish-screenshot-qa.mjs', 'utf8');
  assert.match(src, /writeQaProgress/);
  assert.match(src, /screenshot-cards/);
  assert.match(src, /gemma-vision/);
});
