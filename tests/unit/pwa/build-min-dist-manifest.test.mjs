import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDistManifest } from '../../../apps/pwa-webapp/build-min-dist.mjs';

test('dist asset-manifest names both hashed bundles for SW precache', () => {
  assert.deepEqual(buildDistManifest('app.abc.min.js', 'styles.def.css'), {
    mainJs: 'app.abc.min.js',
    mainCss: 'styles.def.css',
  });
});

test('dist asset-manifest omits mainCss when styles were not fingerprinted', () => {
  assert.deepEqual(buildDistManifest('app.min.js', null), { mainJs: 'app.min.js' });
});
