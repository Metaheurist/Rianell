import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

test('auto-changelog script requires version flag', () => {
  const src = readFileSync(join(root, 'scripts/ci/auto-changelog.mjs'), 'utf8');
  assert.match(src, /--version/);
  assert.match(src, /CHANGELOG/);
});

test('MASTER sync script exists', () => {
  const src = readFileSync(join(root, 'scripts/ci/sync-master-progress.mjs'), 'utf8');
  assert.match(src, /MASTER/);
});
