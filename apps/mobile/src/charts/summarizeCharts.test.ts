import { filterTrendsForChartView, summarizeCharts, __testOnly } from './summarizeCharts';
import type { LogEntry } from '../storage/logs';

test('summarizeCharts computes trend averages and delta', () => {
  const logs = [
    { date: '2026-03-20', flare: 'No', mood: 5, sleep: 4, fatigue: 7, steps: 2000, hydration: 4 },
    { date: '2026-03-21', flare: 'Yes', mood: 7, sleep: 6, fatigue: 5, steps: 5000, hydration: 6 },
  ] as LogEntry[];

  const out = summarizeCharts(logs, 'all');
  expect(out.totalLogs).toBe(2);
  expect(out.flareDays).toBe(1);
  const mood = out.trends.find((t) => t.key === 'mood');
  expect(mood?.average).toBe(6);
  expect(mood?.current).toBe(7);
  expect(mood?.delta).toBe(2);
  expect(Array.isArray(mood?.spark)).toBe(true);
  expect(mood?.spark.length).toBe(2);
});

test('normalizeSeries returns 0.5 for flat values', () => {
  expect(__testOnly.normalizeSeries([3, 3, 3])).toEqual([0.5, 0.5, 0.5]);
});

test('filterTrendsForChartView keeps mood/sleep/fatigue for balance only', () => {
  const logs = [
    { date: '2026-03-20', flare: 'No', mood: 5, sleep: 4, fatigue: 7, steps: 2000, hydration: 4 },
  ] as LogEntry[];
  const out = summarizeCharts(logs, 'all');
  const balance = filterTrendsForChartView(out.trends, 'balance');
  expect(balance.map((t) => t.key)).toEqual(['mood', 'sleep', 'fatigue']);
  const all = filterTrendsForChartView(out.trends, 'combined');
  expect(all.length).toBe(5);
});
