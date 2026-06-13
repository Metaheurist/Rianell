import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  GOALS_STORAGE_KEY,
  LOGS_STORAGE_KEY_V1,
  mergeHealthLogs,
  normalizeGoals,
  SETTINGS_STORAGE_KEY,
} from '@rianell/shared';
import { decryptJsonAesGcm, encryptJsonAesGcm } from '@rianell/cloud-sync';
import { getSupabaseClient } from './supabaseClient';
import type { LogEntry } from '../storage/logs';
import { loadLogs, saveLogs } from '../storage/logs';
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences';

function generateUserEncryptionKey(): string {
  const arr = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getUserEncryptionKey(client: SupabaseClient, user: User): Promise<string | null> {
  const { data: keyData, error: keyError } = await client
    .from('user_keys')
    .select('encryption_key')
    .eq('user_id', user.id)
    .maybeSingle();

  if (keyData?.encryption_key) return keyData.encryption_key;
  if (keyError && keyError.code !== 'PGRST116') return null;

  const newKey = generateUserEncryptionKey();
  const { error: insertError } = await client.from('user_keys').insert({
    user_id: user.id,
    encryption_key: newKey,
    created_at: new Date().toISOString(),
  });
  if (insertError) {
    const { data: existing } = await client
      .from('user_keys')
      .select('encryption_key')
      .eq('user_id', user.id)
      .maybeSingle();
    return existing?.encryption_key ?? null;
  }
  return newKey;
}

async function readGoalsJson(): Promise<string | null> {
  return AsyncStorage.getItem(GOALS_STORAGE_KEY);
}

async function writeGoalsFromSettings(settings: Record<string, unknown>): Promise<void> {
  if (settings.goals && typeof settings.goals === 'object') {
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(normalizeGoals(settings.goals)));
  }
}

export async function syncToCloud(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in to sync.' };

  const userKey = await getUserEncryptionKey(client, user);
  if (!userKey) return { ok: false, message: 'Could not obtain encryption key.' };

  const localLogs = await loadLogs();
  const prefs = await loadPreferences();
  const settingsRaw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
  const localSettings = settingsRaw ? JSON.parse(settingsRaw) : {};
  const goalsRaw = await readGoalsJson();
  const mergedSettings = {
    ...localSettings,
    ...prefs,
    goals: goalsRaw ? JSON.parse(goalsRaw) : undefined,
  };

  const { data: cloudData } = await client
    .from('health_data')
    .select('health_logs, app_settings')
    .eq('user_id', user.id)
    .maybeSingle();

  let cloudLogs: LogEntry[] = [];
  let cloudSettings: Record<string, unknown> = {};
  if (cloudData?.health_logs) {
    try {
      const decrypted = await decryptJsonAesGcm(cloudData.health_logs, userKey);
      cloudLogs = Array.isArray(decrypted) ? decrypted : JSON.parse(String(decrypted));
    } catch {
      /* use empty */
    }
  }
  if (cloudData?.app_settings) {
    try {
      const decrypted = await decryptJsonAesGcm(cloudData.app_settings, userKey);
      cloudSettings = typeof decrypted === 'object' ? decrypted : JSON.parse(String(decrypted));
    } catch {
      /* use empty */
    }
  }

  const mergedLogs = mergeHealthLogs(localLogs, cloudLogs) as LogEntry[];
  const settingsOut = { ...cloudSettings, ...mergedSettings };

  const encryptedLogs = await encryptJsonAesGcm(mergedLogs, userKey);
  const encryptedSettings = await encryptJsonAesGcm(settingsOut, userKey);

  const { error } = await client.from('health_data').upsert({
    user_id: user.id,
    health_logs: encryptedLogs,
    app_settings: encryptedSettings,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };
  await saveLogs(mergedLogs);
  return { ok: true, message: `Synced ${mergedLogs.length} log(s).` };
}

export async function loadFromCloud(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in to load from cloud.' };

  const userKey = await getUserEncryptionKey(client, user);
  if (!userKey) return { ok: false, message: 'Could not obtain encryption key.' };

  const { data: cloudData, error } = await client
    .from('health_data')
    .select('health_logs, app_settings')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!cloudData) return { ok: false, message: 'No cloud backup found for this account.' };

  let cloudLogs: LogEntry[] = [];
  if (cloudData.health_logs) {
    const decrypted = await decryptJsonAesGcm(cloudData.health_logs, userKey);
    cloudLogs = Array.isArray(decrypted) ? decrypted : JSON.parse(String(decrypted));
  }

  const localLogs = await loadLogs();
  const merged = mergeHealthLogs(localLogs, cloudLogs) as LogEntry[];
  await saveLogs(merged);

  if (cloudData.app_settings) {
    try {
      const decrypted = await decryptJsonAesGcm(cloudData.app_settings, userKey);
      const settings = typeof decrypted === 'object' ? decrypted : JSON.parse(String(decrypted));
      if (settings && typeof settings === 'object') {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        await writeGoalsFromSettings(settings);
        const prefs = await loadPreferences();
        const next: Preferences = {
          ...prefs,
          userName: typeof settings.userName === 'string' ? settings.userName : prefs.userName,
          medicalCondition:
            typeof settings.medicalCondition === 'string' ? settings.medicalCondition : prefs.medicalCondition,
          weightUnit: settings.weightUnit === 'lb' ? 'lb' : prefs.weightUnit,
          contributeAnonData: settings.contributeAnonData === true,
          useOpenData: settings.useOpenData === true,
        };
        await savePreferences(next);
      }
    } catch {
      /* settings optional */
    }
  }

  return { ok: true, message: `Loaded ${merged.length} log(s) from cloud.` };
}

export async function syncAnonymizedData(medicalCondition: string): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  if (!medicalCondition?.trim()) return { ok: false, message: 'Set a medical condition first.' };

  const logs = await loadLogs();
  const payload = {
    condition: medicalCondition.trim(),
    log_count: logs.length,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from('anonymized_logs').upsert(payload);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Anonymized contribution updated.' };
}

export async function deleteCloudLogs(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.' };

  const { error } = await client.from('health_data').delete().eq('user_id', user.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Cloud health data deleted.' };
}

export async function deleteAllUserDataFromCloud(): Promise<{ ok: boolean; message: string }> {
  return deleteCloudLogs();
}

export { mergeHealthLogs };
