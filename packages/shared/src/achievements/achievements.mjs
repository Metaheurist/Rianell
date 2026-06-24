/** Progressive logging unlock achievements — derived from trackingProfile (Plan 04 L1). */

import {
  daysSinceTrackingProfileStart,
  getUnlockDaysForCategory,
  isLogCategoryUnlocked,
  PROGRESSIVE_CATEGORIES,
  UNLOCK_DAYS,
} from '../logging/progressiveTracking.mjs';

export const ACHIEVEMENTS_STORAGE_KEY = 'rianellAchievements';

/** @typedef {'bronze'|'silver'|'gold'|'platinum'} AchievementTier */
/** @typedef {'logging'|'milestone'|'engagement'|'full_logger'} AchievementKind */

/** @typedef {{ notifiedAt?: string, seenAt?: string }} AchievementPersistedEntry */
/** @typedef {Record<string, AchievementPersistedEntry>} AchievementPersistedState */

/** @typedef {{
 *   id: string,
 *   category: string,
 *   icon: string,
 *   tier: AchievementTier,
 *   kind: AchievementKind,
 *   requiredDays?: number,
 *   unlockCategory?: string,
 *   i18nTitle: string,
 *   i18nDescription: string,
 *   i18nNotificationTitle: string,
 *   i18nNotificationBody: string,
 * }} AchievementDefinition */

export const LOGGING_ACHIEVEMENTS = [
  {
    id: 'food_logging',
    category: 'food',
    icon: 'food',
    tier: 'bronze',
    kind: 'logging',
    i18nTitle: 'achievements.food.title',
    i18nDescription: 'achievements.food.description',
    i18nNotificationTitle: 'achievements.food.notificationTitle',
    i18nNotificationBody: 'achievements.food.notificationBody',
  },
  {
    id: 'exercise_logging',
    category: 'exercise',
    icon: 'run',
    tier: 'silver',
    kind: 'logging',
    i18nTitle: 'achievements.exercise.title',
    i18nDescription: 'achievements.exercise.description',
    i18nNotificationTitle: 'achievements.exercise.notificationTitle',
    i18nNotificationBody: 'achievements.exercise.notificationBody',
  },
  {
    id: 'medication_logging',
    category: 'medications',
    icon: 'pill',
    tier: 'gold',
    kind: 'logging',
    i18nTitle: 'achievements.medication.title',
    i18nDescription: 'achievements.medication.description',
    i18nNotificationTitle: 'achievements.medication.notificationTitle',
    i18nNotificationBody: 'achievements.medication.notificationBody',
  },
];

export const MILESTONE_ACHIEVEMENTS = [
  {
    id: 'milestone_3',
    category: 'milestone',
    icon: 'calendar',
    tier: 'bronze',
    kind: 'milestone',
    requiredDays: 3,
    i18nTitle: 'achievements.milestone3.title',
    i18nDescription: 'achievements.milestone3.description',
    i18nNotificationTitle: 'achievements.milestone3.notificationTitle',
    i18nNotificationBody: 'achievements.milestone3.notificationBody',
  },
  {
    id: 'milestone_30',
    category: 'milestone',
    icon: 'calendar',
    tier: 'silver',
    kind: 'milestone',
    requiredDays: 30,
    i18nTitle: 'achievements.milestone30.title',
    i18nDescription: 'achievements.milestone30.description',
    i18nNotificationTitle: 'achievements.milestone30.notificationTitle',
    i18nNotificationBody: 'achievements.milestone30.notificationBody',
  },
  {
    id: 'milestone_60',
    category: 'milestone',
    icon: 'calendar',
    tier: 'silver',
    kind: 'milestone',
    requiredDays: 60,
    i18nTitle: 'achievements.milestone60.title',
    i18nDescription: 'achievements.milestone60.description',
    i18nNotificationTitle: 'achievements.milestone60.notificationTitle',
    i18nNotificationBody: 'achievements.milestone60.notificationBody',
  },
  {
    id: 'milestone_90',
    category: 'milestone',
    icon: 'calendar',
    tier: 'gold',
    kind: 'milestone',
    requiredDays: 90,
    i18nTitle: 'achievements.milestone90.title',
    i18nDescription: 'achievements.milestone90.description',
    i18nNotificationTitle: 'achievements.milestone90.notificationTitle',
    i18nNotificationBody: 'achievements.milestone90.notificationBody',
  },
  {
    id: 'milestone_180',
    category: 'milestone',
    icon: 'calendar',
    tier: 'platinum',
    kind: 'milestone',
    requiredDays: 180,
    i18nTitle: 'achievements.milestone180.title',
    i18nDescription: 'achievements.milestone180.description',
    i18nNotificationTitle: 'achievements.milestone180.notificationTitle',
    i18nNotificationBody: 'achievements.milestone180.notificationBody',
  },
];

export const ENGAGEMENT_ACHIEVEMENTS = [
  {
    id: 'sleep_pioneer',
    category: 'engagement',
    unlockCategory: 'sleep',
    icon: 'sleep',
    tier: 'bronze',
    kind: 'engagement',
    i18nTitle: 'achievements.sleepPioneer.title',
    i18nDescription: 'achievements.sleepPioneer.description',
    i18nNotificationTitle: 'achievements.sleepPioneer.notificationTitle',
    i18nNotificationBody: 'achievements.sleepPioneer.notificationBody',
  },
  {
    id: 'cycle_tracker',
    category: 'engagement',
    unlockCategory: 'cycle',
    icon: 'cycle',
    tier: 'gold',
    kind: 'engagement',
    i18nTitle: 'achievements.cycleTracker.title',
    i18nDescription: 'achievements.cycleTracker.description',
    i18nNotificationTitle: 'achievements.cycleTracker.notificationTitle',
    i18nNotificationBody: 'achievements.cycleTracker.notificationBody',
  },
  {
    id: 'full_logger',
    category: 'engagement',
    icon: 'star',
    tier: 'platinum',
    kind: 'full_logger',
    i18nTitle: 'achievements.fullLogger.title',
    i18nDescription: 'achievements.fullLogger.description',
    i18nNotificationTitle: 'achievements.fullLogger.notificationTitle',
    i18nNotificationBody: 'achievements.fullLogger.notificationBody',
  },
];

/** @type {AchievementDefinition[]} */
export const ALL_ACHIEVEMENTS = [
  ...LOGGING_ACHIEVEMENTS,
  ...MILESTONE_ACHIEVEMENTS,
  ...ENGAGEMENT_ACHIEVEMENTS,
];

const ACHIEVEMENT_ID_SET = new Set(ALL_ACHIEVEMENTS.map((a) => a.id));

export function isKnownAchievementId(achievementId) {
  return ACHIEVEMENT_ID_SET.has(achievementId);
}

function getRequiredDaysForDef(def) {
  if (typeof def.requiredDays === 'number') return def.requiredDays;
  if (def.kind === 'full_logger') {
    return Math.max(...PROGRESSIVE_CATEGORIES.map((cat) => UNLOCK_DAYS[cat] ?? 0));
  }
  if (def.kind === 'engagement' && def.unlockCategory) {
    return getUnlockDaysForCategory(def.unlockCategory);
  }
  if (def.kind === 'logging') {
    return getUnlockDaysForCategory(def.category);
  }
  return 0;
}

function isAchievementUnlocked(def, profile, days) {
  if (def.kind === 'milestone') {
    return days >= getRequiredDaysForDef(def);
  }
  if (def.kind === 'full_logger') {
    return PROGRESSIVE_CATEGORIES.every((cat) => days >= (UNLOCK_DAYS[cat] ?? 0));
  }
  if (def.kind === 'engagement' && def.unlockCategory) {
    return isLogCategoryUnlocked(profile, def.unlockCategory);
  }
  if (def.kind === 'logging') {
    return isLogCategoryUnlocked(profile, def.category);
  }
  return false;
}

export function getRequiredDaysForAchievement(achievementId) {
  const def = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!def) return 0;
  return getRequiredDaysForDef(def);
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
  for (const def of ALL_ACHIEVEMENTS) {
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
  const snapshots = ALL_ACHIEVEMENTS.map((def) => {
    const requiredDays = getRequiredDaysForDef(def);
    const unlocked = isAchievementUnlocked(def, profile, days);
    const progress = requiredDays > 0 ? Math.min(1, days / requiredDays) : unlocked ? 1 : 0;
    const daysRemaining = unlocked ? 0 : Math.max(0, requiredDays - days);
    const entry = normalized.achievements[def.id] || {};
    return {
      id: def.id,
      category: def.category,
      icon: def.icon,
      tier: def.tier,
      kind: def.kind,
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
  for (const def of ALL_ACHIEVEMENTS) {
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
  if (!isKnownAchievementId(achievementId)) return normalizeAchievementState(state);
  const normalized = normalizeAchievementState(state);
  const entry = { ...normalized.achievements[achievementId], notifiedAt: iso };
  return {
    achievements: { ...normalized.achievements, [achievementId]: entry },
    updatedAt: iso,
  };
}

export function markAchievementSeen(state, achievementId, iso = new Date().toISOString()) {
  if (!isKnownAchievementId(achievementId)) return normalizeAchievementState(state);
  const normalized = normalizeAchievementState(state);
  const entry = { ...normalized.achievements[achievementId], seenAt: iso };
  return {
    achievements: { ...normalized.achievements, [achievementId]: entry },
    updatedAt: iso,
  };
}
