import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthResidencyCode } from '../../../packages/shared/src/privacy/residencyRouting.mjs';
import { getResidencyRegistry } from '../../../packages/shared/src/privacy/residency-registry.mjs';

const registry = getResidencyRegistry({
  default: { supabaseUrl: 'https://one.example.supabase.co', anonKey: 'key' },
});

test('resolveAuthResidencyCode returns default with single registry', () => {
  assert.equal(resolveAuthResidencyCode('eea_uk', undefined, registry), 'default');
});

test('resolveAuthResidencyCode ignores user preference when single project', () => {
  assert.equal(resolveAuthResidencyCode('other', undefined, registry, 'us'), 'default');
});
