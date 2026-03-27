import Constants from 'expo-constants';
import type { PreferredLlmModelSize } from '../storage/preferences';
import type { BenchmarkResult } from '../performance/benchmark';
import type { AiSummary } from './analyzeLogs';
import { AIEngine } from './engine';
import type { LogEntry } from '../storage/logs';
import { resolveLlmModelSize } from '../performance/benchmark';

type LlmFeature = 'summary' | 'suggestNote' | 'motd';

const cache = new Map<string, string>();

function modelIdFromSize(size: string): string {
  if (size === 'tier1' || size === 'tier2') return 'flan-t5-small';
  return 'flan-t5-base';
}

function getLlmEndpoint(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  const raw = typeof extra.llmEndpoint === 'string' ? extra.llmEndpoint : '';
  return raw.trim();
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), ms)),
  ]);
}

function sanitizeOneLine(input: string, maxLen = 220): string {
  const clean = input.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}...` : clean;
}

async function callRemoteLlm(feature: LlmFeature, modelSize: string, context: string): Promise<string | null> {
  const endpoint = getLlmEndpoint();
  if (!endpoint) return null;
  const res = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature,
        model: modelIdFromSize(modelSize),
        modelSize,
        context,
      }),
    }),
    5500
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { text?: string };
  return typeof data.text === 'string' ? sanitizeOneLine(data.text) : null;
}

async function generateWithFallback(
  feature: LlmFeature,
  key: string,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  context: string,
  fallback: () => string
): Promise<string> {
  const cacheKey = `${feature}:${key}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const modelSize = resolveLlmModelSize(preferredModel, benchmark);
  try {
    const remote = await callRemoteLlm(feature, modelSize, context);
    if (remote) {
      cache.set(cacheKey, remote);
      return remote;
    }
  } catch {
    // fall through
  }
  const local = sanitizeOneLine(fallback());
  cache.set(cacheKey, local);
  return local;
}

export async function generateSummaryNote(
  summary: AiSummary,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null
): Promise<string> {
  const context = JSON.stringify({
    range: summary.rangeLabel,
    totalLogs: summary.totalLogs,
    flareDays: summary.flareDays,
    avgMood: summary.avgMood,
    avgSleep: summary.avgSleep,
    avgFatigue: summary.avgFatigue,
    topSymptoms: summary.topSymptoms.slice(0, 5),
    topStressors: summary.topStressors.slice(0, 5),
  });
  return generateWithFallback(
    'summary',
    `${summary.rangeLabel}:${summary.totalLogs}:${summary.flareDays}`,
    preferredModel,
    benchmark,
    context,
    () => AIEngine.generateAnalysisNote(summary)
  );
}

export async function suggestLogNote(
  entry: Partial<LogEntry>,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null
): Promise<string> {
  const context = JSON.stringify({
    flare: entry.flare,
    sleep: entry.sleep,
    fatigue: entry.fatigue,
    mood: entry.mood,
    steps: entry.steps,
    symptoms: entry.symptoms,
    stressors: entry.stressors,
  });
  return generateWithFallback(
    'suggestNote',
    context,
    preferredModel,
    benchmark,
    context,
    () => AIEngine.suggestLogNote(entry)
  );
}

const MOTD_FALLBACK = [
  'Small logs build strong health insight over time.',
  'Consistency beats intensity. One useful entry today is enough.',
  'Track the pattern, not just the flare. You are building signal.',
  'Recovery is data too. Better days are part of the trend.',
  'Notice what helps on good days and repeat it.',
];

export async function generateMotd(
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  recentLogs: number
): Promise<string> {
  const context = JSON.stringify({ recentLogs, intent: 'short motivational health tracker message' });
  return generateWithFallback(
    'motd',
    `motd:${recentLogs}`,
    preferredModel,
    benchmark,
    context,
    () => MOTD_FALLBACK[Math.floor(Math.random() * MOTD_FALLBACK.length)] ?? MOTD_FALLBACK[0]
  );
}

export function clearLlmCacheForTests(): void {
  cache.clear();
}

