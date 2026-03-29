import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ciYml = fs.readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('CI includes Security Headers report job after readme-build-info', () => {
  assert.match(ciYml, /security-headers-report:/);
  assert.match(ciYml, /needs:\s*\[[^\]]*readme-build-info[^\]]*\]/m);
  assert.match(ciYml, /fetch-securityheaders-report\.mjs/);
  assert.match(ciYml, /securityheaders\.com\/\?q=rianell\.com/);
  assert.match(ciYml, /security\/securityheaders-rianell\.com\.md/);
  assert.match(ciYml, /security\/securityheaders-runs\/run-/);
  assert.match(ciYml, /SECURITY_HEADERS_FALLBACK_SITE:\s*https:\/\/rianell\.com/);
  assert.match(ciYml, /SECURITY_HEADERS_LIVE_URLS:/);
});
