import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNotificationContent } from '@rianell/shared';

test('buildNotificationContent ios omits channelId and sets badge', () => {
  const content = buildNotificationContent('ios', {
    title: 'Reminder',
    body: 'Log today',
    channelId: 'should-not-appear',
  });
  assert.equal(content.title, 'Reminder');
  assert.equal(content.body, 'Log today');
  assert.equal(content.sound, true);
  assert.equal(content.badge, 1);
  assert.equal(content.channelId, undefined);
});

test('buildNotificationContent android includes channelId', () => {
  const content = buildNotificationContent('android', {
    title: 'Reminder',
    body: 'Log today',
  });
  assert.equal(content.channelId, 'health-reminders');
});

test('buildNotificationContent web returns data payload', () => {
  const content = buildNotificationContent('web', {
    title: 'Push',
    body: 'Hello',
    data: { route: '/log' },
  });
  assert.deepEqual(content.data, { route: '/log' });
});
