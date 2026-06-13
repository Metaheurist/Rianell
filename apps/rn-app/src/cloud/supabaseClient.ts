import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { supabaseAuthStorage } from './secureStorageAdapter';

let singleton: SupabaseClient | null = null;

/**
 * Supabase browser client on web uses `SUPABASE_CONFIG`; on native we use Expo `extra` + env at build time.
 * Auth session tokens are stored in expo-secure-store via supabaseAuthStorage.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const extra = Constants.expoConfig?.extra ?? {};
  const url = typeof extra.supabaseUrl === 'string' ? extra.supabaseUrl.trim() : '';
  const key = typeof extra.supabaseAnonKey === 'string' ? extra.supabaseAnonKey.trim() : '';
  if (!url || !key) return null;
  if (!singleton) {
    singleton = createClient(url, key, {
      auth: {
        storage: supabaseAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return singleton;
}

export function resetSupabaseClientForTests(): void {
  singleton = null;
}

/** Phase 5 removed — single Supabase project only. */
export function getSupabaseClientForResidency(_code?: string): SupabaseClient | null {
  return getSupabaseClient();
}
