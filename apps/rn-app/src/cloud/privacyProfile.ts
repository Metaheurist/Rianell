import {
  applyPrivacyProfileToLocal,
  privacyProfileFromLocal,
} from '@rianell/shared';
import { getSupabaseClient } from './supabaseClient';
import type { Preferences } from '../storage/preferences';

export async function fetchPrivacyProfileAndApply(
  prefs: Preferences,
): Promise<{ prefs: Preferences; restored: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { prefs, restored: false };
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { prefs, restored: false };

  const { data, error } = await client
    .from('user_privacy_profile')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return { prefs, restored: false };

  const hadRegion = prefs.privacyRegion;
  const merged = applyPrivacyProfileToLocal(prefs, data) as Preferences;
  return { prefs: merged, restored: !!(hadRegion && hadRegion !== merged.privacyRegion) };
}

export async function upsertPrivacyProfile(prefs: Preferences): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;
  const row = privacyProfileFromLocal(prefs, user.id);
  await client.from('user_privacy_profile').upsert(row, { onConflict: 'user_id' });
}
