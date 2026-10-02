import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const VENDOR_DIR = 'apps/pwa-webapp/vendor/transformers';

test('vendor-transformers rewrites Vault-shaped s.Ident property access', () => {
  const src = readFileSync('scripts/build/vendor-transformers.mjs', 'utf8');
  assert.match(src, /neutralizeVaultShapedPropertyAccess/);
  assert.match(src, /\$1s\["\$2"\]/);
  assert.match(src, /\[A-Za-z0-9\]\{24\}/);
});

test('vendored transformers scripts have no HashiCorp Vault-shaped s.Ident', () => {
  const scripts = readdirSync(VENDOR_DIR).filter((name) => /\.m?js$/.test(name));
  assert.ok(scripts.includes('transformers.min.js'));
  for (const name of scripts) {
    assert.doesNotMatch(
      readFileSync(`${VENDOR_DIR}/${name}`, 'utf8'),
      /(^|[^A-Za-z0-9_$])s\.([A-Za-z0-9]{24})(?![A-Za-z0-9_$])/,
      name,
    );
  }
});

test('secret_scanning.yml ignores vendor transformers path', () => {
  const yml = readFileSync('.github/secret_scanning.yml', 'utf8');
  assert.match(yml, /paths-ignore:/);
  assert.match(yml, /apps\/pwa-webapp\/vendor\/transformers\/\*\*/);
});
