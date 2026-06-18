export const SETTINGS_PROFILE_EXPORT_VERSION = 1;

/** Portable settings + goals blob (Plan 03 S8) — never includes health logs. */
export function buildSettingsProfileExport(prefs, goals) {
  return {
    kind: 'rianell-settings-profile',
    version: SETTINGS_PROFILE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: prefs && typeof prefs === 'object' ? { ...prefs } : {},
    goals: goals && typeof goals === 'object' ? { ...goals } : {},
  };
}

export function parseSettingsProfileImport(raw) {
  let parsed = raw;
  if (typeof raw === 'string') {
    parsed = JSON.parse(raw);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('invalid_profile');
  }
  if (parsed.kind !== 'rianell-settings-profile') {
    throw new Error('wrong_kind');
  }
  const version = typeof parsed.version === 'number' ? parsed.version : 0;
  if (version > SETTINGS_PROFILE_EXPORT_VERSION) {
    throw new Error('unsupported_version');
  }
  const settings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {};
  const goals = parsed.goals && typeof parsed.goals === 'object' ? parsed.goals : {};
  return { settings, goals, exportedAt: parsed.exportedAt || null };
}
