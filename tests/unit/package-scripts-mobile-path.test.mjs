import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('bundle:mobile:prod uses apps/rn-app path', () => {
  const script = String(pkg?.scripts?.['bundle:mobile:prod'] || '');
  assert.match(script, /apps\/rn-app/);
  assert.doesNotMatch(script, /apps\/mobile/);
});

