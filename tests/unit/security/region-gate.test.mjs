import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPrivacyRegionConfigured,
  applyPrivacyProfileToLocal,
} from '../../../packages/shared/src/privacy/profileSync.mjs';

test('isPrivacyRegionConfigured false when empty', () => {
  assert.equal(isPrivacyRegionConfigured({}), false);
  assert.equal(isPrivacyRegionConfigured({ privacyRegion: '' }), false);
});

test('isPrivacyRegionConfigured true for valid region', () => {
  assert.equal(isPrivacyRegionConfigured({ privacyRegion: 'eea_uk' }), true);
});

test('applyPrivacyProfileToLocal overwrites local region from Supabase', () => {
  const local = { privacyRegion: 'us_other', backup: true };
  const profile = {
    privacy_region: 'eea_uk',
    privacy_region_source: 'cloud',
    consents: { healthDataConsent: true, backup: false },
  };
  const merged = applyPrivacyProfileToLocal(local, profile);
  assert.equal(merged.privacyRegion, 'eea_uk');
  assert.equal(merged.backup, false);
});

test('PWA gates runAppInit behind privacy gate', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /startAppAfterPrivacyGate/);
  assert.match(appJs, /RianellPrivacy\.awaitGateReady/);
});

test('PWA index.html includes region gate overlay', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /privacyRegionGateOverlay/);
  assert.match(html, /privacyRegionSettingsPane/);
});

test('RN App blocks navigator until region configured', () => {
  const app = readFileSync('apps/rn-app/App.tsx', 'utf8');
  assert.match(app, /isPrivacyRegionConfigured/);
  assert.match(app, /RegionGateScreen/);
});
