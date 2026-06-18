import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCaregiverSettings,
  buildProxyLogMetadata,
  stampLogEntryForCaregiver,
} from '../../packages/shared/src/privacy/caregiverMode.mjs';

test('normalizeCaregiverSettings clears name when disabled', () => {
  const out = normalizeCaregiverSettings({
    caregiverModeEnabled: false,
    caregiverDependentName: 'Alex',
    caregiverRelationship: 'parent',
  });
  assert.equal(out.caregiverModeEnabled, false);
  assert.equal(out.caregiverDependentName, '');
});

test('stampLogEntryForCaregiver adds proxy metadata', () => {
  const entry = { date: '2026-06-18', symptoms: 'fatigue' };
  const stamped = stampLogEntryForCaregiver(entry, {
    caregiverModeEnabled: true,
    caregiverDependentName: 'Jamie',
    caregiverRelationship: 'guardian',
  });
  assert.equal(stamped.proxyLoggedBy, 'caregiver');
  assert.equal(stamped.dependentLabel, 'Jamie');
  assert.equal(stamped.proxyRelationship, 'guardian');
  const meta = buildProxyLogMetadata({
    caregiverModeEnabled: true,
    caregiverDependentName: 'Jamie',
    caregiverRelationship: 'guardian',
  });
  assert.equal(meta.proxyLoggedBy, 'caregiver');
});
