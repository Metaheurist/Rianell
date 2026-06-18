import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  GOALS_STORAGE_KEY,
  mergeHealthLogs,
  normalizeGoals,
  SETTINGS_STORAGE_KEY,
} from '@rianell/shared';
import { decryptJsonAesGcm, encryptJsonAesGcm } from '@rianell/cloud-sync';
import { getSupabaseClient } from './supabaseClient';
import type { LogEntry } from '../storage/logs';
import { loadLogs, saveLogs } from '../storage/logs';
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences';
import { fetchPrivacyProfileAndApply } from './privacyProfile';

const ANON_ENCRYPTION_KEY_LS = 'rianellLocalEncryptionKeyHex';

function generateUserEncryptionKey(): string {
  const arr = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getAnonymizedEncryptionKeyHex(): Promise<string> {
  const stored = await AsyncStorage.getItem(ANON_ENCRYPTION_KEY_LS);
  if (stored && /^[0-9a-fA-F]{64}$/.test(stored)) return stored;
  const hex = generateUserEncryptionKey();
  await AsyncStorage.setItem(ANON_ENCRYPTION_KEY_LS, hex);
  return hex;
}

function buildAnonymizedLogPayload(log: LogEntry): Record<string, unknown> {
  const anonymized: Record<string, unknown> = {
    date: log.date,
    bpm: log.bpm,
    weight: log.weight,
    backPain: log.backPain,
    jointPain: log.jointPain,
    stiffness: log.stiffness,
    swelling: log.swelling,
    sleep: log.sleep,
    mood: log.mood,
    irritability: log.irritability,
    mobility: log.mobility,
    dailyFunction: log.dailyFunction,
    fatigue: log.fatigue,
    flare: log.flare,
    hydration: log.hydration,
    energyClarity: log.energyClarity,
  };
  Object.keys(anonymized).forEach((key) => {
    const v = anonymized[key];
    if (v === undefined || v === null || v === '') delete anonymized[key];
  });
  return anonymized;
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

async function deleteUserRows(client: SupabaseClient, userId: string, tables: string[]): Promise<string | null> {
  for (const table of tables) {
    const { error } = await client.from(table).delete().eq('user_id', userId);
    if (error) return error.message;
  }
  return null;
}

export async function syncToCloud(): Promise<{ ok: boolean; message: string }> {
  const prefs = await loadPreferences();
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in to sync.' };

  const { getFeatureAvailability, prefsToConsents } = await import('@rianell/shared');
  const avail = getFeatureAvailability(prefs.privacyRegion || 'other', 'cloudEncryptedBackup', prefsToConsents(prefs));
  if (!avail.available) {
    return { ok: false, message: 'Cloud backup is not available for your privacy region or missing consent.' };
  }

  const userKey = await getUserEncryptionKey(client, user);
  if (!userKey) return { ok: false, message: 'Could not obtain encryption key.' };

  const localLogs = await loadLogs();
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

  const { prefs: profileMerged } = await fetchPrivacyProfileAndApply(await loadPreferences());
  await savePreferences(profileMerged);

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
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.' };

  const prefs = await loadPreferences();
  const { getFeatureAvailability, prefsToConsents } = await import('@rianell/shared');
  const avail = getFeatureAvailability(
    prefs.privacyRegion || 'other',
    'anonymizedResearchPool',
    prefsToConsents(prefs),
  );
  if (!avail.available) {
    return { ok: false, message: 'Anonymized contribution is not available for your privacy region.' };
  }

  if (!medicalCondition?.trim()) return { ok: false, message: 'Set a medical condition first.' };

  const condition = medicalCondition.trim();
  const logs = await loadLogs();
  if (!logs.length) return { ok: false, message: 'No logs to contribute.' };

  const anonKey = await getAnonymizedEncryptionKeyHex();
  const batch: { user_id: string; medical_condition: string; anonymized_log: string }[] = [];

  for (const log of logs) {
    try {
      const payload = buildAnonymizedLogPayload(log);
      const encrypted = await encryptJsonAesGcm(payload, anonKey);
      batch.push({
        user_id: user.id,
        medical_condition: condition,
        anonymized_log: encrypted,
      });
    } catch {
      return { ok: false, message: 'Encryption failed - anonymized upload blocked.' };
    }
  }

  const { error } = await client.from('anonymized_data').insert(batch);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Anonymized contribution updated (${batch.length} log(s)).` };
}

/** Deletes encrypted cloud backup only (health_data). */
export async function deleteCloudLogs(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.' };

  const err = await deleteUserRows(client, user.id, ['health_data']);
  if (err) return { ok: false, message: err };
  return { ok: true, message: 'Cloud health backup deleted.' };
}

/** Removes user's anonymized contribution rows only. */
export async function deleteAnonymizedContributionFromCloud(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.' };

  const err = await deleteUserRows(client, user.id, ['anonymized_data']);
  if (err) return { ok: false, message: err };
  return { ok: true, message: 'Anonymized contribution removed from cloud.' };
}

/** GDPR Art. 17 full cloud erasure: health_data, user_keys, anonymized_data, bug_reports. */
export async function deleteAllUserDataFromCloud(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.' };

  const err = await deleteUserRows(client, user.id, [
    'health_data',
    'user_keys',
    'anonymized_data',
    'bug_reports',
    'user_privacy_profile',
  ]);
  if (err) return { ok: false, message: err };
  return { ok: true, message: 'All cloud data deleted for this account.' };
}

export { fetchPrivacyProfileAndApply, upsertPrivacyProfile } from './privacyProfile';
