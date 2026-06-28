import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';
import {
  isTrackingProfileConfigured,
  normalizeTrackingProfile,
} from '../settings/trackingProfile.mjs';
import { FIRST_RUN_STEP_IDS, shouldSkipFirstRunStep } from './firstRunSteps.mjs';

/**
 * Next wizard index after a step completes and prefs update (plan may drop the completed id).
 * @param {ReturnType<typeof buildFirstRunPlan>} plan
 * @param {string} completedStepId
 */
function resolveNextIndexInPlan(plan, completedStepId) {
  if (!plan.length) return 0;
  const completedIdx = plan.findIndex((s) => s.id === completedStepId);
  if (completedIdx >= 0 && completedIdx < plan.length - 1) return completedIdx + 1;
  if (completedIdx < 0) {
    const completedOrder = FIRST_RUN_STEP_IDS.indexOf(completedStepId);
    if (completedOrder >= 0) {
      for (let i = completedOrder + 1; i < FIRST_RUN_STEP_IDS.length; i += 1) {
        const idx = plan.findIndex((s) => s.id === FIRST_RUN_STEP_IDS[i]);
        if (idx >= 0) return idx;
      }
    }
  }
  return 0;
}

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
 * Wizard index after a step is completed and prefs updated (plan may drop completed ids).
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 * @param {string} completedStepId
 */
export function resolveNextStepIndexAfterComplete(prefs, ctx, completedStepId) {
  const plan = buildFirstRunPlan(prefs, ctx);
  return resolveNextIndexInPlan(plan, completedStepId);
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

  // Migration: users who finished legacy separate modals (no remaining unified steps).
  const tutorialDone = p.tutorialSeen === true || c.tutorialSeenLegacy === true;
  if (isPrivacyRegionConfigured(p) && tutorialDone) {
    const remaining = buildFirstRunPlan(p, c);
    if (remaining.length === 0) return true;
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
  if (!isTrackingProfileConfigured(p.trackingProfile)) {
    const condition = typeof p.medicalCondition === 'string' ? p.medicalCondition : '';
    p.trackingProfile = normalizeTrackingProfile({
      condition,
      configuredAt: now,
    });
  }
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
