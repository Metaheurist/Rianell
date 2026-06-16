import { pipeline, env } from '@huggingface/transformers';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import type { PreferredLlmModelSize } from '../storage/preferences';
import { modelIdFromTier } from '@rianell/llm';

type LlmFeature = 'summary' | 'suggestNote' | 'motd' | 'homeQuestion';

let jsPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;
let jsModelId: string | null = null;
let jsInitPromise: Promise<void> | null = null;

function cacheDirForModel(modelId: string): string {
  const root = LegacyFileSystem.documentDirectory ?? '';
  return `${root}rianell-models-js/${encodeURIComponent(modelId)}/`;
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

    jsPipeline = await pipeline('text-generation', modelId, { revision: 'main' });
    jsModelId = modelId;
  })().finally(() => {
    jsInitPromise = null;
  });
  return jsInitPromise;
}

export async function isJsLlmReady(preferredModel: PreferredLlmModelSize): Promise<boolean> {
  const tier = preferredModel === 'recommended' ? 'tier3' : preferredModel;
  const modelId = modelIdFromTier(tier === 'tier1' || tier === 'tier2' ? 'tier1' : 'tier3');
  await ensureJsPipeline(modelId);
  return Boolean(jsPipeline);
}

export async function runJsChat(
  feature: LlmFeature,
  preferredModel: PreferredLlmModelSize,
  context: string,
  locale: string
): Promise<string | null> {
  const tier = preferredModel === 'recommended' ? 'tier3' : preferredModel;
  const modelId = modelIdFromTier(tier === 'tier1' || tier === 'tier2' ? 'tier1' : 'tier3');
  await ensureJsPipeline(modelId);
  if (!jsPipeline) return null;

  // Keep prompts extremely simple for now; the PWA has richer prompt packs.
  const prompt = `Locale: ${locale}. Feature: ${feature}.\n\n${context}`;

  const out = await (jsPipeline as any)(prompt, {
    max_new_tokens: feature === 'motd' ? 40 : 140,
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

