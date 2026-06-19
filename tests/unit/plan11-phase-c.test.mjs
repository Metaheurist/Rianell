import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canOfferWebPush,
  shouldFireReEngagementNudge,
  touchLastActiveAt,
  buildReEngagementNotificationContent,
  RE_ENGAGEMENT_IDLE_DAYS,
} from '@rianell/shared';

test('canOfferWebPush requires VAPID, region, and EEA health consent', () => {
  const base = {
    privacyRegion: 'eea_uk',
    healthDataConsent: true,
    localOnlyMode: false,
    demoMode: false,
  };
  assert.equal(canOfferWebPush(base, { vapidPublicKey: 'abc' }).ok, true);
  assert.equal(canOfferWebPush(base, { vapidPublicKey: '' }).ok, false);
  assert.equal(canOfferWebPush({ ...base, healthDataConsent: false }, { vapidPublicKey: 'abc' }).reason, 'health-consent-required');
  assert.equal(canOfferWebPush({ ...base, privacyRegion: '' }, { vapidPublicKey: 'abc' }).reason, 'region-unconfigured');
  assert.equal(canOfferWebPush({ ...base, localOnlyMode: true }, { vapidPublicKey: 'abc' }).reason, 'local-only');
});

test('shouldFireReEngagementNudge fires after 7 idle days once per period', () => {
  const lastActiveAt = '2026-06-01T10:00:00.000Z';
  const now = new Date('2026-06-10T12:00:00.000Z');
  const first = shouldFireReEngagementNudge(now, { enabled: true, lastActiveAt });
  assert.equal(first.fire, true);
  assert.equal(RE_ENGAGEMENT_IDLE_DAYS, 7);
  const second = shouldFireReEngagementNudge(now, {
    enabled: true,
    lastActiveAt,
    lastReEngagementNudgeAt: '2026-06-10T12:00:00.000Z',
  });
  assert.equal(second.fire, false);
  assert.equal(second.reason, 'already-nudged');
});

test('shouldFireReEngagementNudge respects user disable', () => {
  const result = shouldFireReEngagementNudge(new Date('2026-06-10T12:00:00.000Z'), {
    enabled: false,
    lastActiveAt: '2026-06-01T10:00:00.000Z',
  });
  assert.equal(result.fire, false);
  assert.equal(result.reason, 'disabled');
});

test('touchLastActiveAt returns ISO timestamp', () => {
  const at = touchLastActiveAt(new Date('2026-06-10T12:00:00.000Z'));
  assert.equal(at, '2026-06-10T12:00:00.000Z');
});

test('buildReEngagementNotificationContent includes quick-log url', () => {
  const content = buildReEngagementNotificationContent();
  assert.match(content.title, /miss you/i);
  assert.equal(content.url, '/?quick=true');
});
