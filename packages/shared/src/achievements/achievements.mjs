/** Progressive logging unlock achievements — derived from trackingProfile (Plan 04 L1). */

import {
  daysSinceTrackingProfileStart,
  getUnlockDaysForCategory,
  isLogCategoryUnlocked,
} from '../logging/progressiveTracking.mjs';

export const ACHIEVEMENTS_STORAGE_KEY = 'rianellAchievements';

/** @typedef {{ notifiedAt?: string, seenAt?: string }} AchievementPersistedEntry */
/** @typedef {Record<string, AchievementPersistedEntry>} AchievementPersistedState */

export const LOGGING_ACHIEVEMENTS = [
  {
    id: 'food_logging',
    category: 'food',
    icon: 'food',
    i18nTitle: 'achievements.food.title',
    i18nDescription: 'achievements.food.description',
    i18nNotificationTitle: 'achievements.food.notificationTitle',
    i18nNotificationBody: 'achievements.food.notificationBody',
  },
  {
    id: 'exercise_logging',
    category: 'exercise',
    icon: 'run',
    i18nTitle: 'achievements.exercise.title',
    i18nDescription: 'achievements.exercise.description',
    i18nNotificationTitle: 'achievements.exercise.notificationTitle',
    i18nNotificationBody: 'achievements.exercise.notificationBody',
  },
  {
    id: 'medication_logging',
    category: 'medications',
    icon: 'pill',
    i18nTitle: 'achievements.medication.title',
    i18nDescription: 'achievements.medication.description',
    i18nNotificationTitle: 'achievements.medication.notificationTitle',
    i18nNotificationBody: 'achievements.medication.notificationBody',
  },
];

export function getRequiredDaysForAchievement(achievementId) {
  const def = LOGGING_ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!def) return 0;
  return getUnlockDaysForCategory(def.category);
}

function normalizePersistedEntry(value) {
  if (!value || typeof value !== 'object') return {};
  const out = {};
  if (typeof value.notifiedAt === 'string' && value.notifiedAt) out.notifiedAt = value.notifiedAt;
  if (typeof value.seenAt === 'string' && value.seenAt) out.seenAt = value.seenAt;
  return out;
}

export function normalizeAchievementState(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const achievements = {};
  for (const def of LOGGING_ACHIEVEMENTS) {
    achievements[def.id] = normalizePersistedEntry(raw[def.id] ?? raw.achievements?.[def.id]);
  }
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;
  return { achievements, updatedAt };
}

/**
 * @param {import('../settings/trackingProfile.mjs').TrackingProfile|null|undefined} profile
 * @param {AchievementPersistedState|{ achievements?: AchievementPersistedState, updatedAt?: string|null }} persisted
 * @param {Date} [now]
 */
export function computeAchievementSnapshots(profile, persisted = {}, now = new Date()) {
  const normalized = normalizeAchievementState(persisted);
  const days = daysSinceTrackingProfileStart(profile);
  const snapshots = LOGGING_ACHIEVEMENTS.map((def) => {
    const requiredDays = getUnlockDaysForCategory(def.category);
    const unlocked = isLogCategoryUnlocked(profile, def.category);
    const progress = requiredDays > 0 ? Math.min(1, days / requiredDays) : 1;
    const daysRemaining = unlocked ? 0 : Math.max(0, requiredDays - days);
    const entry = normalized.achievements[def.id] || {};
    return {
      id: def.id,
      category: def.category,
      icon: def.icon,
      i18nTitle: def.i18nTitle,
      i18nDescription: def.i18nDescription,
      i18nNotificationTitle: def.i18nNotificationTitle,
      i18nNotificationBody: def.i18nNotificationBody,
      requiredDays,
      daysElapsed: days,
      daysRemaining,
      progress,
      unlocked,
      notifiedAt: entry.notifiedAt ?? null,
      seenAt: entry.seenAt ?? null,
    };
  });
  return { snapshots, daysSinceStart: days, updatedAt: normalized.updatedAt };
}

function pickLatestIso(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export function mergeAchievementState(local, remote) {
  const loc = normalizeAchievementState(local);
  const rem = normalizeAchievementState(remote);
  const achievements = {};
  for (const def of LOGGING_ACHIEVEMENTS) {
    const l = loc.achievements[def.id] || {};
    const r = rem.achievements[def.id] || {};
    achievements[def.id] = {
      ...(l.notifiedAt || r.notifiedAt
        ? { notifiedAt: pickLatestIso(l.notifiedAt, r.notifiedAt) }
        : {}),
      ...(l.seenAt || r.seenAt ? { seenAt: pickLatestIso(l.seenAt, r.seenAt) } : {}),
    };
  }
  const localTs = loc.updatedAt ? Date.parse(loc.updatedAt) : 0;
  const remoteTs = rem.updatedAt ? Date.parse(rem.updatedAt) : 0;
  const updatedAt =
    remoteTs > localTs ? rem.updatedAt : loc.updatedAt || rem.updatedAt || new Date().toISOString();
  return { achievements, updatedAt };
}

export function detectNewlyUnlocked(prevSnapshots, nextSnapshots) {
  const prev = Array.isArray(prevSnapshots) ? prevSnapshots : [];
  const next = Array.isArray(nextSnapshots) ? nextSnapshots : [];
  const prevMap = new Map(prev.map((s) => [s.id, s]));
  return next.filter((s) => {
    if (!s.unlocked) return false;
    const was = prevMap.get(s.id);
    if (was?.unlocked) return false;
    if (s.notifiedAt) return false;
    return true;
  });
}

export function markAchievementNotified(state, achievementId, iso = new Date().toISOString()) {
  const normalized = normalizeAchievementState(state);
  const entry = { ...normalized.achievements[achievementId], notifiedAt: iso };
  return {
    achievements: { ...normalized.achievements, [achievementId]: entry },
    updatedAt: iso,
  };
}

export function markAchievementSeen(state, achievementId, iso = new Date().toISOString()) {
  const normalized = normalizeAchievementState(state);
  const entry = { ...normalized.achievements[achievementId], seenAt: iso };
  return {
    achievements: { ...normalized.achievements, [achievementId]: entry },
    updatedAt: iso,
  };
}
