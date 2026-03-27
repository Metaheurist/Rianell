import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGS_STORAGE_KEY_V1 } from '@rianell/shared';
import { clearDemoBackup, disableDemoMode, enableDemoMode, refreshDemoModeLogsOnLaunch } from './demoMode';

const mockMem = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (mockMem.has(k) ? mockMem.get(k)! : null)),
    setItem: jest.fn(async (k: string, v: string) => {
      mockMem.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      mockMem.delete(k);
    }),
  },
}));

function readLogs() {
  const raw = mockMem.get(LOGS_STORAGE_KEY_V1);
  return raw ? (JSON.parse(raw) as Array<{ date: string }>) : [];
}

beforeEach(() => {
  mockMem.clear();
  jest.clearAllMocks();
});

test('enable demo mode backs up current logs and writes demo logs', async () => {
  mockMem.set(LOGS_STORAGE_KEY_V1, JSON.stringify([{ date: '2026-01-01', flare: 'No' }]));
  await enableDemoMode();
  const logs = readLogs();
  expect(logs.length).toBe(90);
  expect(logs[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(mockMem.get('rianell.logs.backup.beforeDemo.v1')).toContain('2026-01-01');
});

test('disable demo mode restores backup logs', async () => {
  mockMem.set('rianell.logs.backup.beforeDemo.v1', JSON.stringify([{ date: '2026-02-02', flare: 'No' }]));
  mockMem.set(LOGS_STORAGE_KEY_V1, JSON.stringify([{ date: '2026-03-03', flare: 'Yes' }]));
  await disableDemoMode();
  const logs = readLogs();
  expect(logs).toHaveLength(1);
  expect(logs[0]?.date).toBe('2026-02-02');
  expect(await AsyncStorage.getItem('rianell.logs.backup.beforeDemo.v1')).toBeNull();
});

test('refresh demo mode rewrites logs without touching backup', async () => {
  mockMem.set('rianell.logs.backup.beforeDemo.v1', JSON.stringify([{ date: '2026-04-04', flare: 'No' }]));
  await refreshDemoModeLogsOnLaunch();
  expect(readLogs()).toHaveLength(90);
  expect(mockMem.get('rianell.logs.backup.beforeDemo.v1')).toContain('2026-04-04');
});

test('clear demo backup removes stored backup', async () => {
  mockMem.set('rianell.logs.backup.beforeDemo.v1', '[]');
  await clearDemoBackup();
  expect(await AsyncStorage.getItem('rianell.logs.backup.beforeDemo.v1')).toBeNull();
});
