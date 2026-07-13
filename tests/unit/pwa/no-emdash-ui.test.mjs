import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const EM = '\u2014';

function listJson(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) listJson(p, out);
    else if (e.name.endsWith('.json')) out.push(p);
  }
  return out;
}

test('locale and prompt packs do not use em dashes in UI copy', () => {
  const files = listJson('i18n-packs');
  assert.ok(files.length > 10, 'expected locale packs');
  const offenders = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (text.includes(EM)) offenders.push(file.replace(/\\/g, '/'));
  }
  assert.deepEqual(offenders, [], `em dash found in: ${offenders.join(', ')}`);
});

test('PWA fallback strings for watch footnote avoid em dashes', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /ai\.watch\.footnote/);
  assert.doesNotMatch(appJs, /Patterns in your logs only \u2014/);
  assert.match(appJs, /Patterns in your logs only - not a diagnosis/);
});
