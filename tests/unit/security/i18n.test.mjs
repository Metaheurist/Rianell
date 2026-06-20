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
import { formatDate, formatIsoDate, formatRelativeDay } from '../../../packages/shared/src/i18n/format.mjs';
import { isRtlLocale, textDirection } from '../../../packages/shared/src/i18n/rtl.mjs';

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
  const pack = JSON.parse(readFileSync(join(root, 'i18n-packs/policy-packs/v1.json'), 'utf8'));
  const docs = getPolicyDocumentsForRegionI18n('eea_uk', pack, 'en-GB', catalogs);
  assert.ok(docs.length > 0);
  assert.equal(docs[0].title, 'Global privacy baseline');
});

test('formatDate uses locale (de-DE)', () => {
  const d = new Date('2026-06-13T12:00:00Z');
  const out = formatDate(d, 'de-DE', { dateStyle: 'medium' });
  assert.ok(typeof out === 'string' && out.length > 0);
});

test('formatDate accepts granular weekday/month/day without mixing dateStyle', () => {
  const d = new Date('2026-06-13T12:00:00Z');
  const out = formatDate(d, 'en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  assert.ok(typeof out === 'string' && out.length > 0);
  assert.doesNotThrow(() => {
    formatDate(d, 'en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });
});

test('formatIsoDate formats YYYY-MM-DD with locale (en-US vs en-GB)', () => {
  const iso = '2026-06-13';
  const us = formatIsoDate(iso, 'en-US', { dateStyle: 'medium' });
  const gb = formatIsoDate(iso, 'en-GB', { dateStyle: 'medium' });
  assert.ok(us.length > 0 && gb.length > 0);
  assert.notEqual(us, gb);
});

test('formatDate parses ISO date strings without UTC day shift', () => {
  const out = formatDate('2026-06-13', 'en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
  assert.match(out, /13/);
  assert.match(out, /2026/);
});

test('formatRelativeDay returns Today for today', () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  assert.equal(formatRelativeDay(today, 'en-GB'), 'Today');
});

test('isRtlLocale detects ar and he', () => {
  assert.equal(isRtlLocale('ar'), true);
  assert.equal(isRtlLocale('he-IL'), true);
  assert.equal(isRtlLocale('en-GB'), false);
});

test('textDirection returns rtl for Arabic', () => {
  assert.equal(textDirection('ar'), 'rtl');
  assert.equal(textDirection('fr-FR'), 'ltr');
});

test('de-DE catalog resolves common.none (not raw key)', () => {
  const val = t('common.none', 'de-DE', catalogs);
  assert.notEqual(val, 'common.none');
  assert.equal(val, 'Keine');
});

test('de-DE catalog resolves logs.form.noExercise', () => {
  const val = t('logs.form.noExercise', 'de-DE', catalogs);
  assert.notEqual(val, 'logs.form.noExercise');
  assert.ok(val.length > 0);
});
