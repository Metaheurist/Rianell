import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getFeatureAvailability,
  prefsToConsents,
  shouldAllowAiModelDownload,
  shouldAllowNetworkOperation,
} from '@rianell/shared';

test('demo mode allows on-device LLM feature without health consent', () => {
  const consents = prefsToConsents({
    demoMode: true,
    aiEnabled: true,
    healthDataConsent: false,
    privacyRegion: 'eea_uk',
  });
  assert.equal(consents.demoMode, true);
  const avail = getFeatureAvailability('eea_uk', 'onDeviceLlmDownload', consents);
  assert.equal(avail.available, true);
});

test('non-demo eea still requires health consent for on-device LLM', () => {
  const consents = prefsToConsents({
    demoMode: false,
    aiEnabled: true,
    healthDataConsent: false,
    privacyRegion: 'eea_uk',
  });
  const avail = getFeatureAvailability('eea_uk', 'onDeviceLlmDownload', consents);
  assert.equal(avail.available, false);
  assert.equal(avail.reason, 'missing_consent');
});

test('demo mode does not block AI model download network op', () => {
  assert.equal(shouldAllowAiModelDownload({ demoMode: true }), true);
  assert.equal(shouldAllowNetworkOperation({ demoMode: true }, 'modelDownload'), true);
  assert.equal(shouldAllowAiModelDownload({ demoMode: true, localOnlyMode: true }), false);
});
