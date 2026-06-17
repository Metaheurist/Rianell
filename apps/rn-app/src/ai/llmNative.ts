import AsyncStorage from '@react-native-async-storage/async-storage';

import {

  buildHuggingFaceModelFileUrl,

  logicalFilePaths,

  modelIdFromTier,

  normalizeModelFileEntries,

  pickMotdFallback,

  buildRnLoadAttempts,

  parseOomError,

  LAST_STABLE_PRESET_KEY,

} from '@rianell/llm';

import {
  buildHomeQuestionPrompt,
  buildMotdPrompt,
  buildSuggestPrompt,
  buildSummaryPrompt,
} from '@rianell/shared';

import { Directory, File, Paths } from 'expo-file-system';

import * as LegacyFileSystem from 'expo-file-system/legacy';

import type { Preferences } from '../storage/preferences';

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { buildManifestUrl, buildHfFileUrl, getManifestCatalogUrl } from './modelsBaseUrl';
import { detectLlmRuntime } from './llmRuntime';



const CONSENT_KEY = 'rianell.aiModelDownloadConsent';

const READY_KEY = 'rianell.aiModelReady';



export type LlmDownloadProgress = {

  pct: number;

  status: 'idle' | 'downloading' | 'ready' | 'error';

  file?: string;

};



type ManifestEntry = {

  id: string;

  sourceRepo?: string;

  revision: string;

  files: Array<string | { path: string; sizeBytes?: number; chunks?: string[] }>;

};



type ModelsManifest = {

  models: ManifestEntry[];

};



type ProgressListener = (progress: LlmDownloadProgress) => void;



let downloadProgress: LlmDownloadProgress = { pct: 0, status: 'idle' };

let nativePipelineKey: string | null = null;

let nativeActiveBackend: string | null = null;

let nativeLoadedModelId: string | null = null;

const progressListeners = new Set<ProgressListener>();



function nativePlatformKind(): 'rn_android' | 'rn_ios' {
  return Platform.OS === 'ios' ? 'rn_ios' : 'rn_android';
}

function buildNativeLlmPrompt(
  feature: 'summary' | 'suggestNote' | 'motd' | 'homeQuestion',
  context: string,
  locale: string
): { system: string; user: string } {
  switch (feature) {
    case 'motd':
      return buildMotdPrompt(locale);
    case 'summary':
      return buildSummaryPrompt(locale, context);
    case 'suggestNote':
      return buildSuggestPrompt(locale, context);
    case 'homeQuestion':
      return buildHomeQuestionPrompt(locale, context);
    default:
      return { system: '', user: context };
  }
}

async function createHfFetch(cacheDir: string) {
  return async (url: string) => {
    const rel = url.split('/resolve/').pop() || '';
    const localPath = `${cacheDir}${rel.replace(/^main\//, '')}`.replace(/\\/g, '/');
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
    const destDir = `${localPath.split('/').slice(0, -1).join('/')}/`;
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true }).catch(() => {});
    const res = await FileSystem.downloadAsync(url, localPath);
    return res.uri;
  };
}

async function warmupNativePipeline(): Promise<void> {
  const { Pipeline } = await import('react-native-transformers');
  let out = '';
  await Pipeline.TextGeneration.generate('Reply with OK.', (t: string) => {
    out = t;
  });
  if (!out) throw new Error('Native LLM warmup failed');
}

async function ensureNativePipeline(modelId: string, cacheDir: string): Promise<void> {
  const key = `${modelId}:${cacheDir}`;
  if (nativePipelineKey === key) return;

  const { Pipeline } = await import('react-native-transformers');
  const fetchHf = await createHfFetch(cacheDir);
  const attempts = buildRnLoadAttempts({ platformKind: nativePlatformKind(), modelId });
  let lastErr: unknown;

  for (const attempt of attempts) {
    try {
      await Pipeline.TextGeneration.init(modelId, attempt.onnxPath, {
        fetch: fetchHf,
        executionProviders: attempt.executionProviders,
        externalData: attempt.externalData,
        verbose: __DEV__,
      });
      nativePipelineKey = key;
      nativeLoadedModelId = modelId;
      nativeActiveBackend = attempt.executionProviders[0] || 'cpu';
      await warmupNativePipeline();
      await AsyncStorage.setItem(
        LAST_STABLE_PRESET_KEY,
        JSON.stringify({ modelId, activeBackend: nativeActiveBackend, ts: Date.now() })
      );
      return;
    } catch (err) {
      lastErr = err;
      if (parseOomError(err) && modelId !== modelIdFromTier('tier1')) {
        try {
          const smallId = modelIdFromTier('tier1');
          const smallCacheDir = getNativeModelCacheDir(smallId, 'main');
          const smallFetch = await createHfFetch(smallCacheDir);
          const smallAttempts = buildRnLoadAttempts({ platformKind: nativePlatformKind(), modelId: smallId });
          for (const smallAttempt of smallAttempts) {
            try {
              await Pipeline.TextGeneration.init(smallId, smallAttempt.onnxPath, {
                fetch: smallFetch,
                executionProviders: smallAttempt.executionProviders,
                externalData: smallAttempt.externalData,
                verbose: __DEV__,
              });
              nativePipelineKey = `${smallId}:${smallCacheDir}`;
              nativeLoadedModelId = smallId;
              nativeActiveBackend = smallAttempt.executionProviders[0] || 'cpu';
              await warmupNativePipeline();
              return;
            } catch (smallErr) {
              lastErr = smallErr;
            }
          }
        } catch (_) {
          /* fall through */
        }
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Native LLM init failed');
}

export function getNativeActiveBackend(): string | null {
  return nativeActiveBackend;
}

export function getNativeAiModelStatus(): {
  modelId: string | null;
  activeBackend: string | null;
  state: 'idle' | 'downloading' | 'ready';
} {
  return {
    modelId: nativeLoadedModelId,
    activeBackend: nativeActiveBackend,
    state: downloadProgress.status === 'downloading' ? 'downloading' : nativePipelineKey ? 'ready' : 'idle',
  };
}

function emitProgress(next: LlmDownloadProgress) {
  downloadProgress = next;

  progressListeners.forEach((fn) => fn(next));

}



export function subscribeNativeLlmDownloadProgress(listener: ProgressListener): () => void {

  progressListeners.add(listener);

  listener(downloadProgress);

  return () => progressListeners.delete(listener);

}



export function getNativeLlmDownloadProgress(): LlmDownloadProgress {

  return downloadProgress;

}



export async function getAiModelDownloadConsent(): Promise<'granted' | 'deferred'> {

  const v = await AsyncStorage.getItem(CONSENT_KEY);

  return v === 'granted' ? 'granted' : 'deferred';

}



export async function setAiModelDownloadConsent(value: 'granted' | 'deferred'): Promise<void> {

  await AsyncStorage.setItem(CONSENT_KEY, value);

}



export function resolveNativeModelId(prefs: Preferences): string {

  const tier = prefs.performance.preferredLlmModelSize;

  if (tier === 'tier1' || tier === 'tier2') return modelIdFromTier('tier1');

  if (tier === 'tier3' || tier === 'tier4' || tier === 'tier5') return modelIdFromTier('tier3');

  return modelIdFromTier('tier3');

}



export function getNativeModelCacheDir(modelId: string, revision = 'main'): string {

  const root = LegacyFileSystem.documentDirectory ?? '';

  return `${root}rianell-models/${modelId}/resolve/${revision}/`;

}



function cacheFileFromDir(cacheDir: string, relativePath: string): File {

  const parts = relativePath.split('/').filter(Boolean);

  return new File(new Directory(cacheDir.replace(/\/?$/, '')), ...parts);

}



async function fetchModelsManifest(baseUrl: string): Promise<ModelsManifest> {

  const url = baseUrl ? buildManifestUrl(baseUrl) : getManifestCatalogUrl();

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {

    throw new Error(`Could not load models manifest (${res.status}) from ${url}`);

  }

  return (await res.json()) as ModelsManifest;

}



async function isModelCacheComplete(model: ManifestEntry, cacheDir: string): Promise<boolean> {

  const readyPath = `${cacheDir}.ready`;

  const readyInfo = await LegacyFileSystem.getInfoAsync(readyPath);

  if (!readyInfo.exists) return false;

  const paths = logicalFilePaths(model);

  for (const file of paths) {

    const dest = cacheFileFromDir(cacheDir, file);

    if (!dest.exists || !dest.size) return false;

  }

  return true;

}



async function downloadPlainFile(url: string, dest: File, onProgress: (pct: number) => void): Promise<void> {

  const parent = dest.parentDirectory;

  parent.create({ intermediates: true, idempotent: true });

  const chunkDir = new Directory(Paths.cache, 'rianell-dl-tmp');

  chunkDir.create({ intermediates: true, idempotent: true });

  const temp = await File.downloadFileAsync(url, chunkDir, { idempotent: true });

  if (dest.exists) dest.delete();

  temp.move(dest);

  onProgress(100);

}



async function downloadChunkedFile(

  baseUrl: string,

  modelId: string,

  revision: string,

  entry: { path: string; sizeBytes?: number | null; chunks?: string[] | null },

  dest: File,

  onProgress: (pct: number) => void

): Promise<void> {

  const chunks = entry.chunks || [];

  if (!chunks.length) return;



  dest.parentDirectory.create({ intermediates: true, idempotent: true });

  if (dest.exists) dest.delete();

  dest.create({ overwrite: true });



  const tempDir = new Directory(Paths.cache, 'rianell-chunks');

  tempDir.create({ intermediates: true, idempotent: true });



  for (let i = 0; i < chunks.length; i += 1) {

    const chunkPath = chunks[i];

    const chunkUrl = buildHuggingFaceModelFileUrl(modelId, revision, chunkPath);

    const chunkFile = await File.downloadFileAsync(chunkUrl, tempDir, { idempotent: true });

    const bytes = await chunkFile.bytes();

    dest.write(bytes, { append: i > 0 });

    chunkFile.delete();

    onProgress(Math.round(((i + 1) / chunks.length) * 100));

  }

}



/** Download ONNX weights from Supabase (chunked) or same-origin /models/ tree. */

export async function preloadNativeLlm(prefs: Preferences): Promise<void> {

  const modelId = resolveNativeModelId(prefs);

  const baseUrl = '';
  const manifest = await fetchModelsManifest(baseUrl);

  const entry = manifest.models.find((m) => m.id === modelId);

  if (!entry) {

    throw new Error(`Model ${modelId} not listed in manifest.json`);

  }



  const cacheDir = getNativeModelCacheDir(modelId, entry.revision);

  if (await isModelCacheComplete(entry, cacheDir)) {

    emitProgress({ pct: 100, status: 'ready' });

    await AsyncStorage.setItem(READY_KEY, '1');

    return;

  }



  const fileEntries = normalizeModelFileEntries(entry);

  emitProgress({ pct: 0, status: 'downloading', file: '' });



  for (let i = 0; i < fileEntries.length; i += 1) {

    const fileEntry = fileEntries[i];

    const dest = cacheFileFromDir(cacheDir, fileEntry.path);

    if (dest.exists && dest.size > 0) {

      if (!fileEntry.sizeBytes || dest.size === fileEntry.sizeBytes) {

        const pct = Math.round(((i + 1) / fileEntries.length) * 100);

        emitProgress({ pct, status: 'downloading', file: fileEntry.path.split('/').pop() });

        continue;

      }

      dest.delete();

    }



    emitProgress({

      pct: Math.round((i / fileEntries.length) * 100),

      status: 'downloading',

      file: fileEntry.path.split('/').pop(),

    });



    if (fileEntry.chunks && fileEntry.chunks.length) {
      // Legacy chunk format (Supabase) is ignored for HF-only runtime.
      const url = buildHfFileUrl(entry, fileEntry.path);
      await downloadPlainFile(url, dest, (filePct) => {

        const overall = ((i + filePct / 100) / fileEntries.length) * 100;

        emitProgress({

          pct: Math.min(99, Math.round(overall)),

          status: 'downloading',

          file: fileEntry.path.split('/').pop(),

        });

      });

    } else {

      const url = buildHfFileUrl(entry, fileEntry.path);

      await downloadPlainFile(url, dest, (filePct) => {

        const overall = ((i + filePct / 100) / fileEntries.length) * 100;

        emitProgress({

          pct: Math.min(99, Math.round(overall)),

          status: 'downloading',

          file: fileEntry.path.split('/').pop(),

        });

      });

    }

  }



  await LegacyFileSystem.writeAsStringAsync(`${cacheDir}.ready`, '1');

  await AsyncStorage.setItem(READY_KEY, '1');

  emitProgress({ pct: 100, status: 'ready' });

}



/** Native on-device path placeholder: warms consent + returns curated MOTD until ONNX RN ships. */

export async function generateMotdNative(prefs: Preferences): Promise<string> {

  const consent = await getAiModelDownloadConsent();

  if (consent !== 'granted') return pickMotdFallback();

  try {
    const locale = prefs.uiLocale || 'en-GB';
    const { user } = buildMotdPrompt(locale);
    const t = await runOnDeviceChat(prefs, 'motd', user, locale);
    if (t) return t;
  } catch (_) {}
  return pickMotdFallback();

}

export async function isOnDeviceLlmReady(prefs: Preferences): Promise<boolean> {
  const consent = await getAiModelDownloadConsent();
  if (consent !== 'granted') return false;
  const modelId = resolveNativeModelId(prefs);
  const manifest = await fetchModelsManifest('');
  const entry = manifest.models.find((m) => m.id === modelId);
  if (!entry) return false;
  const cacheDir = getNativeModelCacheDir(modelId, entry.revision);
  if (!(await isModelCacheComplete(entry, cacheDir))) return false;

  if (detectLlmRuntime() === 'transformers-wasm') {
    const mod = await import('./llmJs');
    return mod.isJsLlmReady(prefs.performance.preferredLlmModelSize);
  }
  return true;
}

export async function runOnDeviceChat(
  prefs: Preferences,
  feature: 'summary' | 'suggestNote' | 'motd' | 'homeQuestion',
  context: string,
  locale: string
): Promise<string | null> {
  const consent = await getAiModelDownloadConsent();
  if (consent !== 'granted') return null;
  if (downloadProgress.status === 'downloading') return null;

  if (detectLlmRuntime() === 'transformers-wasm') {
    const mod = await import('./llmJs');
    return mod.runJsChat(feature, prefs.performance.preferredLlmModelSize, context, locale);
  }

  const modelId = resolveNativeModelId(prefs);
  const manifest = await fetchModelsManifest('');
  const entry = manifest.models.find((m) => m.id === modelId);
  if (!entry) return null;
  const cacheDir = getNativeModelCacheDir(modelId, entry.revision);

  await ensureNativePipeline(modelId, cacheDir);

  const { Pipeline } = await import('react-native-transformers');

  const prompts = buildNativeLlmPrompt(feature, context, locale);
  const prompt = `${prompts.system}\n\n${prompts.user}`;
  let text = '';
  await Pipeline.TextGeneration.generate(prompt, (t: string) => {
    text = t;
  });
  return text ? String(text).trim() : null;
}



export async function getAiModelStorageEstimate(): Promise<string> {

  return 'On-device model cache under app documents/rianell-models/';

}

