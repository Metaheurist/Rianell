/** Plan 04 L1 — progressive category unlock paired with S2 tracking profile. */

import { normalizeTrackingProfile } from '../settings/trackingProfile.mjs';

export const PROGRESSIVE_CATEGORIES = ['core', 'sleep', 'food', 'exercise', 'medications', 'cycle'];

const UNLOCK_DAYS = {
  core: 0,
  sleep: 3,
  food: 7,
  exercise: 14,
  medications: 21,
  cycle: 28,
};

export function daysSinceTrackingProfileStart(profile) {
  const p = normalizeTrackingProfile(profile);
  if (!p.configuredAt) return 0;
  const start = Date.parse(p.configuredAt);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 86400000));
}

export function getUnlockedLogCategories(profile) {
  const days = daysSinceTrackingProfileStart(profile);
  return PROGRESSIVE_CATEGORIES.filter((cat) => days >= (UNLOCK_DAYS[cat] ?? 0));
}

export function isLogCategoryUnlocked(profile, category) {
  return getUnlockedLogCategories(profile).includes(category);
}

export function getVisibleTrackingFields(profile) {
  const p = normalizeTrackingProfile(profile);
  const unlocked = new Set(getUnlockedLogCategories(profile));
  const fields = { ...p.fields };
  if (!unlocked.has('sleep')) {
    fields.sleep = false;
    fields.fatigue = false;
  }
  return fields;
}

export function shouldShowWizardCategory(profile, category) {
  if (!isLogCategoryUnlocked(profile, category)) return false;
  if (category === 'core') return true;
  if (category === 'sleep') {
    const f = getVisibleTrackingFields(profile);
    return f.sleep || f.fatigue;
  }
  return true;
}
