import Constants from 'expo-constants';
import {
  buildHomeQuestionContext,
  buildHomeQuestionFallback,
  buildClinicianBriefContext,
  buildClinicianBriefFallback,
  buildExplainChartContext,
  buildExplainChartFallback,
  buildLlmRequestPayload,
  isLlmInferenceAllowed,
  canAnswerHomeQuestionToday,
  parseStructuredLlmOutput,
  formatStructuredLlmOutput,
  buildWeekChatContext,
  formatWeekChatHistory,
  buildWeekChatUserPayload,
  buildWeekChatFallback,
  canSendWeekChatTurn,
  MAX_WEEK_CHAT_TURNS,
} from '@rianell/shared';
import { resolveLlmModelSizeForFeature } from '@rianell/llm';
import type { PreferredLlmModelSize } from '../storage/preferences';
import type { BenchmarkResult } from '../performance/benchmark';
import type { AiSummary } from './analyzeLogs';
import { AIEngine } from './engine';
import type { LogEntry } from '../storage/logs';
import type { ChartSummary } from '../charts/summarizeCharts';
import { loadPreferences } from '../storage/preferences';
import { resolveLlmModelSize } from '../performance/benchmark';
import { isOnDeviceLlmReady, runOnDeviceChat } from './llmNative';

export type LlmFeature =
  | 'summary'
  | 'suggestNote'
  | 'motd'
  | 'homeQuestion'
  | 'clinicianBrief'
  | 'explainChart'
  | 'structuredSummary'
  | 'weekChat';

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

function sanitizeMultiline(input: string, maxLen = 1400): string {
  const clean = input.replace(/\r\n/g, '\n').trim();
  if (!clean) return '';
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
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
  fallback: () => string,
  prefs?: { uiLocale?: string; performance: { preferredLlmModelSize: PreferredLlmModelSize } } | null,
  options?: { multiline?: boolean; structured?: boolean }
): Promise<string> {
  const cacheKey = `${feature}:${locale}:${key}`;
  const skipCache = feature === 'weekChat';
  if (!skipCache) {
    const hit = cache.get(cacheKey);
    if (hit) return hit;
  }
  const finish = (raw: string) => {
    const clean = options?.structured
      ? raw
      : options?.multiline
        ? sanitizeMultiline(raw)
        : sanitizeOneLine(raw);
    if (clean && !skipCache) cache.set(cacheKey, clean);
    return clean;
  };
  if (!isLlmInferenceAllowed(locale)) {
    return finish(fallback());
  }
  const modelSize = resolveLlmModelSizeForFeature(
    resolveLlmModelSize(preferredModel, benchmark),
    feature
  );
  if (prefs) {
    try {
      if (await isOnDeviceLlmReady(prefs as any)) {
        const onDevice = await runOnDeviceChat(prefs as any, feature, context, locale);
        if (onDevice) {
          if (options?.structured) {
            const parsed = parseStructuredLlmOutput(onDevice);
            if (parsed) return finish(formatStructuredLlmOutput(parsed));
          } else {
            const clean = options?.multiline ? sanitizeMultiline(onDevice) : sanitizeOneLine(onDevice);
            if (clean) return finish(clean);
          }
        }
      }
    } catch {
      // fall through
    }
  }
  try {
    const fullPrefs = await loadPreferences();
    const { shouldAllowNetworkOperation } = await import('@rianell/shared');
    if (shouldAllowNetworkOperation(fullPrefs, 'remoteLlm')) {
      const remote = await callRemoteLlm(feature, modelSize, context, locale);
      if (remote) {
        if (options?.structured) {
          const parsed = parseStructuredLlmOutput(remote);
          if (parsed) return finish(formatStructuredLlmOutput(parsed));
        }
        return finish(remote);
      }
    }
  } catch {
    // fall through
  }
  return finish(fallback());
}

export async function generateSummaryNote(
  summary: AiSummary,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string,
  prefs?: any
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
    () => AIEngine.generateAnalysisNote(summary),
    prefs || null
  );
}

export async function suggestLogNote(
  entry: Partial<LogEntry>,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string,
  prefs?: any
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
    () => AIEngine.suggestLogNote(entry),
    prefs || null
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
  locale: string,
  prefs?: any
): Promise<string> {
  const context = JSON.stringify({ recentLogs, intent: 'simple healthy lifestyle quote for health tracker' });
  return generateWithFallback(
    'motd',
    `motd:${recentLogs}`,
    preferredModel,
    benchmark,
    context,
    locale,
    () => MOTD_FALLBACK[Math.floor(Math.random() * MOTD_FALLBACK.length)] ?? MOTD_FALLBACK[0],
    prefs || null
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
  locale: string,
  prefs?: any
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
  const todayKey = new Date().toISOString().slice(0, 10);
  if (!canAnswerHomeQuestionToday(prefs?.homeQuestionAnswerState, todayKey)) {
    return fallback;
  }
  return generateWithFallback(
    'homeQuestion',
    `${chip.id}:${context.slice(0, 120)}`,
    preferredModel,
    benchmark,
    context,
    locale,
    () => fallback,
    prefs || null
  );
}

export function clearLlmCacheForTests(): void {
  cache.clear();
}

export async function generateClinicianVisitBrief(
  summary: AiSummary,
  logs: LogEntry[],
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string,
  prefs?: any
): Promise<string> {
  const context = buildClinicianBriefContext({
    analysis: summary,
    logs,
    rangeLabel: summary.rangeLabel,
    goals: prefs?.goals,
  } as unknown as Parameters<typeof buildClinicianBriefContext>[0]);
  return generateWithFallback(
    'clinicianBrief',
    `${summary.rangeLabel}:${summary.totalLogs}`,
    preferredModel,
    benchmark,
    context,
    locale,
    () => buildClinicianBriefFallback(summary),
    prefs || null,
    { multiline: true }
  );
}

export async function explainChartRange(
  chartSummary: ChartSummary,
  viewMode: string,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string,
  prefs?: any
): Promise<string> {
  const context = buildExplainChartContext({
    rangeLabel: chartSummary.rangeLabel,
    viewMode,
    trends: chartSummary.trends,
    totalLogs: chartSummary.totalLogs,
    flareDays: chartSummary.flareDays,
  } as unknown as Parameters<typeof buildExplainChartContext>[0]);
  return generateWithFallback(
    'explainChart',
    `${chartSummary.rangeLabel}:${viewMode}:${chartSummary.totalLogs}`,
    preferredModel,
    benchmark,
    context,
    locale,
    () => buildExplainChartFallback(chartSummary),
    prefs || null,
    { multiline: true }
  );
}

export async function generateStructuredInsights(
  summary: AiSummary,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string,
  prefs?: any
): Promise<string> {
  const context = JSON.stringify({
    range: summary.rangeLabel,
    totalLogs: summary.totalLogs,
    flareDays: summary.flareDays,
    avgMood: summary.avgMood,
    avgSleep: summary.avgSleep,
    avgFatigue: summary.avgFatigue,
    topSymptoms: summary.topSymptoms.slice(0, 5),
    thingsToWatch: summary.thingsToWatch?.slice(0, 3),
  });
  const ruleFallback = () => {
    const lines = summary.thingsToWatch?.slice(0, 2) || [];
    const parsed = parseStructuredLlmOutput(
      JSON.stringify({
        insights: lines.length ? lines : ['Patterns are still forming from your logs.'],
        actions: ['Keep logging daily to strengthen trend signals.'],
        confidence: 0.5,
      })
    );
    return parsed ? formatStructuredLlmOutput(parsed) : '';
  };
  return generateWithFallback(
    'structuredSummary',
    `structured:${summary.rangeLabel}:${summary.totalLogs}`,
    preferredModel,
    benchmark,
    context,
    locale,
    ruleFallback,
    prefs || null,
    { structured: true, multiline: true }
  );
}

export type WeekChatTurn = { user: string; assistant: string };

export async function sendWeekChatMessage(
  summary: AiSummary,
  logs: LogEntry[],
  turns: WeekChatTurn[],
  userMessage: string,
  preferredModel: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null,
  locale: string,
  prefs?: any
): Promise<{ reply: string; canSendAnother: boolean }> {
  const trimmed = userMessage.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return { reply: '', canSendAnother: canSendWeekChatTurn(turns.length) };
  }
  if (!canSendWeekChatTurn(turns.length)) {
    return { reply: '', canSendAnother: false };
  }
  const rangeDays = typeof summary.rangeLabel === 'string' && summary.rangeLabel.includes('14') ? 14 : 30;
  const baseContext = buildWeekChatContext({
    analysis: summary,
    logs: logs as Array<{ notes?: string }>,
    rangeLabel: summary.rangeLabel,
    rangeDays,
  });
  const history = formatWeekChatHistory(turns);
  const payload = buildWeekChatUserPayload({ baseContext, history, userMessage: trimmed });
  const reply = await generateWithFallback(
    'weekChat',
    `${turns.length}:${trimmed.slice(0, 80)}`,
    preferredModel,
    benchmark,
    payload,
    locale,
    () => buildWeekChatFallback(summary),
    prefs || null,
    { multiline: true }
  );
  return {
    reply,
    canSendAnother: turns.length + 1 < MAX_WEEK_CHAT_TURNS,
  };
}
