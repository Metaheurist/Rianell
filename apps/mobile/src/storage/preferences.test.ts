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
      accessibility: { textScale: 99 },
      aiEnabled: undefined,
    })
  );
  const p = await loadPreferences();
  expect(p.team).toBe('ocean');
  expect(p.accessibility.textScale).toBe(2);
  expect(p.aiEnabled).toBe(true);
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
