import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import {
  daysSinceTrackingProfileStart,
  getUnlockDaysForCategory,
  isGoodDayLog,
  isLogCategoryUnlocked,
} from '@rianell/shared';

const MILESTONE_KEY = 'logMilestonesShown';
const MILESTONES = [1, 5, 10, 25, 50] as const;

const MILESTONE_I18N: Record<number, string> = {
  1: 'home.firstLog.celebration',
  5: 'gamification.milestone.5logs',
  10: 'gamification.milestone.10logs',
  25: 'gamification.milestone.25logs',
  50: 'gamification.milestone.50logs',
};

export async function readShownLogMilestones(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(MILESTONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export async function markLogMilestoneShown(n: number): Promise<void> {
  const shown = await readShownLogMilestones();
  if (shown.includes(n)) return;
  await AsyncStorage.setItem(MILESTONE_KEY, JSON.stringify([...shown, n]));
}

/** Returns i18n key for newly crossed milestone, or null. */
export async function detectNewLogMilestone(prevCount: number, newCount: number): Promise<string | null> {
  if (newCount <= prevCount) return null;
  const shown = await readShownLogMilestones();
  for (const m of MILESTONES) {
    if (prevCount < m && newCount >= m && !shown.includes(m)) {
      await markLogMilestoneShown(m);
      return MILESTONE_I18N[m] ?? null;
    }
  }
  return null;
}

export async function setTabDiscoveryBadge(key: 'tabBadge_charts' | 'tabBadge_ai'): Promise<void> {
  await AsyncStorage.setItem(key, new Date().toISOString());
}

export async function isTabBadgeActive(key: 'tabBadge_charts' | 'tabBadge_ai'): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return false;
    const at = Date.parse(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export async function clearTabDiscoveryBadge(key: 'tabBadge_charts' | 'tabBadge_ai'): Promise<void> {
  await AsyncStorage.removeItem(key);
}

function todayLog(logs: LogEntry[], todayStr: string): LogEntry | undefined {
  return logs.find((l) => l.date === todayStr);
}

export function computeMetGoalsToday(
  logs: LogEntry[],
  goals: Preferences['goals'],
  todayStr: string
): string[] {
  const log = todayLog(logs, todayStr);
  if (!log) return [];
  const met: string[] = [];
  const steps = typeof log.steps === 'number' ? log.steps : Number(log.steps);
  if (goals.steps > 0 && Number.isFinite(steps) && steps >= goals.steps) met.push('steps');
  const hydration = typeof log.hydration === 'number' ? log.hydration : Number(log.hydration);
  if (goals.hydration > 0 && Number.isFinite(hydration) && hydration >= goals.hydration) met.push('hydration');
  const sleepScore = typeof log.sleep === 'number' ? log.sleep : Number(log.sleep);
  if (goals.sleepScore > 0 && Number.isFinite(sleepScore) && sleepScore >= goals.sleepScore) met.push('sleepScore');
  if (isGoodDayLog(log)) met.push('goodDay');
  return met;
}

export async function shouldCelebrateGoalsToday(todayStr: string): Promise<boolean> {
  const key = `goalCelebrated_${todayStr}`;
  const v = await AsyncStorage.getItem(key);
  return v !== '1';
}

export async function markGoalsCelebratedToday(todayStr: string): Promise<void> {
  await AsyncStorage.setItem(`goalCelebrated_${todayStr}`, '1');
}

export function pickGoalCelebrationKey(metGoals: string[]): string {
  if (metGoals.includes('goodDay')) return 'gamification.goal.goodDay';
  if (metGoals.includes('steps')) return 'gamification.goal.steps';
  if (metGoals.includes('hydration')) return 'gamification.goal.hydration';
  return 'gamification.goal.generic';
}

export function computeSetupProgress(prefs: Preferences): { done: number; total: 4 } {
  let done = 0;
  if (prefs.medicalCondition?.trim()) done += 1;
  if (prefs.userName?.trim()) done += 1;
  if (prefs.notifications?.enabled) done += 1;
  const g = prefs.goals;
  const goalsCustomised =
    g.steps !== 10000 || g.hydration !== 9 || g.sleepScore !== 5 || g.goodDaysPerWeek !== 3;
  if (goalsCustomised) done += 1;
  return { done, total: 4 };
}

export function daysSinceDate(isoDate: string | null | undefined): number {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return 0;
  const start = new Date(isoDate.slice(0, 10) + 'T12:00:00').getTime();
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - start) / (24 * 60 * 60 * 1000)));
}

export type UnlockCategory = 'food' | 'exercise' | 'medications';

const UNLOCK_BANNER_KEY = 'wizardUnlockBannerShown';

const UNLOCK_I18N: Record<UnlockCategory, string> = {
  food: 'gamification.unlock.food',
  exercise: 'gamification.unlock.exercise',
  medications: 'gamification.unlock.medications',
};

export function getUnlockBannerI18nKey(category: UnlockCategory): string {
  return UNLOCK_I18N[category];
}

async function readUnlockBannersShown(): Promise<UnlockCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(UNLOCK_BANNER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is UnlockCategory => c === 'food' || c === 'exercise' || c === 'medications');
  } catch {
    return [];
  }
}

export async function markUnlockBannerShown(category: UnlockCategory): Promise<void> {
  const shown = await readUnlockBannersShown();
  if (shown.includes(category)) return;
  await AsyncStorage.setItem(UNLOCK_BANNER_KEY, JSON.stringify([...shown, category]));
}

export async function shouldShowUnlockBanner(
  profile: Preferences['trackingProfile'],
  category: UnlockCategory,
): Promise<boolean> {
  const days = daysSinceTrackingProfileStart(profile);
  const unlockDay = getUnlockDaysForCategory(category);
  if (days !== unlockDay) return false;
  if (!isLogCategoryUnlocked(profile, category)) return false;
  const shown = await readUnlockBannersShown();
  return !shown.includes(category);
}

export async function runPostLogSaveEngagement(opts: {
  prevCount: number;
  logs: LogEntry[];
  logDate: string;
  goals: Preferences['goals'];
  showToast: (message: string, type?: 'success' | 'error' | 'info', durationMs?: number) => void;
  t: (key: string) => string;
}): Promise<void> {
  const newCount = opts.logs.length;
  const milestoneKey = await detectNewLogMilestone(opts.prevCount, newCount);
  if (milestoneKey) {
    opts.showToast(opts.t(milestoneKey), 'success', 5000);
    if (newCount >= 10) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (newCount === 5) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (newCount === 1) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  const metGoals = computeMetGoalsToday(opts.logs, opts.goals, opts.logDate);
  if (metGoals.length > 0 && (await shouldCelebrateGoalsToday(opts.logDate))) {
    opts.showToast(opts.t(pickGoalCelebrationKey(metGoals)), 'success');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await markGoalsCelebratedToday(opts.logDate);
  }
}
