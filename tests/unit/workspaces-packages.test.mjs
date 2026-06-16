import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { existsSync, identity } from '@rianell/shared';
import { getTeamIds } from '@rianell/tokens';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('workspace packages can be imported from root tests', () => {
  assert.equal(identity('ok'), 'ok');
  assert.deepEqual(getTeamIds(), ['mint', 'red-black', 'mono', 'rainbow']);
  assert.equal(existsSync(fs, new URL('../../package.json', import.meta.url)), true);
});

test('workspace layout includes PWA and build-tools', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.workspaces.includes('apps/pwa-webapp'));
  assert.ok(fs.existsSync(path.join(root, 'apps/pwa-webapp/package.json')));
  assert.ok(fs.existsSync(path.join(root, 'packages/build-tools/package.json')));
});

