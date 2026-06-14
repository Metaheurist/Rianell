import fs from 'fs';
import path from 'path';
import { summarizeLogsForAi } from './analyzeLogs';
import { analyzeHealthMetrics } from '@rianell/ai-engine';
import type { LogEntry } from '../storage/logs';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateLogs(count: number, seed: number): LogEntry[] {
  const rand = mulberry32(seed);
  const logs: LogEntry[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    logs.push({
      date: formatDate(d),
      mood: Math.max(1, Math.min(10, Math.round(5 + (rand() - 0.5) * 4))),
      sleep: Math.max(1, Math.min(10, Math.round(6 + (rand() - 0.5) * 3))),
      fatigue: Math.max(1, Math.min(10, Math.round(5 + (rand() - 0.5) * 4))),
      flare: rand() > 0.88 ? 'Yes' : 'No',
      symptoms: ['Headache'],
      stressors: ['Work'],
    } as LogEntry);
  }
  return logs;
}

const FIXTURES: Record<string, LogEntry[]> = {
  logs_30: generateLogs(30, 42),
  logs_365: generateLogs(365, 365),
};

function timeMs(fn: () => void): number {
  const t0 = performance.now();
  fn();
  return Math.round(performance.now() - t0);
}

describe('ai-engine-benchmark', () => {
  it('records probe timings for RN summarize + package parity', () => {
    const probes: object[] = [];
    const logs365 = FIXTURES.logs_365;
    const logs30 = FIXTURES.logs_30;

    probes.push({
      fixture: 'logs_365',
      probe_id: 'rn_summarize_14',
      probe_type: 'rn',
      ms: timeMs(() => {
        summarizeLogsForAi(logs365, 14);
      }),
      status: 'ok',
    });
    probes.push({
      fixture: 'logs_365',
      probe_id: 'rn_summarize_30',
      probe_type: 'rn',
      ms: timeMs(() => {
        summarizeLogsForAi(logs365, 30);
      }),
      status: 'ok',
    });
    probes.push({
      fixture: 'logs_365',
      probe_id: 'rn_summarize_90',
      probe_type: 'rn',
      ms: timeMs(() => {
        summarizeLogsForAi(logs365, 90);
      }),
      status: 'ok',
    });

    const rnSummary = summarizeLogsForAi(logs30, 30);
    const pkgSummary = analyzeHealthMetrics(logs30 as never[], 30);
    const parityOk = rnSummary.flareDays === pkgSummary.flareDays;
    probes.push({
      fixture: 'logs_30',
      probe_id: 'rn_package_parity',
      probe_type: 'rn',
      ms: timeMs(() => {
        analyzeHealthMetrics(logs30 as never[], 30);
      }),
      status: parityOk ? 'ok' : 'fail',
      rn_flare_days: rnSummary.flareDays,
      pkg_flare_days: pkgSummary.flareDays,
    });

    const outPath = process.env.AI_BENCH_WRITE;
    if (outPath) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify({ probes }), 'utf8');
    }

    expect(probes.length).toBe(4);
    expect(probes.every((p) => (p as { status: string }).status === 'ok')).toBe(true);
  });
});
