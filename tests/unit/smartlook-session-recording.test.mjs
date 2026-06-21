import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConsentDashboardEntries,
  getFeatureAvailability,
  prefsToConsents,
  shouldActivateSessionRecording,
  shouldAllowNetworkOperation,
  shouldSkipFirstRunStep,
} from '@rianell/shared';

test('session recording requires health data and explicit opt-in', () => {
  const consents = prefsToConsents({ healthDataConsent: true, sessionRecording: false });
  const avail = getFeatureAvailability('eea_uk', 'sessionRecording', consents);
  assert.equal(avail.available, false);
  assert.equal(avail.missing, 'sessionRecording');

  const granted = prefsToConsents({ healthDataConsent: true, sessionRecording: true });
  const ok = getFeatureAvailability('eea_uk', 'sessionRecording', granted);
  assert.equal(ok.available, true);
});

test('local-only mode blocks session recording network feature', () => {
  const prefs = { localOnlyMode: true, sessionRecording: true, healthDataConsent: true };
  assert.equal(shouldAllowNetworkOperation(prefs, 'sessionRecording'), false);
});

test('consent dashboard includes session recording row', () => {
  const rows = buildConsentDashboardEntries({
    sessionRecording: true,
    sessionRecordingAt: '2026-06-20T12:00:00.000Z',
  });
  const row = rows.find((r) => r.id === 'sessionRecording');
  assert.ok(row);
  assert.equal(row.granted, true);
  assert.equal(row.revokeField, 'sessionRecording');
});

test('shared Smartlook config defaults (PWA + RN parity)', async () => {
  const { SMARTLOOK_PROJECT_KEY, SMARTLOOK_REGION, resolveSmartlookProjectKey, resolveSmartlookRegion } =
    await import('@rianell/shared');
  assert.match(SMARTLOOK_PROJECT_KEY, /^[a-f0-9]{40}$/);
  assert.equal(SMARTLOOK_REGION, 'eu');
  assert.equal(resolveSmartlookProjectKey(''), SMARTLOOK_PROJECT_KEY);
  assert.equal(resolveSmartlookProjectKey('YOUR_SMARTLOOK_PROJECT_KEY'), SMARTLOOK_PROJECT_KEY);
  assert.equal(resolveSmartlookRegion(''), 'eu');
});

test('shouldActivateSessionRecording requires disclosure or explicit enable', () => {
  assert.equal(shouldActivateSessionRecording({ sessionRecording: true }), false);
  assert.equal(
    shouldActivateSessionRecording({
      sessionRecording: true,
      sessionRecordingDisclosureAt: '2026-06-20T12:00:00.000Z',
    }),
    true,
  );
  assert.equal(
    shouldActivateSessionRecording({
      sessionRecording: true,
      sessionRecordingAt: '2026-06-20T12:00:00.000Z',
    }),
    true,
  );
  assert.equal(
    shouldActivateSessionRecording({
      sessionRecording: false,
      sessionRecordingDisclosureAt: '2026-06-20T12:00:00.000Z',
    }),
    false,
  );
});

test('sessionRecording onboarding step skipped after disclosure', () => {
  assert.equal(
    shouldSkipFirstRunStep(
      'sessionRecording',
      { sessionRecordingDisclosureAt: '2026-06-20T12:00:00.000Z' },
      { platform: 'pwa' },
    ),
    true,
  );
});
