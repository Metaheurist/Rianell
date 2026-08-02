import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-agentic-i18n-'));
process.env.AGENTIC_ROOT = tmpRoot;

const {
  loadI18nFillPlannedItems,
  buildPackActivity,
} = await import('../../scripts/dev/agentic-pipeline/activity.mjs');
const { packDir, ensureDir } = await import('../../scripts/dev/agentic-pipeline/state.mjs');

const dir = packDir('i18n');
const proposeDir = path.join(dir, 'fill-proposals');
const progressPath = path.join(dir, 'fill-progress.json');

after(() => {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch { /* ignore */ }
  delete process.env.AGENTIC_ROOT;
});

test('loadI18nFillPlannedItems includes pending missing keys', () => {
  ensureDir(proposeDir);
  fs.writeFileSync(path.join(proposeDir, 'pt-BR.json'), `${JSON.stringify({
    locale: 'pt-BR',
    entries: [
      { key: 'ui.hello', sourceEn: 'Hello', proposed: null, status: 'pending' },
      { key: 'ui.bye', sourceEn: 'Bye', proposed: 'Tchau', status: 'ok' },
    ],
  }, null, 2)}\n`);
  const items = loadI18nFillPlannedItems('i18n');
  assert.ok(items.length >= 2);
  const pending = items.find((it) => it.key === 'ui.hello');
  const filled = items.find((it) => it.key === 'ui.bye');
  assert.ok(pending);
  assert.equal(pending.selected, false);
  assert.match(pending.title, /missing/);
  assert.equal(filled.selected, true);
  assert.equal(filled.proposed, 'Tchau');
});

test('buildPackActivity surfaces live fill-proposals while filling', () => {
  ensureDir(proposeDir);
  fs.writeFileSync(path.join(proposeDir, 'pt-BR.json'), `${JSON.stringify({
    locale: 'pt-BR',
    entries: [
      { key: 'nav.home', sourceEn: 'Home', proposed: null, status: 'pending' },
    ],
  }, null, 2)}\n`);
  fs.writeFileSync(progressPath, `${JSON.stringify({
    locale: 'pt-BR', done: 0, total: 1, phase: 'filling',
  }, null, 2)}\n`);
  const act = buildPackActivity('i18n');
  assert.ok(act.planned.items.length >= 1);
  assert.match(act.planned.summary, /missing|translated/i);
  assert.equal(act.planned.status, 'filling');
  assert.ok(act.planned.items.some((it) => it.key === 'nav.home'));
});
