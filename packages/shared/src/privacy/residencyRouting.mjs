import { resolvePolicyPack } from './resolvePolicyPack.mjs';
import { resolveDataResidency, getResidencyRegistry } from './residency-registry.mjs';

/** Whether privacy region requires a different Supabase project than the active client. */
export function needsDataResidencyMigration(privacyRegion, activeResidencyCode, pack, registry) {
  const resolved = resolvePolicyPack(privacyRegion, pack);
  const required = resolved.requiredDataResidency || 'default';
  if (required === 'default') return false;
  const active = activeResidencyCode || 'default';
  if (required === active) return false;
  const reg = registry || getResidencyRegistry();
  const target = resolveDataResidency(privacyRegion, null, pack, reg);
  return !!(target?.supabaseUrl && target.code !== active);
}

/** Pick Supabase residency bucket for auth (sign-up / sign-in). */
export function resolveAuthResidencyCode(privacyRegion, pack, registry, userPreference) {
  const reg = registry || getResidencyRegistry();
  const bucket = resolveDataResidency(privacyRegion, userPreference || null, pack, reg);
  return bucket?.code || 'default';
}

export const MIGRATION_COPY = {
  title: 'Move your cloud data',
  lead:
    'Your privacy region requires encrypted backups in a different data region. Export from this project, sign in on the target region, then import.',
  stepExport: 'Export encrypted backup from current project',
  stepTarget: 'Sign in or register on the target Supabase project',
  stepImport: 'Import backup on the target project',
  stepDelete: 'Delete data on the source project when import is verified',
  blockedSync: 'Cloud sync is paused until data residency migration completes.',
};
