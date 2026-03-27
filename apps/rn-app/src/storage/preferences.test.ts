import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultPreferences, loadPreferences, savePreferences, type Preferences } from './preferences';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

test('getDefaultPreferences matches contract', () => {
  const d = getDefaultPreferences();
  expect(d.team).toBe('mint');
  expect(d.appearanceMode).toBe('system');
  expect(d.aiEnabled).toBe(true);
  expect(d.demoMode).toBe(false);
  expect(d.notifications.enabled).toBe(false);
  expect(d.notifications.dailyReminderTime).toBe('20:00');
  expect(d.notifications.soundEnabled).toBe(true);
  expect(d.notifications.snoozeMinutes).toBe(30);
  expect(d.goals.moodTarget).toBe(7);
  expect(d.goals.sleepTarget).toBe(7);
  expect(d.goals.fatigueTarget).toBe(7);
  expect(d.accessibility.textScale).toBe(1);
  expect(d.accessibility.largeTextEnabled).toBe(false);
  expect(d.accessibility.colorblindMode).toBe('none');
});

test('loadPreferences returns defaults when empty', async () => {
  mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
  const p = await loadPreferences();
  expect(p).toEqual(getDefaultPreferences());
});

test('loadPreferences clamps textScale and preserves aiEnabled default true', async () => {
  mockedAsyncStorage.getItem.mockResolvedValueOnce(
    JSON.stringify({
      team: 'ocean',
      demoMode: true,
      accessibility: { textScale: 99 },
      aiEnabled: undefined,
    })
  );
  const p = await loadPreferences();
  expect(p.team).toBe('ocean');
  expect(p.demoMode).toBe(true);
  expect(p.accessibility.textScale).toBe(2);
  expect(p.aiEnabled).toBe(true);
});

test('loadPreferences restores notifications fields with validation', async () => {
  mockedAsyncStorage.getItem.mockResolvedValueOnce(
    JSON.stringify({
      notifications: {
        enabled: true,
        dailyReminderTime: '09:30',
        soundEnabled: false,
        snoozeMinutes: 45,
      },
    })
  );
  const p = await loadPreferences();
  expect(p.notifications.enabled).toBe(true);
  expect(p.notifications.dailyReminderTime).toBe('09:30');
  expect(p.notifications.soundEnabled).toBe(false);
  expect(p.notifications.snoozeMinutes).toBe(45);
});

test('loadPreferences clamps notifications snooze minutes to 5..120', async () => {
  mockedAsyncStorage.getItem.mockResolvedValueOnce(
    JSON.stringify({
      notifications: {
        snoozeMinutes: 999,
      },
    })
  );
  const p = await loadPreferences();
  expect(p.notifications.snoozeMinutes).toBe(120);
});

test('loadPreferences restores goals and clamps to 0..10', async () => {
  mockedAsyncStorage.getItem.mockResolvedValueOnce(
    JSON.stringify({
      goals: {
        moodTarget: 99,
        sleepTarget: 6.5,
        fatigueTarget: -3,
      },
    })
  );
  const p = await loadPreferences();
  expect(p.goals.moodTarget).toBe(10);
  expect(p.goals.sleepTarget).toBe(6.5);
  expect(p.goals.fatigueTarget).toBe(0);
});

test('savePreferences writes JSON', async () => {
  const prefs: Preferences = getDefaultPreferences();
  prefs.team = 'rose';
  await savePreferences(prefs);
  expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
    'rianell.preferences.v1',
    expect.stringContaining('"team":"rose"')
  );
});
