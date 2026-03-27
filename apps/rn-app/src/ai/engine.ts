import type { LogEntry } from '../storage/logs';
import type { AiSummary } from './analyzeLogs';

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export type PredictedPoint = {
  dayOffset: number;
  value: number;
  lower: number;
  upper: number;
};

/**
 * RN port of web AIEngine shape (lite): deterministic prediction + note helpers.
 * Keeps function names aligned so UI parity layers can evolve without API churn.
 */
export const AIEngine = {
  predictFutureValues(series: number[], days = 7): PredictedPoint[] {
    if (!series.length || days < 1) return [];
    const xs = series.map((_, i) => i + 1);
    const ys = series.map((v) => Number(v));
    const xAvg = avg(xs) ?? 0;
    const yAvg = avg(ys) ?? 0;
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i += 1) {
      num += (xs[i] - xAvg) * (ys[i] - yAvg);
      den += (xs[i] - xAvg) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yAvg - slope * xAvg;
    const resid = ys.map((y, i) => y - (slope * xs[i] + intercept));
    const sigma = Math.sqrt((avg(resid.map((r) => r * r)) ?? 0) || 0.5);
    const out: PredictedPoint[] = [];
    const lastX = xs[xs.length - 1] ?? 1;
    for (let d = 1; d <= days; d += 1) {
      const x = lastX + d;
      const raw = slope * x + intercept;
      const value = Math.max(0, Math.min(10, raw));
      const spread = Math.max(0.4, sigma * 1.2);
      out.push({
        dayOffset: d,
        value,
        lower: Math.max(0, value - spread),
        upper: Math.min(10, value + spread),
      });
    }
    return out;
  },

  suggestLogNote(entry: Partial<LogEntry>): string {
    const hints: string[] = [];
    if (entry.flare === 'Yes') hints.push('Flare day noted');
    if (isNumber(entry.sleep) && entry.sleep <= 4) hints.push('low sleep');
    if (isNumber(entry.fatigue) && entry.fatigue >= 7) hints.push('high fatigue');
    if (isNumber(entry.mood) && entry.mood <= 4) hints.push('lower mood');
    if (isNumber(entry.steps) && entry.steps < 3000) hints.push('reduced activity');
    if (!hints.length) return 'Stable day overall. Track any subtle symptom changes and recovery factors.';
    return `${hints.join(', ')}. Note likely triggers and what helped today for follow-up trends.`;
    },

  generateAnalysisNote(summary: AiSummary): string {
    const lines: string[] = [];
    lines.push(`In ${summary.rangeLabel}, you logged ${summary.totalLogs} entries with ${summary.flareDays} flare day(s).`);
    if (summary.avgSleep != null && summary.avgFatigue != null) {
      lines.push(`Average sleep is ${summary.avgSleep.toFixed(1)}/10 and fatigue is ${summary.avgFatigue.toFixed(1)}/10.`);
    }
    if (summary.topStressors.length) {
      lines.push(`Top stressors: ${summary.topStressors.slice(0, 3).join(', ')}.`);
    }
    if (summary.possibleFlareUp.level !== 'Low') {
      lines.push(`Possible flare-up level is ${summary.possibleFlareUp.level}; prioritize rest and trigger control.`);
    } else {
      lines.push('Current pattern looks relatively stable.');
    }
    return lines.join(' ');
  },
};

