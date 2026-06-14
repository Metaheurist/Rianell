import Constants from 'expo-constants';
import {
  buildHomeQuestionContext,
  buildHomeQuestionFallback,
  buildLlmRequestPayload,
} from '@rianell/shared';
import type { PreferredLlmModelSize } from '../storage/preferences';
import type { BenchmarkResult } from '../performance/benchmark';
import type { AiSummary } from './analyzeLogs';
import { AIEngine } from './engine';
import type { LogEntry } from '../storage/logs';
import { resolveLlmModelSize } from '../performance/benchmark';

type LlmFeature = 'summary' | 'suggestNote' | 'motd' | 'homeQuestion';

const cache = new Map<string, string>();

function modelIdFromSize(size: string): string {
  if (size === 'tier1' || size === 'tier2') return 'SmolLM2-360M-Instruct';
  return 'Llama-3.2-1B-Instruct';
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

async function callRemoteLlm(
  feature: LlmFeature,
  modelSize: string,
  context: string,
  locale: string
): Promise<string | null> {
  const endpoint = getLlmEndpoint();
  if (!endpoint) return null;
  const payload = buildLlmRequestPayload({
    feature,
    model: modelIdFromSize(modelSize),
    modelSize,
    context,
    locale,
  });
  const res = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
  locale: string,
  fallback: () => string
): Promise<string> {
  const cacheKey = `${feature}:${locale}:${key}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const modelSize = resolveLlmModelSize(preferredModel, benchmark);
  try {
    const remote = await callRemoteLlm(feature, modelSize, context, locale);
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
  benchmark: BenchmarkResult | null,
  locale: string
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
    locale,
    () => AIEngine.generateAnalysisNote(summary)
  );
}

export async function suggestLogNote(
  entry: Partial<LogEntry>,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string
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
    locale,
    () => AIEngine.suggestLogNote(entry)
  );
}

const MOTD_FALLBACK = [
  'A glass of water is a good way to start the day.',
  'Sleep is how your body repairs itself.',
  'A short walk can clear a busy mind.',
  'Fresh air costs nothing and helps a lot.',
  'Rest is part of health, not a reward you earn.',
];

export async function generateMotd(
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  recentLogs: number,
  locale: string
): Promise<string> {
  const context = JSON.stringify({ recentLogs, intent: 'simple healthy lifestyle quote for health tracker' });
  return generateWithFallback(
    'motd',
    `motd:${recentLogs}`,
    preferredModel,
    benchmark,
    context,
    locale,
    () => MOTD_FALLBACK[Math.floor(Math.random() * MOTD_FALLBACK.length)] ?? MOTD_FALLBACK[0]
  );
}

type HomeQuestionChip = {
  id: string;
  labelKey: string;
  labelParams?: Record<string, string>;
};

type HomeAnalysisSnapshot = {
  totalLogs?: number;
  flareDays?: number;
  avgMood?: number | null;
  avgSleep?: number | null;
  avgFatigue?: number | null;
  topSymptoms?: string[];
  topStressors?: string[];
};

export async function answerHomeQuestion(
  chip: HomeQuestionChip,
  questionText: string,
  analysis: HomeAnalysisSnapshot,
  logs: LogEntry[],
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string
): Promise<string> {
  const context = (
    buildHomeQuestionContext as (args: {
      questionText: string;
      questionId: string;
      labelParams?: Record<string, string>;
      analysis?: HomeAnalysisSnapshot;
      logs?: LogEntry[];
    }) => string
  )({
    questionText,
    questionId: chip.id,
    labelParams: chip.labelParams || {},
    analysis,
    logs,
  });
  const fallback = buildHomeQuestionFallback(chip, analysis);
  return generateWithFallback(
    'homeQuestion',
    `${chip.id}:${context.slice(0, 120)}`,
    preferredModel,
    benchmark,
    context,
    locale,
    () => fallback
  );
}

export function clearLlmCacheForTests(): void {
  cache.clear();
}
