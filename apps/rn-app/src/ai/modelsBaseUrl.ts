import Constants from 'expo-constants';
import {
  buildSupabaseModelsPublicBase,
  DEFAULT_MODELS_STORAGE_BUCKET,
} from '@rianell/llm';

/**
 * Base URL for self-hosted LLM weights.
 * Priority: EXPO_PUBLIC_MODELS_BASE_URL → Supabase public bucket → rianell.com fallback.
 */
export function getModelsBaseUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const explicit =
    extra.modelsBaseUrl ||
    extra.llmEndpoint ||
    process.env.EXPO_PUBLIC_MODELS_BASE_URL ||
    process.env.EXPO_PUBLIC_LLM_ENDPOINT;
  if (explicit) {
    return explicit.endsWith('/') ? explicit : `${explicit}/`;
  }
  const supabaseUrl = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const bucket =
    extra.modelsStorageBucket ||
    process.env.EXPO_PUBLIC_MODELS_SUPABASE_BUCKET ||
    DEFAULT_MODELS_STORAGE_BUCKET;
  const fromSupabase = buildSupabaseModelsPublicBase(supabaseUrl, bucket);
  if (fromSupabase) return fromSupabase;
  return 'https://rianell.com/';
}
