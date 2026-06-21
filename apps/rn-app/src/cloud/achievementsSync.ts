import { getSupabaseClient } from './supabaseClient';
import { mergeAchievementState, normalizeAchievementState } from '@rianell/shared';

export type AchievementCloudState = {
  achievements: Record<string, { notifiedAt?: string; seenAt?: string }>;
  updatedAt: string | null;
};

export async function loadAchievementsFromCloud(userId: string): Promise<AchievementCloudState | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from('user_achievements')
    .select('achievements, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    achievements: (data.achievements as Record<string, { notifiedAt?: string; seenAt?: string }>) || {},
    updatedAt: data.updated_at ?? null,
  };
}

export async function syncAchievementsToCloud(
  userId: string,
  state: { achievements: Record<string, { notifiedAt?: string; seenAt?: string }>; updatedAt?: string | null },
): Promise<{ ok: boolean; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
  const normalized = normalizeAchievementState(state);
  const { error } = await client.from('user_achievements').upsert(
    {
      user_id: userId,
      achievements: normalized.achievements,
      updated_at: normalized.updatedAt || new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export function mergeLocalAndCloudAchievements(
  local: { achievements: Record<string, { notifiedAt?: string; seenAt?: string }>; updatedAt?: string | null },
  remote: AchievementCloudState | null,
) {
  if (!remote) return normalizeAchievementState(local);
  return mergeAchievementState(local, remote);
}
