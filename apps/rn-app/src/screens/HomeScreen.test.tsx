import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { renderWithProviders } from '../test/renderWithProviders';
import { getDefaultPreferences } from '../storage/preferences';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 49,
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (effect: () => void) => {
      React.useEffect(() => {
        effect();
      }, []);
    },
  };
});

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => []),
}));
jest.mock('../ai/llm', () => ({
  generateMotd: jest.fn(async () => 'Test MOTD'),
  answerHomeQuestion: jest.fn(async () => 'Test answer from AI'),
}));
jest.mock('../performance/benchmark', () => ({
  loadCachedBenchmark: jest.fn(async () => null),
}));
jest.mock('../utils/submitBugReport', () => ({
  submitBugReport: jest.fn(async () => undefined),
}));
jest.mock('../utils/engagementGamification', () => ({
  daysSinceDate: () => 0,
  detectNewLogMilestone: jest.fn(async () => null),
  setTabDiscoveryBadge: jest.fn(async () => {}),
  computeSetupProgress: () => ({ done: 0, total: 4 }),
}));
jest.mock('../achievements/goalsModalBridge', () => ({
  requestOpenGoalsModal: jest.fn(),
}));
jest.mock('../storage/preferences', () => {
  const actual = jest.requireActual('../storage/preferences');
  return {
    ...actual,
    savePreferences: jest.fn(async () => undefined),
  };
});

import { loadLogs } from '../storage/logs';
import { submitBugReport } from '../utils/submitBugReport';
import { requestOpenGoalsModal } from '../achievements/goalsModalBridge';
import { answerHomeQuestion } from '../ai/llm';

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function suggestionFixtureLogs() {
  const logs = [];
  for (let i = 0; i < 5; i++) {
    logs.push({
      date: isoDaysAgo(i),
      flare: i < 2 ? 'Yes' : 'No',
      fatigue: 6 + i * 0.5,
      sleep: 7 - i * 0.3,
      mood: 6,
      symptoms: i % 2 === 0 ? ['Headache'] : ['Headache', 'Nausea'],
      stressors: i === 0 ? ['Work deadline'] : [],
      notes: i === 0 ? 'Rough morning' : '',
    });
  }
  return logs;
}

function renderHome() {
  const prefs = getDefaultPreferences();
  return renderWithProviders(<HomeScreen prefs={prefs} />, { prefs });
}

beforeEach(() => {
  mockNavigate.mockClear();
  (loadLogs as jest.Mock).mockResolvedValue([]);
  (submitBugReport as jest.Mock).mockClear();
  (requestOpenGoalsModal as jest.Mock).mockClear();
});

test('home shows title and prompts to log when no entry today', async () => {
  const { getByText, findByText } = renderHome();
  getByText('Rianell');
  await findByText('Test MOTD');
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  await findByText('No log for today yet. Tap + to record how you feel.');
});

test('home shows logged message when today exists in logs', async () => {
  const today = new Date().toISOString().slice(0, 10);
  (loadLogs as jest.Mock).mockResolvedValue([{ date: today, mood: 5 }]);
  const { findByText } = renderHome();
  await findByText('You have logged today. Open View logs to browse or edit entries.');
});

test('FAB navigates to Log wizard', async () => {
  const { getByLabelText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Log now, Beta'));
  expect(mockNavigate).toHaveBeenCalledWith('LogWizard');
});

test('header Goals and targets opens Goals modal', async () => {
  const { getByLabelText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Goals and targets'));
  expect(requestOpenGoalsModal).toHaveBeenCalledWith(0);
});

test('header Report a bug opens bug report modal and submits', async () => {
  const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  const { getByLabelText, findByText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Report a bug'));
  await findByText('Report a bug');
  fireEvent.changeText(getByLabelText('Bug description'), 'Repro steps from RN test');
  fireEvent.press(getByLabelText('Submit'));
  await waitFor(() => {
    expect(submitBugReport).toHaveBeenCalled();
  });
  expect(openSpy).not.toHaveBeenCalledWith(expect.stringContaining('SECURITY.md'));
  openSpy.mockRestore();
});

test('home hides AI suggestion chips when not logged today', async () => {
  (loadLogs as jest.Mock).mockResolvedValue(suggestionFixtureLogs().slice(1));
  const { queryByText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  expect(queryByText("What's behind my Headache?")).toBeNull();
});

test('home shows AI suggestion chips when logged today with enough data', async () => {
  (loadLogs as jest.Mock).mockResolvedValue(suggestionFixtureLogs());
  const { findByText } = renderHome();
  await findByText("What's behind my Headache?");
});

test('tapping a home AI suggestion opens answer modal', async () => {
  (loadLogs as jest.Mock).mockResolvedValue(suggestionFixtureLogs());
  const { findByText, getByLabelText } = renderHome();
  const chip = await findByText("What's behind my Headache?");
  fireEvent.press(chip);
  await findByText('Test answer from AI');
  expect(answerHomeQuestion).toHaveBeenCalled();
});

test('header Settings navigates to Settings tab', async () => {
  const { getByLabelText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Settings'));
  expect(mockNavigate).toHaveBeenCalledWith('Settings');
});
