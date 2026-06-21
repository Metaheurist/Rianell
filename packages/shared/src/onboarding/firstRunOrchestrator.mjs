import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';
import { FIRST_RUN_STEP_IDS, shouldSkipFirstRunStep } from './firstRunSteps.mjs';

/**
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 */
export function buildFirstRunPlan(prefs, ctx) {
  return FIRST_RUN_STEP_IDS
    .filter((id) => !shouldSkipFirstRunStep(id, prefs, ctx))
    .map((id) => ({ id }));
}

/**
 * Returns true when the unified first-run wizard should not block the app.
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} [ctx]
 */
export function isFirstRunWizardComplete(prefs, ctx) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const c = ctx && typeof ctx === 'object' ? ctx : {};

  if (typeof p.firstRunWizardCompletedAt === 'string' && p.firstRunWizardCompletedAt.length > 0) {
    return true;
  }

  // Migration: users who finished legacy separate modals
  const tutorialDone = p.tutorialSeen === true || c.tutorialSeenLegacy === true;
  if (isPrivacyRegionConfigured(p) && tutorialDone) {
    return true;
  }

  return false;
}

/**
 * Apply migration flag for legacy users without rewriting unrelated fields.
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} [ctx]
 */
export function migrateFirstRunWizardPrefs(prefs, ctx) {
  const p = prefs && typeof prefs === 'object' ? { ...prefs } : {};
  if (p.firstRunWizardCompletedAt) return p;
  if (!isFirstRunWizardComplete(p, ctx)) return p;
  const migratedAt =
    (typeof p.tutorialSeenAt === 'string' && p.tutorialSeenAt) ||
    (typeof p.policyAcknowledgedAt === 'string' && p.policyAcknowledgedAt) ||
    new Date().toISOString();
  return {
    ...p,
    firstRunWizardCompletedAt: migratedAt,
    tutorialSeen: p.tutorialSeen !== false,
  };
}

/**
 * Mark unified wizard complete and sync legacy flags.
 * @param {Record<string, unknown>} prefs
 */
export function completeFirstRunWizard(prefs) {
  const p = prefs && typeof prefs === 'object' ? { ...prefs } : {};
  const now = new Date().toISOString();
  return {
    ...p,
    firstRunWizardCompletedAt: now,
    tutorialSeen: true,
  };
}

/**
 * Recompute active steps after prefs change mid-wizard (e.g. region → healthConsent).
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 * @param {string} [currentStepId]
 */
export function rebuildFirstRunPlanFromStep(prefs, ctx, currentStepId) {
  const plan = buildFirstRunPlan(prefs, ctx);
  if (!currentStepId) return plan;
  const idx = plan.findIndex((s) => s.id === currentStepId);
  if (idx < 0) return plan;
  return plan.slice(idx);
}
