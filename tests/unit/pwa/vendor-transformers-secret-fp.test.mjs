import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('vendor-transformers rewrites Vault-shaped s.Ident property access', () => {
  const src = readFileSync('scripts/build/vendor-transformers.mjs', 'utf8');
  assert.match(src, /neutralizeVaultShapedPropertyAccess/);
  assert.match(src, /\$1s\["\$2"\]/);
  assert.match(src, /\[A-Za-z0-9\]\{24\}/);
});

test('vendored transformers.min.mjs has no HashiCorp Vault-shaped s.Ident', () => {
  const bundle = readFileSync(
    'apps/pwa-webapp/vendor/transformers/transformers.min.mjs',
    'utf8',
  );
  assert.doesNotMatch(
    bundle,
    /(^|[^A-Za-z0-9_$])s\.([A-Za-z0-9]{24})(?![A-Za-z0-9_$])/,
  );
  assert.match(bundle, /s\["DebertaV2PreTrainedModel"\]/);
});

test('secret_scanning.yml ignores vendor transformers path', () => {
  const yml = readFileSync('.github/secret_scanning.yml', 'utf8');
  assert.match(yml, /paths-ignore:/);
  assert.match(yml, /apps\/pwa-webapp\/vendor\/transformers\/\*\*/);
});
