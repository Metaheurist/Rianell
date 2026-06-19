import { pipeline, env } from '@huggingface/transformers';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import type { Preferences, PreferredLlmModelSize } from '../storage/preferences';
import { buildExpoGoLoadAttempts, modelIdFromTier, resolveLlmModelSizeForFeature } from '@rianell/llm';
import {
  buildHomeQuestionPrompt,
  buildMotdPrompt,
  buildSuggestPrompt,
  buildSummaryPrompt,
  buildClinicianBriefPrompt,
  buildExplainChartPrompt,
  buildStructuredSummaryPrompt,
  buildWeekChatPrompt,
  buildDoctorQuestionsPrompt,
} from '@rianell/shared';

type LlmFeature =
  | 'summary'
  | 'suggestNote'
  | 'motd'
  | 'homeQuestion'
  | 'clinicianBrief'
  | 'explainChart'
  | 'structuredSummary'
  | 'weekChat'
  | 'doctorQuestions';

let jsPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;
let jsModelId: string | null = null;
let jsInitPromise: Promise<void> | null = null;

function cacheDirForModel(modelId: string): string {
  const root = LegacyFileSystem.documentDirectory ?? '';
  return `${root}rianell-models-js/${encodeURIComponent(modelId)}/`;
}

function resolveModelIdForFeature(preferredModel: PreferredLlmModelSize, feature: LlmFeature): string {
  const baseTier = preferredModel === 'recommended' ? 'tier3' : preferredModel;
  const resolved = resolveLlmModelSizeForFeature(baseTier, feature);
  return modelIdFromTier(resolved === 'tier1' || resolved === 'tier2' ? 'tier1' : 'tier3');
}

function promptOptions(prefs?: Preferences | null) {
  const persona = prefs?.performance?.llmCoachPersona;
  return persona ? { persona } : {};
}

async function ensureJsPipeline(modelId: string): Promise<void> {
  if (jsPipeline && jsModelId === modelId) return;
  if (jsInitPromise) return jsInitPromise;
  jsInitPromise = (async () => {
    jsPipeline = null;
    jsModelId = null;

    env.remoteHost = 'https://huggingface.co/';
    env.remotePathTemplate = '{model}/resolve/{revision}/';
    env.useBrowserCache = false;
    env.cacheDir = cacheDirForModel(modelId);

    const attempts = buildExpoGoLoadAttempts();
    let lastErr: unknown;
    for (const opts of attempts) {
      try {
        jsPipeline = await pipeline('text-generation', modelId, opts as { revision: string; dtype: 'q4' });
        jsModelId = modelId;
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Expo Go LLM init failed');
  })().finally(() => {
    jsInitPromise = null;
  });
  return jsInitPromise;
}

export async function isJsLlmReady(preferredModel: PreferredLlmModelSize): Promise<boolean> {
  const modelId = resolveModelIdForFeature(preferredModel, 'summary');
  await ensureJsPipeline(modelId);
  return Boolean(jsPipeline);
}

export async function runJsChat(
  feature: LlmFeature,
  preferredModel: PreferredLlmModelSize,
  context: string,
  locale: string,
  prefs?: Preferences | null
): Promise<string | null> {
  const modelId = resolveModelIdForFeature(preferredModel, feature);
  await ensureJsPipeline(modelId);
  if (!jsPipeline) return null;

  const opts = promptOptions(prefs);
  let prompts: { system: string; user: string };
  switch (feature) {
    case 'motd':
      prompts = buildMotdPrompt(locale, undefined, opts);
      break;
    case 'summary':
      prompts = buildSummaryPrompt(locale, context, opts);
      break;
    case 'suggestNote':
      prompts = buildSuggestPrompt(locale, context, opts);
      break;
    case 'homeQuestion':
      prompts = buildHomeQuestionPrompt(locale, context, opts);
      break;
    case 'clinicianBrief':
      prompts = buildClinicianBriefPrompt(locale, context, opts);
      break;
    case 'explainChart':
      prompts = buildExplainChartPrompt(locale, context, opts);
      break;
    case 'structuredSummary':
      prompts = buildStructuredSummaryPrompt(locale, context, opts);
      break;
    case 'weekChat':
      prompts = buildWeekChatPrompt(locale, context, opts);
      break;
    case 'doctorQuestions':
      prompts = buildDoctorQuestionsPrompt(locale, context, opts);
      break;
    default:
      prompts = { system: '', user: context };
  }

  const prompt = `${prompts.system}\n\n${prompts.user}`;

  const out = await (jsPipeline as any)(prompt, {
    max_new_tokens:
      feature === 'motd'
        ? 40
        : feature === 'structuredSummary'
          ? 220
          : feature === 'clinicianBrief'
            ? 260
            : feature === 'doctorQuestions'
              ? 180
            : feature === 'weekChat'
              ? 200
              : 180,
    do_sample: feature === 'motd',
    temperature: feature === 'motd' ? 0.7 : 0.2,
    truncation: true,
  });

  const first = Array.isArray(out) ? out[0] : null;
  const gt = first && (first as any).generated_text;
  if (typeof gt === 'string') return gt.trim();
  if (Array.isArray(gt)) {
    for (let i = gt.length - 1; i >= 0; i -= 1) {
      const msg = gt[i];
      if (msg && (msg.role === 'assistant' || msg.role === 'model') && msg.content) {
        return String(msg.content).trim();
      }
    }
  }
  return null;
}

export async function disposeJsLlm(): Promise<void> {
  try {
    if (jsPipeline && typeof (jsPipeline as any).dispose === 'function') {
      await (jsPipeline as any).dispose();
    }
  } finally {
    jsPipeline = null;
    jsModelId = null;
  }
}
