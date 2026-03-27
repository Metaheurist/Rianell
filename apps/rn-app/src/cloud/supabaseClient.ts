import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

let singleton: SupabaseClient | null = null;

/**
 * Supabase browser client on web uses `SUPABASE_CONFIG`; on native we use Expo `extra` + env at build time.
 * Returns null when URL/key are missing so UI can show a configuration hint.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const extra = Constants.expoConfig?.extra ?? {};
  const url = typeof extra.supabaseUrl === 'string' ? extra.supabaseUrl.trim() : '';
  const key = typeof extra.supabaseAnonKey === 'string' ? extra.supabaseAnonKey.trim() : '';
  if (!url || !key) return null;
  if (!singleton) {
    singleton = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
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
