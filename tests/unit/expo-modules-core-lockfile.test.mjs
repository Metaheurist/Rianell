import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '../..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

test('expo-modules-core is pinned to 55.0.25 (no nested SDK 56 under apps/rn-app)', () => {
  const nested = lock.packages?.['apps/rn-app/node_modules/expo-modules-core'];
  if (nested) {
    assert.equal(
      nested.version,
      '55.0.25',
      'apps/rn-app must not install expo-modules-core 56.x against Expo SDK 55 / RN 0.83',
    );
  }

  const rootPkg = lock.packages?.['node_modules/expo-modules-core'];
  assert.ok(rootPkg, 'root expo-modules-core entry missing from lockfile');
  assert.equal(rootPkg.version, '55.0.25');
});
