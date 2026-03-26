import type { LogEntry } from '../storage/logs';

export type ChartRange = 14 | 30 | 90 | 'all';
export type TrendMetric = 'mood' | 'sleep' | 'fatigue' | 'steps' | 'hydration';

export type MetricTrend = {
  key: TrendMetric;
  label: string;
  average: number | null;
  current: number | null;
  delta: number | null;
  points: number;
  spark: number[];
};

export type ChartSummary = {
  rangeLabel: string;
  totalLogs: number;
  flareDays: number;
  trends: MetricTrend[];
};

/** Matches web Charts tab: Balance focuses on wellness metrics (steps/hydration are separate in web balance chart). */
export type ChartViewMode = 'balance' | 'individual' | 'combined';

const BALANCE_TREND_KEYS: TrendMetric[] = ['mood', 'sleep', 'fatigue'];

export function filterTrendsForChartView(trends: MetricTrend[], view: ChartViewMode): MetricTrend[] {
  if (view === 'balance') return trends.filter((t) => BALANCE_TREND_KEYS.includes(t.key));
  return trends;
}

const METRICS: Array<{ key: TrendMetric; label: string }> = [
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'steps', label: 'Steps' },
  { key: 'hydration', label: 'Hydration' },
];

function normalizeSeries(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toDate(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function byDateAsc(a: LogEntry, b: LogEntry): number {
  return a.date.localeCompare(b.date);
}

export function filterLogsForCharts(logs: LogEntry[], range: ChartRange): LogEntry[] {
  if (range === 'all') return [...logs].sort(byDateAsc);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (range - 1));
  return logs
    .filter((log) => {
      const d = toDate(log.date);
      return !!d && d >= start && d <= today;
    })
    .sort(byDateAsc);
}

export function summarizeCharts(logs: LogEntry[], range: ChartRange): ChartSummary {
  const selected = filterLogsForCharts(logs, range);
  const trends: MetricTrend[] = METRICS.map(({ key, label }) => {
    const values = selected
      .map((log) => log[key])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const average = mean(values);
    const current = values.length ? values[values.length - 1] : null;
    const first = values.length ? values[0] : null;
    const delta = current != null && first != null ? current - first : null;
    return { key, label, average, current, delta, points: values.length, spark: normalizeSeries(values) };
  });

  return {
    rangeLabel: range === 'all' ? 'All time' : `Last ${range} days`,
    totalLogs: selected.length,
    flareDays: selected.filter((x) => x.flare === 'Yes').length,
    trends,
  };
}

export const __testOnly = {
  normalizeSeries,
};
