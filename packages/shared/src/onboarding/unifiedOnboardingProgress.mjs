import { buildFirstRunPlan } from './firstRunOrchestrator.mjs';
import { shouldSkipFirstRunStep } from './firstRunSteps.mjs';
import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';

/** Tutorial slide order when AI & goals path is enabled (matches PWA/RN first-run). */
export const TUTORIAL_SLIDE_ORDER_AI_ON = [0, 1, 8, 2, 3, 4, 5, 6, 7];

/** Tutorial slide order when user skips AI on slide 0. */
export const TUTORIAL_SLIDE_ORDER_AI_OFF = [0, 1, 8, 5, 7];

/**
 * @param {boolean} [aiEnabled]
 * @returns {number[]}
 */
export function getTutorialVisibleIndices(aiEnabled) {
  return aiEnabled !== false
    ? [...TUTORIAL_SLIDE_ORDER_AI_ON]
    : [...TUTORIAL_SLIDE_ORDER_AI_OFF];
}

/**
 * Canonical induction progress track — keeps completed steps in the sequence so
 * `current` does not jump when prefs update mid-wizard.
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 * @param {{ tutorialSlideIndices?: number[] }} [options]
 */
export function buildInductionProgressSteps(prefs, ctx, options = {}) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const indices =
    options.tutorialSlideIndices ?? getTutorialVisibleIndices(p.aiEnabled !== false);
  const regionConfigured = isPrivacyRegionConfigured(p);
  const regionId = regionConfigured ? String(p.privacyRegion) : '';

  /** @type {string[]} */
  const wizardIds = ['region'];

  if (!regionConfigured || regionId === 'eea_uk') {
    wizardIds.push('healthConsent');
  }

  for (const id of ['cookies', 'sessionRecording']) {
    if (!shouldSkipFirstRunStep(id, p, ctx)) wizardIds.push(id);
  }

  if (p.tutorialSeen !== true) {
    wizardIds.push('tutorial');
  }

  for (const id of ['aiDownload', 'install']) {
    if (!shouldSkipFirstRunStep(id, p, ctx)) wizardIds.push(id);
  }

  /** @type {ReturnType<typeof buildUnifiedOnboardingSteps>} */
  const steps = [];
  for (const id of wizardIds) {
    if (id === 'tutorial') {
      indices.forEach((slideIndex, tutorialPos) => {
        steps.push({ type: 'tutorial', slideIndex, tutorialPos });
      });
    } else {
      steps.push({ type: 'wizard', id });
    }
  }
  return steps;
}

/**
 * Flat onboarding sequence: wizard steps expand `tutorial` into one entry per slide.
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 * @param {{ tutorialSlideIndices?: number[] }} [options]
 * @returns {Array<{ type: 'wizard', id: string } | { type: 'tutorial', slideIndex: number, tutorialPos: number }>}
 */
export function buildUnifiedOnboardingSteps(prefs, ctx, options = {}) {
  const plan = buildFirstRunPlan(prefs, ctx);
  const tutorialIndices =
    options.tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
  /** @type {ReturnType<typeof buildUnifiedOnboardingSteps>} */
  const steps = [];

  for (const { id } of plan) {
    if (id === 'tutorial') {
      tutorialIndices.forEach((slideIndex, tutorialPos) => {
        steps.push({ type: 'tutorial', slideIndex, tutorialPos });
      });
    } else {
      steps.push({ type: 'wizard', id });
    }
  }
  return steps;
}

/**
 * Resolve 1-based step counter for the unified induction model.
 * @param {{
 *   prefs: Record<string, unknown>,
 *   ctx: import('./firstRunSteps.mjs').FirstRunPlatformContext,
 *   wizardStepId: string,
 *   tutorialPos?: number,
 *   tutorialSlideIndices?: number[],
 *   sessionTotal?: number,
 * }} state
 */
export function resolveUnifiedOnboardingProgress(state) {
  const {
    prefs,
    ctx,
    wizardStepId,
    tutorialPos = 0,
    tutorialSlideIndices,
    sessionTotal,
  } = state;

  const indices =
    tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
  const steps = buildInductionProgressSteps(prefs, ctx, { tutorialSlideIndices: indices });
  const computedTotal = steps.length || 1;
  const total =
    typeof sessionTotal === 'number' && sessionTotal > 0
      ? Math.max(sessionTotal, computedTotal)
      : computedTotal;

  if (wizardStepId === 'tutorial') {
    const idx = steps.findIndex(
      (s) => s.type === 'tutorial' && s.tutorialPos === tutorialPos,
    );
    return { current: idx >= 0 ? idx + 1 : 1, total };
  }

  const idx = steps.findIndex((s) => s.type === 'wizard' && s.id === wizardStepId);
  return { current: idx >= 0 ? idx + 1 : 1, total };
}

/**
 * Session counter: total only grows when conditional steps appear (e.g. EEA health consent).
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 * @param {{ tutorialSlideIndices?: number[] }} [options]
 */
export function createOnboardingProgressSession(prefs, ctx, options = {}) {
  const indices =
    options.tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
  let sessionTotal = buildInductionProgressSteps(prefs, ctx, { tutorialSlideIndices: indices }).length || 1;

  return {
    getTotal() {
      return sessionTotal;
    },
    refresh(prefsNext, ctxNext, tutorialSlideIndicesNext) {
      const idx =
        tutorialSlideIndicesNext ?? getTutorialVisibleIndices(prefsNext?.aiEnabled !== false);
      const next = buildInductionProgressSteps(prefsNext, ctxNext, { tutorialSlideIndices: idx }).length || 1;
      if (next > sessionTotal) sessionTotal = next;
      return sessionTotal;
    },
    resolve(state) {
      const tutorialSlideIndices =
        state.tutorialSlideIndices ?? getTutorialVisibleIndices(state.prefs?.aiEnabled !== false);
      this.refresh(state.prefs, state.ctx, tutorialSlideIndices);
      return resolveUnifiedOnboardingProgress({
        ...state,
        tutorialSlideIndices,
        sessionTotal,
      });
    },
  };
}
