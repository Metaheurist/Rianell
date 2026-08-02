import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadI18nFillPlannedItems,
  buildPackActivity,
} from '../../scripts/dev/agentic-pipeline/activity.mjs';
import { packDir, ensureDir } from '../../scripts/dev/agentic-pipeline/state.mjs';

const dir = packDir('i18n');
const proposeDir = path.join(dir, 'fill-proposals');
const progressPath = path.join(dir, 'fill-progress.json');
const backed = [];

function backup(p) {
  if (fs.existsSync(p)) {
    const bak = `${p}.bak-test`;
    fs.copyFileSync(p, bak);
    backed.push([p, bak]);
  } else {
    backed.push([p, null]);
  }
}

after(() => {
  for (const [p, bak] of backed.reverse()) {
    try {
      if (bak && fs.existsSync(bak)) {
        fs.copyFileSync(bak, p);
        fs.unlinkSync(bak);
      } else if (fs.existsSync(p) && path.basename(p).includes('pt-BR')) {
        fs.unlinkSync(p);
      }
    } catch { /* ignore */ }
  }
});

test('loadI18nFillPlannedItems includes pending missing keys', () => {
  ensureDir(proposeDir);
  backup(path.join(proposeDir, 'pt-BR.json'));
  backup(progressPath);
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
  backup(path.join(proposeDir, 'pt-BR.json'));
  backup(progressPath);
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
