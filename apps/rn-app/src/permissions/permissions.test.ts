import { normalizeReminderActionIdentifier } from './permissions';

test('normalizeReminderActionIdentifier resolves known actions across runtime variants', () => {
  expect(normalizeReminderActionIdentifier('log-now')).toBe('log-now');
  expect(normalizeReminderActionIdentifier('Log Now')).toBe('log-now');
  expect(normalizeReminderActionIdentifier('log_now')).toBe('log-now');
  expect(normalizeReminderActionIdentifier('later')).toBe('later');
  expect(normalizeReminderActionIdentifier('LATER')).toBe('later');
});

test('normalizeReminderActionIdentifier resolves default and none safely', () => {
  expect(normalizeReminderActionIdentifier('expo.default', 'expo.default')).toBe('default');
  expect(normalizeReminderActionIdentifier('default')).toBe('default');
  expect(normalizeReminderActionIdentifier('')).toBe('none');
  expect(normalizeReminderActionIdentifier(undefined)).toBe('none');
});

test('normalizeReminderActionIdentifier marks unknown action identifiers explicitly', () => {
  expect(normalizeReminderActionIdentifier('dismiss')).toBe('unknown');
  expect(normalizeReminderActionIdentifier('custom_action_123')).toBe('unknown');
});
