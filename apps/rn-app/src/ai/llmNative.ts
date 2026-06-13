import AsyncStorage from '@react-native-async-storage/async-storage';
import { modelIdFromTier, pickMotdFallback } from '@rianell/llm';
import type { Preferences } from '../storage/preferences';

const CONSENT_KEY = 'rianell.aiModelDownloadConsent';

export type LlmDownloadProgress = { pct: number; status: 'idle' | 'downloading' | 'ready' | 'error' };

export async function getAiModelDownloadConsent(): Promise<'granted' | 'deferred'> {
  const v = await AsyncStorage.getItem(CONSENT_KEY);
  return v === 'granted' ? 'granted' : 'deferred';
}

export async function setAiModelDownloadConsent(value: 'granted' | 'deferred'): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, value);
}

export function resolveNativeModelId(prefs: Preferences): string {
  const tier = prefs.performance.preferredLlmModelSize;
  if (tier === 'recommended' || tier === 'tier3' || tier === 'tier4' || tier === 'tier5') {
    return modelIdFromTier('tier3');
  }
  return modelIdFromTier('tier1');
}

/** Native on-device path placeholder: warms consent + returns curated MOTD until ONNX RN ships. */
export async function generateMotdNative(prefs: Preferences): Promise<string> {
  const consent = await getAiModelDownloadConsent();
  if (consent !== 'granted') return pickMotdFallback();
  return pickMotdFallback();
}

export async function getAiModelStorageEstimate(): Promise<string> {
  return 'On-device model cache: managed by @rianell/llm (native ONNX path).';
}
