import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowlisted } from '../../scripts/i18n/i18n-audit-shared.mjs';

const allowlist = {
  exact: new Set(),
  patterns: [],
  files: {
    'apps/pwa-webapp/app.js': { exact: ['Install on Chrome'], patterns: ['^Upload your'] },
  },
};

test('app.js allowlist rules also cover modules extracted from app.js', () => {
  assert.equal(isAllowlisted('Install on Chrome', 'apps/pwa-webapp/modules/app/pwa-install-guide.js', allowlist), true);
  assert.equal(isAllowlisted('Upload your file', 'apps\\pwa-webapp\\modules\\app\\data.js', allowlist), true);
});

test('app.js allowlist rules do not leak into unrelated files', () => {
  assert.equal(isAllowlisted('Install on Chrome', 'apps/pwa-webapp/ui-feedback.js', allowlist), false);
  assert.equal(isAllowlisted('Install on Chrome', 'apps/pwa-webapp/modules/settings.js', allowlist), false);
});
