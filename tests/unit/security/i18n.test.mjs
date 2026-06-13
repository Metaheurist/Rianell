import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  t,
  createTranslator,
} from '../../../packages/shared/src/i18n/translate.mjs';
import {
  getDefaultLocaleForRegion,
  resolveActiveLocale,
  applyRegionDefaultLocale,
} from '../../../packages/shared/src/i18n/resolveLocale.mjs';
import { loadCatalogsFromDisk } from '../../../packages/shared/src/i18n/loadCatalogs.mjs';
import { DEFAULT_LOCALE, DEFAULT_PRIVACY_REGION } from '../../../packages/shared/src/i18n/locales.mjs';

const catalogs = loadCatalogsFromDisk();

test('t returns en-GB string for gate.title', () => {
  assert.equal(t('gate.title', 'en-GB', catalogs), 'Privacy region');
});

test('t falls back to en-GB for missing key in partial locale', () => {
  const val = t('gate.title', 'fr-FR', catalogs);
  assert.ok(typeof val === 'string' && val.length > 0);
});

test('getDefaultLocaleForRegion maps eea_uk to en-GB', () => {
  assert.equal(getDefaultLocaleForRegion('eea_uk'), 'en-GB');
});

test('getDefaultLocaleForRegion maps br to pt-BR', () => {
  assert.equal(getDefaultLocaleForRegion('br'), 'pt-BR');
});

test('resolveActiveLocale prefers explicit uiLocale', () => {
  assert.equal(resolveActiveLocale({ uiLocale: 'de-DE', privacyRegion: 'eea_uk' }), 'de-DE');
});

test('applyRegionDefaultLocale sets locale from region on onboarding', () => {
  const next = applyRegionDefaultLocale({ privacyRegion: '' }, 'us_ca');
  assert.equal(next.uiLocale, 'en-US');
  assert.equal(next.uiLocaleSource, 'region');
});

test('createTranslator interpolates params', () => {
  const tr = createTranslator(catalogs, 'en-GB');
  assert.equal(tr('settings.cloud.signedInAs', { email: 'a@b.c' }), 'Signed in as a@b.c');
});

test('defaults are eea_uk region and en-GB locale constants', () => {
  assert.equal(DEFAULT_LOCALE, 'en-GB');
  assert.equal(DEFAULT_PRIVACY_REGION, 'eea_uk');
});

test('getPolicyDocumentsForRegionI18n returns locale-aware summaries', async () => {
  const { getPolicyDocumentsForRegionI18n } = await import(
    '../../../packages/shared/src/privacy/getPolicyDocumentsI18n.mjs'
  );
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
  const pack = JSON.parse(readFileSync(join(root, 'policy-packs/v1.json'), 'utf8'));
  const docs = getPolicyDocumentsForRegionI18n('eea_uk', pack, 'en-GB', catalogs);
  assert.ok(docs.length > 0);
  assert.equal(docs[0].title, 'Global privacy baseline');
});
