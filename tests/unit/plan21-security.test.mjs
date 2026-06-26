import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

test('DAST contract script exists', () => {
  const src = readFileSync(join(root, 'scripts/verify/verify-dast-contract.mjs'), 'utf8');
  assert.match(src, /DAST/);
});

test('CI workflow references security verify scripts', () => {
  const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.match(ci, /verify:csp|verify:llm-security|verify-no-service-role/);
});

test('llm security contract blocks commercial hosts', async () => {
  const { validateRemoteLlmEndpoint } = await import('@rianell/shared');
  const r = validateRemoteLlmEndpoint('https://api.openai.com/v1/chat');
  assert.equal(r.allowed, false);
});
