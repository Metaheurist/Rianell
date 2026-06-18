/** Plan 05 P6 — caregiver proxy logging for a dependent (local metadata only). */

export const CAREGIVER_RELATIONSHIPS = ['parent', 'guardian', 'other'];

export function normalizeCaregiverSettings(prefs) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const relationship = CAREGIVER_RELATIONSHIPS.includes(p.caregiverRelationship)
    ? p.caregiverRelationship
    : 'parent';
  const enabled = p.caregiverModeEnabled === true;
  return {
    caregiverModeEnabled: enabled,
    caregiverDependentName: enabled && typeof p.caregiverDependentName === 'string' ? p.caregiverDependentName.trim() : '',
    caregiverRelationship: relationship,
  };
}

/** Metadata merged onto log entries when caregiver mode is active. */
export function buildProxyLogMetadata(prefs) {
  const c = normalizeCaregiverSettings(prefs);
  if (!c.caregiverModeEnabled) return {};
  return {
    proxyLoggedBy: 'caregiver',
    proxyRelationship: c.caregiverRelationship,
    dependentLabel: c.caregiverDependentName || 'dependent',
  };
}

export function stampLogEntryForCaregiver(entry, prefs) {
  const meta = buildProxyLogMetadata(prefs);
  if (!meta.proxyLoggedBy) return entry;
  return { ...entry, ...meta };
}
