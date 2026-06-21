/**
 * Sync achievement notification/seen state to Supabase user_achievements.
 */

async function achievementsSyncClient() {
  if (typeof initSupabase === 'function') return initSupabase();
  return null;
}

function achievementsCloudAllowed() {
  if (typeof cloudSyncState === 'undefined' || !cloudSyncState.isAuthenticated) return false;
  if (typeof window !== 'undefined' && window.appSettings && window.appSettings.localOnlyMode) return false;
  var S = typeof window !== 'undefined' ? window.RianellShared : null;
  if (S && typeof S.shouldAllowNetworkOperation === 'function' && window.appSettings) {
    if (!S.shouldAllowNetworkOperation(window.appSettings, 'cloudSync')) return false;
  }
  return true;
}

async function loadAchievementsFromCloud() {
  if (!achievementsCloudAllowed()) return null;
  var client = await achievementsSyncClient();
  if (!client || !cloudSyncState.user) return null;
  var userId = cloudSyncState.user.id;
  var { data, error } = await client.from('user_achievements').select('achievements, updated_at').eq('user_id', userId).maybeSingle();
  if (error) {
    console.warn('loadAchievementsFromCloud:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    achievements: data.achievements || {},
    updatedAt: data.updated_at || null,
  };
}

async function syncAchievementsToCloud(state) {
  if (!achievementsCloudAllowed()) return { ok: false, reason: 'not-allowed' };
  var client = await achievementsSyncClient();
  if (!client || !cloudSyncState.user) return { ok: false, reason: 'no-client' };
  var userId = cloudSyncState.user.id;
  var payload = {
    user_id: userId,
    achievements: state.achievements || {},
    updated_at: state.updatedAt || new Date().toISOString(),
  };
  var { error } = await client.from('user_achievements').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    console.warn('syncAchievementsToCloud:', error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

async function mergeAchievementsWithCloud(localState) {
  var S = typeof window !== 'undefined' ? window.RianellShared : null;
  if (!S || typeof S.mergeAchievementState !== 'function') return localState;
  var remote = await loadAchievementsFromCloud();
  if (!remote) return localState;
  return S.mergeAchievementState(localState, remote);
}

if (typeof window !== 'undefined') {
  window.loadAchievementsFromCloud = loadAchievementsFromCloud;
  window.syncAchievementsToCloud = syncAchievementsToCloud;
  window.mergeAchievementsWithCloud = mergeAchievementsWithCloud;
}
