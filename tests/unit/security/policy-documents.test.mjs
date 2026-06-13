import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPolicyDocumentsForRegion } from '../../../packages/shared/src/privacy/getPolicyDocuments.mjs';

test('getPolicyDocumentsForRegion returns docs for eea_uk', () => {
  const docs = getPolicyDocumentsForRegion('eea_uk');
  assert.ok(Array.isArray(docs));
  assert.ok(docs.length >= 2);
  assert.ok(docs.every((d) => d.id && d.title && d.summary));
});

test('getPolicyDocumentsForRegion uses other fallback', () => {
  const docs = getPolicyDocumentsForRegion('unknown');
  assert.ok(docs.length >= 1);
});

test('policy document ids are stable across regions', () => {
  const eu = getPolicyDocumentsForRegion('eea_uk').map((d) => d.id);
  const us = getPolicyDocumentsForRegion('us_ca').map((d) => d.id);
  assert.ok(eu.includes('global-baseline'));
  assert.ok(us.includes('global-baseline'));
});
