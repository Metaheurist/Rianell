import { buildFirstRunPlan } from './firstRunOrchestrator.mjs';

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
 * }} state
 */
export function resolveUnifiedOnboardingProgress(state) {
  const {
    prefs,
    ctx,
    wizardStepId,
    tutorialPos = 0,
    tutorialSlideIndices,
  } = state;

  const indices =
    tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
  const steps = buildUnifiedOnboardingSteps(prefs, ctx, { tutorialSlideIndices: indices });
  const total = steps.length || 1;

  if (wizardStepId === 'tutorial') {
    const idx = steps.findIndex(
      (s) => s.type === 'tutorial' && s.tutorialPos === tutorialPos,
    );
    return { current: idx >= 0 ? idx + 1 : 1, total };
  }

  const idx = steps.findIndex((s) => s.type === 'wizard' && s.id === wizardStepId);
  return { current: idx >= 0 ? idx + 1 : 1, total };
}
