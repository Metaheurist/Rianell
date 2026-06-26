import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  GOALS_STORAGE_KEY,
  mergeHealthLogs,
  mergeHealthLogsWithConflictPolicy,
  findLogSyncConflicts,
  appendProcessingActivity,
  normalizeGoals,
  SETTINGS_STORAGE_KEY,
  buildAnonymizedLogPayload,
  buildAnonymizedInsertRow,
  buildResearchFacetsFromLog,
  canExportContributionHistory,
  canViewPoolInsights,
  formatContributionExport,
  normalizePoolInsightsRpcResult,
  POOL_INSIGHT_MIN_K,
  isValidMedicalConditionForPool,
  hashMedicalConditionLabel,
} from '@rianell/shared';
import { decryptJsonAesGcm, encryptJsonAesGcm } from '@rianell/cloud-sync';
import Constants from 'expo-constants';
import { getSupabaseClient } from './supabaseClient';
import type { LogEntry } from '../storage/logs';
import { loadLogs, saveLogs } from '../storage/logs';
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences';
import { fetchPrivacyProfileAndApply } from './privacyProfile';

const ANON_ENCRYPTION_KEY_LS = 'rianellLocalEncryptionKeyHex';

function getSupabaseConfigFromExtra(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra ?? {};
  const url = typeof extra.supabaseUrl === 'string' ? extra.supabaseUrl.trim() : '';
  const anonKey = typeof extra.supabaseAnonKey === 'string' ? extra.supabaseAnonKey.trim() : '';
  return { url, anonKey };
}

async function deleteAccountViaEdgeFunction(
  client: SupabaseClient,
  supabaseUrl: string,
  anonKey: string,
): Promise<boolean> {
  const { data: sessionData } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not signed in');
  const base = supabaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/functions/v1/delete-user-data`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shouldSoftDelete: false }),
  });
  if (res.status === 404) return false;
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error || res.statusText || 'Edge delete failed');
  return true;
}

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

export type SyncConflictPolicy = 'local' | 'cloud';

export type SyncResult = {
  ok: boolean;
  message: string;
  needsConflictResolution?: boolean;
  conflictCount?: number;
};

async function logSyncActivity(prefs: Preferences, type: 'cloud_sync' | 'anon_sync', detail: string) {
  const next = {
    ...prefs,
    processingActivityLog: appendProcessingActivity(prefs.processingActivityLog, { type, detail }),
  };
  await savePreferences(next);
}

export async function syncToCloud(options?: { conflictPolicy?: SyncConflictPolicy }): Promise<SyncResult> {
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
  const { shouldAllowNetworkOperation } = await import('@rianell/shared');
  if (!shouldAllowNetworkOperation(prefs, 'cloudSync')) {
    return { ok: false, message: 'Cloud sync is disabled while local-only mode is on.' };
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

  const mergedLogs = (() => {
    const conflicts = findLogSyncConflicts(localLogs, cloudLogs);
    if (conflicts.length && !options?.conflictPolicy) {
      return null;
    }
    if (options?.conflictPolicy) {
      return mergeHealthLogsWithConflictPolicy(localLogs, cloudLogs, options.conflictPolicy) as LogEntry[];
    }
    return mergeHealthLogs(localLogs, cloudLogs) as LogEntry[];
  })();

  if (!mergedLogs) {
    const conflictCount = findLogSyncConflicts(localLogs, cloudLogs).length;
    return {
      ok: false,
      message: `${conflictCount} date(s) differ between device and cloud.`,
      needsConflictResolution: true,
      conflictCount,
    };
  }

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

  const latestDate = mergedLogs.length ? mergedLogs[mergedLogs.length - 1]?.date : '';
  void client.functions.invoke('deliver-webhook', {
    body: { event: 'log.created', log_date: latestDate, user_id: user.id, ts: Date.now() },
  }).catch(() => {});

  await saveLogs(mergedLogs);
  await logSyncActivity(prefs, 'cloud_sync', `${mergedLogs.length} logs`);
  return { ok: true, message: `Synced ${mergedLogs.length} log(s).` };
}

export async function loadFromCloud(): Promise<SyncResult> {
  const prefs = await loadPreferences();
  const { shouldAllowNetworkOperation } = await import('@rianell/shared');
  if (!shouldAllowNetworkOperation(prefs, 'cloudSync')) {
    return { ok: false, message: 'Cloud load is disabled while local-only mode is on.' };
  }
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
  const { getFeatureAvailability, prefsToConsents, shouldAllowNetworkOperation } = await import('@rianell/shared');
  const avail = getFeatureAvailability(
    prefs.privacyRegion || 'other',
    'anonymizedResearchPool',
    prefsToConsents(prefs),
  );
  if (!avail.available) {
    return { ok: false, message: 'Anonymized contribution is not available for your privacy region.' };
  }
  if (!shouldAllowNetworkOperation(prefs, 'anonymizedSync')) {
    return { ok: false, message: 'Anonymized sync is disabled while local-only mode is on.' };
  }
  if (!prefs.contributeAnonData) {
    return { ok: false, message: 'Enable anonymised research pool contribution in Settings first.' };
  }
  if (prefs.demoMode) {
    return { ok: false, message: 'Anonymised contribution is disabled in demo mode.' };
  }

  const condition = medicalCondition?.trim() || prefs.medicalCondition?.trim() || '';
  if (!isValidMedicalConditionForPool(condition)) {
    return { ok: false, message: 'Set a medical condition first.' };
  }
  const conditionStorageKey = await hashMedicalConditionLabel(condition);

  const logs = await loadLogs();
  if (!logs.length) return { ok: false, message: 'No logs to contribute.' };

  const { data: existingRows } = await client
    .from('anonymized_data')
    .select('research_facets')
    .eq('user_id', user.id)
    .eq('medical_condition', conditionStorageKey);
  const syncedDates = new Set(
    (existingRows || [])
      .map((row) => (row.research_facets as { date?: string } | null)?.date)
      .filter((d): d is string => typeof d === 'string' && d.length > 0),
  );

  const logsToSync = logs.filter((log) => log.date && !syncedDates.has(log.date));
  if (!logsToSync.length) {
    return { ok: true, message: 'All logs already contributed for this condition.' };
  }

  const anonKey = await getAnonymizedEncryptionKeyHex();
  const batch: ReturnType<typeof buildAnonymizedInsertRow>[] = [];

  for (const log of logsToSync) {
    if (!buildResearchFacetsFromLog(log)) continue;
    try {
      const payload = buildAnonymizedLogPayload(log);
      const encrypted = await encryptJsonAesGcm(payload, anonKey);
      batch.push(
        buildAnonymizedInsertRow(log, {
          userId: user.id,
          medicalConditionHash: conditionStorageKey,
          encryptedLog: encrypted,
        }),
      );
    } catch {
      return { ok: false, message: 'Encryption failed - anonymized upload blocked.' };
    }
  }

  if (!batch.length) return { ok: false, message: 'No eligible logs to contribute.' };

  const { error } = await client.from('anonymized_data').insert(batch);
  if (error) return { ok: false, message: error.message };
  await logSyncActivity(prefs, 'anon_sync', `${batch.length} logs`);
  return { ok: true, message: `Anonymized contribution updated (${batch.length} log(s)).` };
}

export async function fetchOwnContributionRows(): Promise<{
  ok: boolean;
  message: string;
  rows: Array<Record<string, unknown>>;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.', rows: [] };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.', rows: [] };

  const { data, error } = await client
    .from('anonymized_data')
    .select('id, created_at, medical_condition, anonymized_log, research_facets')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) return { ok: false, message: error.message, rows: [] };
  return { ok: true, message: '', rows: (data || []) as Array<Record<string, unknown>> };
}

export async function exportContributionHistory(): Promise<{ ok: boolean; message: string; json?: string }> {
  const prefs = await loadPreferences();
  const client = getSupabaseClient();
  const signedIn = !!(client && (await client.auth.getSession()).data.session?.user);
  const gate = canExportContributionHistory(prefs, { signedIn });
  if (!gate.allowed) {
    const msg =
      gate.reason === 'signIn'
        ? 'Please sign in.'
        : gate.reason === 'optIn'
          ? 'Enable anonymised research pool contribution first.'
          : 'Set a medical condition first.';
    return { ok: false, message: msg };
  }

  const fetched = await fetchOwnContributionRows();
  if (!fetched.ok) return { ok: false, message: fetched.message };

  const anonKey = await getAnonymizedEncryptionKeyHex();
  const decryptedRows = [];
  for (const row of fetched.rows) {
    let decrypted: unknown = null;
    const blob = row.anonymized_log;
    if (typeof blob === 'string' && blob.length > 0) {
      try {
        decrypted = await decryptJsonAesGcm(blob, anonKey);
      } catch {
        decrypted = null;
      }
    }
    decryptedRows.push({ ...row, decrypted });
  }

  const bundle = formatContributionExport(decryptedRows, { medicalCondition: prefs.medicalCondition });
  return { ok: true, message: `Exported ${bundle.rowCount} contribution row(s).`, json: JSON.stringify(bundle, null, 2) };
}

export async function countPoolContributionDays(condition: string): Promise<number> {
  const client = getSupabaseClient();
  if (!client || !isValidMedicalConditionForPool(condition)) return 0;
  const storageKey = await hashMedicalConditionLabel(condition.trim());
  const { data, error } = await client.rpc('count_pool_contribution_days', { p_condition: storageKey });
  if (error) return 0;
  return Number(data) || 0;
}

export async function fetchPoolInsights(condition: string): Promise<{
  ok: boolean;
  message: string;
  insights: ReturnType<typeof normalizePoolInsightsRpcResult>;
}> {
  const empty = normalizePoolInsightsRpcResult(null);
  const prefs = await loadPreferences();
  const client = getSupabaseClient();
  const signedIn = !!(client && (await client.auth.getSession()).data.session?.user);
  const poolDayCount = await countPoolContributionDays(condition);
  const gate = canViewPoolInsights(prefs, { signedIn, poolDayCount });
  if (!gate.allowed) {
    const msg =
      gate.reason === 'signIn'
        ? 'Please sign in.'
        : gate.reason === 'optIn'
          ? 'Enable anonymised research pool contribution first.'
          : gate.reason === 'condition'
            ? 'Set a medical condition first.'
            : `Pool insights unlock after ${gate.minDays ?? 90} days of contributions (currently ${poolDayCount}).`;
    return { ok: false, message: msg, insights: empty };
  }

  if (!client) return { ok: false, message: 'Cloud sync is not configured.', insights: empty };

  const storageKey = await hashMedicalConditionLabel(condition.trim());
  const { data, error } = await client.rpc('get_k_anon_pool_insights', {
    p_condition: storageKey,
    p_k: POOL_INSIGHT_MIN_K,
  });
  if (error) return { ok: false, message: error.message, insights: empty };
  return { ok: true, message: '', insights: normalizePoolInsightsRpcResult(data) };
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

/** GDPR Art. 17 full cloud erasure: app tables + auth user (Edge Function when deployed). */
export async function deleteAllUserDataFromCloud(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, message: 'Please sign in.' };

  const { url, anonKey } = getSupabaseConfigFromExtra();
  if (url && anonKey) {
    try {
      const usedEdge = await deleteAccountViaEdgeFunction(client, url, anonKey);
      if (usedEdge) {
        await client.auth.signOut();
        return { ok: true, message: 'Account and all cloud data deleted.' };
      }
    } catch {
      /* fall back to per-table RLS deletes */
    }
  }

  const err = await deleteUserRows(client, user.id, [
    'health_data',
    'user_keys',
    'anonymized_data',
    'bug_reports',
    'user_privacy_profile',
    'user_achievements',
    'consent_audit_log',
  ]);
  if (err) return { ok: false, message: err };
  return { ok: true, message: 'All cloud data deleted for this account.' };
}

export { fetchPrivacyProfileAndApply, upsertPrivacyProfile } from './privacyProfile';
