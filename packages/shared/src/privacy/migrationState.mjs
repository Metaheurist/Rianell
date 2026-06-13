/** Migration helpers — single Supabase project; always unblocked. */
export function applyMigrationPendingFlag(prefs) {
  return { ...prefs, migrationPending: false };
}

export function isCloudSyncBlockedByMigration() {
  return false;
}

export function clearMigrationPending(prefs, _code, _url) {
  return { ...prefs, migrationPending: false };
}
