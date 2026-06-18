/** Tracking profile shape for Plan 03 S2 / Plan 04 L1 progressive disclosure. */
export const TRACKING_PROFILE_FIELD_KEYS = ['mood', 'pain', 'notes', 'sleep', 'fatigue'];

export function getDefaultTrackingProfileFields() {
  return {
    mood: true,
    pain: true,
    notes: true,
    sleep: false,
    fatigue: false,
  };
}

export function normalizeTrackingProfile(value) {
  const d = {
    condition: '',
    fields: getDefaultTrackingProfileFields(),
    configuredAt: null,
  };
  const v = value && typeof value === 'object' ? value : {};
  const fieldsIn = v.fields && typeof v.fields === 'object' ? v.fields : {};
  const fields = { ...d.fields };
  for (const key of TRACKING_PROFILE_FIELD_KEYS) {
    if (typeof fieldsIn[key] === 'boolean') fields[key] = fieldsIn[key];
  }
  return {
    condition: typeof v.condition === 'string' ? v.condition.slice(0, 200) : d.condition,
    fields,
    configuredAt: typeof v.configuredAt === 'string' ? v.configuredAt : d.configuredAt,
  };
}

export function isTrackingProfileConfigured(profile) {
  const p = normalizeTrackingProfile(profile);
  return !!p.configuredAt;
}
