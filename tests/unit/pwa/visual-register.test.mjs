import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
const indexPath = path.join(root, 'apps/pwa-webapp/index.html');

describe('visual-register', () => {
  it('exists and has atomic entries', () => {
    assert.ok(fs.existsSync(registerPath), 'visual-register.json must exist');
    const reg = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
    assert.ok(Array.isArray(reg.entries));
    assert.ok(reg.entries.length >= 500, `expected large register, got ${reg.entries.length}`);
    for (const e of reg.entries.slice(0, 50)) {
      assert.equal(e.atomicUnit, true);
      assert.ok(e.id);
      assert.ok(e.kind);
      assert.ok(e.promptMode === 'single-svg' || e.promptMode === 'single-anim' || e.genStatus === 'skip');
    }
  });

  it('covers every HTML sprite icon-* symbol', () => {
    const html = fs.readFileSync(indexPath, 'utf8');
    const m = html.match(/<svg[^>]*class="rianell-icon-sprite"[^>]*>([\s\S]*?)<\/svg>/i);
    assert.ok(m, 'sprite host');
    const ids = [...m[1].matchAll(/\bid=["'](icon-[^"']+)["']/g)].map((x) => x[1]);
    assert.equal(ids.length, 106);
    const reg = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
    const regIds = new Set(reg.entries.map((e) => e.id));
    for (const id of ids) {
      assert.ok(regIds.has(`sprite:${id}`), `missing sprite:${id}`);
    }
  });

  it('has separate emblem-badge and achievement entries for shared stems', () => {
    const reg = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
    const regIds = new Set(reg.entries.map((e) => e.id));
    assert.ok(regIds.has('emblem-badge:food_logging'));
    assert.ok(regIds.has('achievement:food_logging'));
    assert.ok(regIds.has('avatar:voidorb'));
    assert.ok(regIds.has('avatar-part:accessory-glasses'));
  });

  it('never batches multiple SVGs into one entry id namespace collision', () => {
    const reg = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
    const seen = new Set();
    for (const e of reg.entries) {
      assert.ok(!seen.has(e.id), `duplicate id ${e.id}`);
      seen.add(e.id);
    }
  });
});
