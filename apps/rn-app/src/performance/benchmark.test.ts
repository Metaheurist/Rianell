import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCachedBenchmark, loadCachedBenchmark, resolveLlmModelSize, runAndCacheBenchmark } from './benchmark';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));

test('resolveLlmModelSize uses recommended benchmark model', () => {
  expect(resolveLlmModelSize('recommended', null)).toBe('tier3');
  expect(
    resolveLlmModelSize('recommended', {
      scoreMs: 10,
      tier: 5,
      deviceClass: 'high',
      llmModelSize: 'tier5',
      measuredAt: Date.now(),
    })
  ).toBe('tier5');
  expect(resolveLlmModelSize('tier2', null)).toBe('tier2');
});

test('runAndCacheBenchmark stores and reloads benchmark result', async () => {
  const mocked = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mem = new Map<string, string>();
  mocked.getItem.mockImplementation(async (k) => (mem.has(k) ? mem.get(k)! : null));
  mocked.setItem.mockImplementation(async (k, v) => {
    mem.set(k, v);
  });
  mocked.removeItem.mockImplementation(async (k) => {
    mem.delete(k);
  });
  await clearCachedBenchmark();
  const result = await runAndCacheBenchmark();
  expect(result.tier).toBeGreaterThanOrEqual(1);
  expect(result.tier).toBeLessThanOrEqual(5);
  const cached = await loadCachedBenchmark();
  expect(cached).toBeTruthy();
  expect(cached?.tier).toBe(result.tier);
  expect(await AsyncStorage.getItem('rianell.performance-benchmark.v1')).toBeTruthy();
});

