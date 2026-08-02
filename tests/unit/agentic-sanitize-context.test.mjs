import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeAgentContext,
  filterAllowedContextPaths,
} from '../../scripts/dev/sanitize-agent-context.mjs';

test('sanitizeAgentContext passes clean text', () => {
  const r = sanitizeAgentContext('Rianell architecture notes');
  assert.equal(r.ok, true);
  assert.equal(r.blocked, false);
  assert.match(r.text, /Rianell/);
});

test('sanitizeAgentContext redacts service_role', () => {
  const r = sanitizeAgentContext('key=service_role value here');
  assert.equal(r.ok, true);
  assert.match(r.text, /REDACTED_SECRET/);
  assert.ok(r.redactions.length >= 1);
});

test('sanitizeAgentContext redacts PHQ-9', () => {
  const r = sanitizeAgentContext('user completed phq-9 today');
  assert.match(r.text, /REDACTED_HEALTH/);
});

test('sanitizeAgentContext blocks .env paths', () => {
  const r = sanitizeAgentContext('anything', { sourcePath: 'security/.env' });
  assert.equal(r.blocked, true);
  assert.equal(r.ok, false);
});

test('filterAllowedContextPaths drops secrets', () => {
  const out = filterAllowedContextPaths([
    'docs/threat-model.md',
    'security/.encryption_key',
    'apps/pwa-webapp/app.js',
  ]);
  assert.deepEqual(out, ['docs/threat-model.md', 'apps/pwa-webapp/app.js']);
});
