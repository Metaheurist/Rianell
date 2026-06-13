import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('RN supabase client uses secure storage adapter', () => {
  const src = readFileSync('apps/rn-app/src/cloud/supabaseClient.ts', 'utf8');
  assert.match(src, /supabaseAuthStorage/);
  assert.match(src, /secureStorageAdapter/);
  assert.doesNotMatch(src, /storage: AsyncStorage/);
});

test('bug report logs redact sensitive patterns', () => {
  const src = readFileSync('apps/rn-app/src/utils/bugReportLogs.ts', 'utf8');
  assert.match(src, /REDACT_PATTERNS/);
  assert.match(src, /redactSensitiveText/);
});
