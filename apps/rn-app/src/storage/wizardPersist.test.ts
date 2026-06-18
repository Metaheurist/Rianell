import NetInfo from '@react-native-community/netinfo';
import { enqueueOfflineLog } from './offlineQueue';
import { saveLogs, type LogEntry } from './logs';
import { persistWizardLogEntry } from './wizardPersist';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('./offlineQueue', () => ({
  enqueueOfflineLog: jest.fn(async () => {}),
}));

jest.mock('./logs', () => ({
  addLogEntry: jest.fn((existing, entry) => [...existing, entry]),
  saveLogs: jest.fn(async () => {}),
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockedEnqueue = enqueueOfflineLog as jest.Mock;
const mockedSaveLogs = saveLogs as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test('persistWizardLogEntry enqueues when offline', async () => {
  mockedNetInfo.fetch.mockResolvedValueOnce({ isConnected: false } as never);
  const entry = { date: '2026-06-18' } as LogEntry;
  await persistWizardLogEntry([], entry);
  expect(mockedSaveLogs).toHaveBeenCalled();
  expect(mockedEnqueue).toHaveBeenCalledWith(entry);
});

test('persistWizardLogEntry skips queue when online', async () => {
  mockedNetInfo.fetch.mockResolvedValueOnce({ isConnected: true } as never);
  const entry = { date: '2026-06-18' } as LogEntry;
  await persistWizardLogEntry([], entry);
  expect(mockedSaveLogs).toHaveBeenCalled();
  expect(mockedEnqueue).not.toHaveBeenCalled();
});
