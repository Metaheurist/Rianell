import {
  buildAchievementUnlockNotificationContent,
  computeAchievementSnapshots,
  detectNewlyUnlocked,
  markAchievementNotified,
  mergeAchievementState,
  normalizeAchievementState,
  shouldFireAchievementUnlockNotification,
} from '@rianell/shared';
import * as Notifications from 'expo-notifications';
import { getSupabaseClient } from '../cloud/supabaseClient';
import {
  loadAchievementsFromCloud,
  mergeLocalAndCloudAchievements,
  syncAchievementsToCloud,
} from '../cloud/achievementsSync';
import type { Preferences } from '../storage/preferences';

let prevSnapshots: ReturnType<typeof computeAchievementSnapshots>['snapshots'] | null = null;

async function presentUnlockNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { url: '/?quick=true' } },
      trigger: null,
    });
  } catch {
    /* optional */
  }
}

export async function tickAchievements(
  prefs: Preferences,
  t: (key: string) => string,
): Promise<Preferences> {
  const normalized = normalizeAchievementState(prefs.achievements);
  const { snapshots } = computeAchievementSnapshots(prefs.trackingProfile, normalized);
  let nextState = normalized;

  let changed = false;
  if (prevSnapshots) {
    const newly = detectNewlyUnlocked(prevSnapshots, snapshots);
    for (const snap of newly) {
      const gate = shouldFireAchievementUnlockNotification(snap, {
        notificationsEnabled: prefs.notifications.enabled,
      });
      if (!gate.fire) continue;
      const content = buildAchievementUnlockNotificationContent(snap.id, t);
      await presentUnlockNotification(content.title, content.body);
      nextState = markAchievementNotified(nextState, snap.id);
      changed = true;
    }
  }
  prevSnapshots = snapshots.map((s) => ({ ...s }));

  if (changed) {
    return { ...prefs, achievements: nextState };
  }
  return prefs;
}

export async function mergeAchievementsOnSignIn(prefs: Preferences): Promise<Preferences> {
  const client = getSupabaseClient();
  if (!client || prefs.localOnlyMode) return prefs;
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user) return prefs;
  const remote = await loadAchievementsFromCloud(user.id);
  const merged = mergeLocalAndCloudAchievements(prefs.achievements, remote);
  return { ...prefs, achievements: merged };
}

export async function syncAchievementsIfSignedIn(prefs: Preferences): Promise<void> {
  if (prefs.localOnlyMode) return;
  const client = getSupabaseClient();
  if (!client) return;
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user) return;
  await syncAchievementsToCloud(user.id, prefs.achievements);
}

export async function initAchievementsOnBoot(
  prefs: Preferences,
  t: (key: string) => string,
): Promise<Preferences> {
  let next = await mergeAchievementsOnSignIn(prefs);
  next = await tickAchievements(next, t);
  await syncAchievementsIfSignedIn(next);
  return next;
}

export function resetAchievementTickMemory() {
  prevSnapshots = null;
}

export { mergeAchievementState, normalizeAchievementState };
