import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPrivacyProfileToLocal,
  privacyProfileFromLocal,
} from '../../../packages/shared/src/privacy/profileSync.mjs';

test('privacyProfileFromLocal maps camelCase prefs to snake_case row', () => {
  const row = privacyProfileFromLocal(
    {
      privacyRegion: 'eea_uk',
      privacyRegionSource: 'user',
      healthDataConsent: true,
      backup: true,
    },
    '00000000-0000-4000-8000-000000000001',
  );
  assert.equal(row.privacy_region, 'eea_uk');
  assert.equal(row.user_id, '00000000-0000-4000-8000-000000000001');
});

test('privacyProfileFromLocal includes ui_locale', () => {
  const row = privacyProfileFromLocal({ uiLocale: 'de-DE', privacyRegion: 'eea_uk' }, 'uid');
  assert.equal(row.ui_locale, 'de-DE');
});

test('applyPrivacyProfileToLocal maps ui_locale from cloud', () => {
  const merged = applyPrivacyProfileToLocal({ uiLocale: 'en-US' }, { ui_locale: 'fr-FR' });
  assert.equal(merged.uiLocale, 'fr-FR');
});

test('login overwrite: cloud profile wins over local', () => {
  const local = { privacyRegion: 'us_ca', backup: true, healthDataConsent: false };
  const cloud = { privacy_region: 'eea_uk', consents: { healthDataConsent: true, backup: false } };
  const merged = applyPrivacyProfileToLocal(local, cloud);
  assert.equal(merged.privacyRegion, 'eea_uk');
  assert.equal(merged.healthDataConsent, true);
  assert.equal(merged.backup, false);
});

test('PWA cloud-sync fetches profile before loadFromCloud on sign-in', () => {
  const src = readFileSync('apps/pwa-webapp/cloud-sync.js', 'utf8');
  assert.match(src, /fetchPrivacyProfileAndApply/);
  assert.match(src, /user_privacy_profile/);
});
