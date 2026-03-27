import { clearLlmCacheForTests, generateMotd, generateSummaryNote, suggestLogNote } from './llm';
import type { AiSummary } from './analyzeLogs';

beforeEach(() => {
  clearLlmCacheForTests();
  jest.restoreAllMocks();
});

test('generateSummaryNote falls back to deterministic engine note', async () => {
  const summary: AiSummary = {
    rangeLabel: 'Last 30 days',
    totalLogs: 8,
    flareDays: 2,
    avgMood: 6.2,
    avgSleep: 6.8,
    avgFatigue: 4.5,
    topSymptoms: ['Nausea'],
    topStressors: ['Work deadline'],
    whatYouLogged: [],
    howYouAreDoing: [],
    thingsToWatch: [],
    important: [],
    possibleFlareUp: { level: 'Low', matchingSignals: 0, notes: [] },
    correlations: [],
    groupsThatChangeTogether: [],
  };
  const note = await generateSummaryNote(summary, 'recommended', null);
  expect(note.length).toBeGreaterThan(20);
});

test('suggestLogNote returns text for partial entry context', async () => {
  const text = await suggestLogNote(
    { flare: 'Yes', sleep: 3, fatigue: 8, mood: 4, steps: 2000, symptoms: ['Nausea'] },
    'tier2',
    null
  );
  expect(text.toLowerCase()).toContain('flare');
});

test('generateMotd returns short line', async () => {
  const motd = await generateMotd('tier3', null, 12);
  expect(motd.length).toBeGreaterThan(10);
  expect(motd.length).toBeLessThanOrEqual(220);
});
