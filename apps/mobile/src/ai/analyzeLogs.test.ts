import { summarizeLogsForAi } from './analyzeLogs';
import type { LogEntry } from '../storage/logs';

test('summarizeLogsForAi calculates averages and top items', () => {
  const logs = [
    {
      date: '2026-03-25',
      flare: 'Yes',
      mood: 6,
      sleep: 5,
      fatigue: 7,
      symptoms: ['Nausea', 'Headache'],
      stressors: ['Work deadline'],
    },
    {
      date: '2026-03-24',
      flare: 'No',
      mood: 8,
      sleep: 7,
      fatigue: 5,
      symptoms: ['Nausea'],
      stressors: ['Work deadline', 'Travel'],
    },
  ] as LogEntry[];

  const out = summarizeLogsForAi(logs, 'all');
  expect(out.totalLogs).toBe(2);
  expect(out.flareDays).toBe(1);
  expect(out.avgMood).toBe(7);
  expect(out.avgSleep).toBe(6);
  expect(out.avgFatigue).toBe(6);
  expect(out.topSymptoms[0]).toBe('Nausea (2)');
  expect(out.topStressors[0]).toBe('Work deadline (2)');
  expect(out.whatYouLogged.length).toBeGreaterThan(0);
  expect(out.howYouAreDoing.length).toBeGreaterThan(0);
  expect(out.thingsToWatch.length).toBeGreaterThan(0);
  expect(out.important.length).toBeGreaterThan(0);
  expect(out.correlations.length).toBeGreaterThan(0);
  expect(out.groupsThatChangeTogether.length).toBeGreaterThan(0);
  expect(out.possibleFlareUp.level).toBeTruthy();
  expect(Array.isArray(out.possibleFlareUp.notes)).toBe(true);
});
