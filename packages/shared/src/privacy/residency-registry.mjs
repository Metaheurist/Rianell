import { resolvePolicyPack } from './resolvePolicyPack.mjs';

/** Residency endpoints for multi-project mode (Phase 5). */
export function getResidencyRegistry(config = {}) {
  const eu = config.eu || {};
  const us = config.us || {};
  return {
    eu: {
      code: 'eu',
      label: eu.label || 'EU',
      regionLabel: eu.regionLabel || 'Frankfurt',
      supabaseUrl: eu.supabaseUrl || '',
      anonKey: eu.anonKey || '',
    },
    us: {
      code: 'us',
      label: us.label || 'US',
      regionLabel: us.regionLabel || 'East',
      supabaseUrl: us.supabaseUrl || '',
      anonKey: us.anonKey || '',
    },
    default: {
      code: 'default',
      label: config.default?.label || 'Default',
      regionLabel: config.default?.regionLabel || '',
      supabaseUrl: config.default?.supabaseUrl || config.supabaseUrl || '',
      anonKey: config.default?.anonKey || config.anonKey || '',
    },
  };
}

export function resolveDataResidency(privacyRegion, userPreference, pack, registry) {
  const resolved = resolvePolicyPack(privacyRegion, pack);
  const required = resolved.requiredDataResidency || 'default';
  const reg = registry || getResidencyRegistry();
  if (required === 'eu' && reg.eu?.supabaseUrl) return reg.eu;
  if (required === 'us' && reg.us?.supabaseUrl) return reg.us;
  if (userPreference === 'eu' && reg.eu?.supabaseUrl) return reg.eu;
  if (userPreference === 'us' && reg.us?.supabaseUrl) return reg.us;
  return reg.default;
}

export function getResidencyChooserOptions() {
  return [];
}

export function canChooseDataResidency() {
  return false;
}
