import { mapNotificationResponseToReminderAction, normalizeReminderActionIdentifier } from './permissions';

test('normalizeReminderActionIdentifier resolves known actions across runtime variants', () => {
  expect(normalizeReminderActionIdentifier('log-now')).toBe('log-now');
  expect(normalizeReminderActionIdentifier('Log Now')).toBe('log-now');
  expect(normalizeReminderActionIdentifier('log_now')).toBe('log-now');
  expect(normalizeReminderActionIdentifier('later')).toBe('later');
  expect(normalizeReminderActionIdentifier('LATER')).toBe('later');
});

test('normalizeReminderActionIdentifier resolves default and none safely', () => {
  expect(normalizeReminderActionIdentifier('expo.default', 'expo.default')).toBe('default');
  expect(normalizeReminderActionIdentifier('expo.dismissed', 'expo.default', 'expo.dismissed')).toBe('none');
  expect(normalizeReminderActionIdentifier('default')).toBe('default');
  expect(normalizeReminderActionIdentifier('dismissed')).toBe('none');
  expect(normalizeReminderActionIdentifier('close')).toBe('none');
  expect(normalizeReminderActionIdentifier('')).toBe('none');
  expect(normalizeReminderActionIdentifier(undefined)).toBe('none');
});

test('normalizeReminderActionIdentifier marks unknown action identifiers explicitly', () => {
  expect(normalizeReminderActionIdentifier('dismiss')).toBe('none');
  expect(normalizeReminderActionIdentifier('custom_action_123')).toBe('unknown');
});

test('mapNotificationResponseToReminderAction ignores non-reminder notification identifiers', () => {
  expect(mapNotificationResponseToReminderAction('other-notification', 'default', 'expo.default')).toBe('none');
});

test('mapNotificationResponseToReminderAction keeps reminder action semantics for reminder notifications', () => {
  expect(mapNotificationResponseToReminderAction('rianell-daily-reminder', 'log_now', 'expo.default')).toBe('log-now');
  expect(mapNotificationResponseToReminderAction('rianell-daily-reminder', 'later', 'expo.default')).toBe('later');
  expect(mapNotificationResponseToReminderAction('rianell-daily-reminder', 'expo.default', 'expo.default')).toBe('default');
});

test('mapNotificationResponseToReminderAction treats snooze notification taps as default open-app intent', () => {
  expect(mapNotificationResponseToReminderAction('rianell-reminder-snooze', 'expo.default', 'expo.default')).toBe('default');
  expect(mapNotificationResponseToReminderAction('rianell-reminder-snooze', 'later', 'expo.default')).toBe('default');
  expect(mapNotificationResponseToReminderAction('rianell-reminder-snooze', undefined, 'expo.default')).toBe('none');
});

test('mapNotificationResponseToReminderAction ignores dismissed actions', () => {
  expect(
    mapNotificationResponseToReminderAction(
      'rianell-daily-reminder',
      'expo.dismissed',
      'expo.default',
      'expo.dismissed'
    )
  ).toBe('none');
  expect(mapNotificationResponseToReminderAction('rianell-daily-reminder', 'dismissed', 'expo.default')).toBe('none');
});
