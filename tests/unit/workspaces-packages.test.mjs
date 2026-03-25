import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { existsSync, identity } from '@rianell/shared';
import { getTeamIds } from '@rianell/tokens';

test('workspace packages can be imported from root tests', () => {
  assert.equal(identity('ok'), 'ok');
  assert.deepEqual(getTeamIds(), ['mint', 'red-black', 'mono', 'rainbow']);
  assert.equal(existsSync(fs, new URL('../../package.json', import.meta.url)), true);
});

