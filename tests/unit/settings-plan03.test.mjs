import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTrackingProfile,
  isTrackingProfileConfigured,
  deriveWeightUnitFromLocale,
  buildConsentDashboardEntries,
  buildSettingsProfileExport,
  parseSettingsProfileImport,
} from '@rianell/shared';

test('tracking profile normalizes and detects configured state', () => {
  const empty = normalizeTrackingProfile(null);
  assert.equal(isTrackingProfileConfigured(empty), false);
  const done = normalizeTrackingProfile({ configuredAt: '2026-06-18T00:00:00.000Z', fields: { mood: true } });
  assert.equal(isTrackingProfileConfigured(done), true);
});

test('locale defaults derive US weight unit', () => {
  assert.equal(deriveWeightUnitFromLocale('en-US'), 'lb');
  assert.equal(deriveWeightUnitFromLocale('en-GB'), 'kg');
});

test('settings profile export round-trip', () => {
  const blob = buildSettingsProfileExport({ userName: 'A' }, { steps: 5000 });
  const parsed = parseSettingsProfileImport(blob);
  assert.equal(parsed.settings.userName, 'A');
  assert.equal(parsed.goals.steps, 5000);
});

test('consent dashboard lists seven consent rows including barcode food', () => {
  const rows = buildConsentDashboardEntries({ healthDataConsent: true, contributeAnonData: false });
  assert.equal(rows.length, 7);
  assert.equal(rows[0].id, 'healthData');
  assert.ok(rows.some((r) => r.id === 'sessionRecording'));
  const withBarcode = buildConsentDashboardEntries({ barcodeFoodLoggingEnabled: true, barcodeFoodLoggingEnabledAt: '2026-01-01' });
  const barcodeRow = withBarcode.find((r) => r.id === 'barcodeFood');
  assert.ok(barcodeRow);
  assert.equal(barcodeRow.granted, true);
});
