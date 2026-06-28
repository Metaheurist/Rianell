import { buildFirstRunPlan } from './firstRunOrchestrator.mjs';
import { shouldSkipFirstRunStep } from './firstRunSteps.mjs';
import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';
import {
  buildGuidedQuestionnaire,
  resolveGuidedCardProgress,
} from './guidedQuestionnaire.mjs';

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
 * @param {ReturnType<typeof buildInductionProgressSteps>[number]} a
 * @param {ReturnType<typeof buildInductionProgressSteps>[number]} b
 */
function inductionStepsEqual(a, b) {
  if (a.type !== b.type) return false;
  if (a.type === 'tutorial') return a.tutorialPos === b.tutorialPos;
  return a.id === b.id;
}

/**
 * Grow session progress when conditional steps appear (e.g. EEA health consent).
 * Never removes steps already shown — completed steps stay in the 1–N counter.
 * @param {ReturnType<typeof buildInductionProgressSteps>} existing
 * @param {ReturnType<typeof buildInductionProgressSteps>} next
 */
export function mergeInductionSessionSteps(existing, next) {
  if (!existing.length) return next;
  if (next.length <= existing.length) return existing;

  /** @type {ReturnType<typeof buildInductionProgressSteps>} */
  const merged = [...existing];
  for (const step of next) {
    if (merged.some((s) => inductionStepsEqual(s, step))) continue;
    const anchorIdx = next.findIndex((s) => inductionStepsEqual(s, step));
    let insertAt = merged.length;
    for (let i = anchorIdx - 1; i >= 0; i -= 1) {
      const prev = next[i];
      const prevInMerged = merged.findIndex((s) => inductionStepsEqual(s, prev));
      if (prevInMerged >= 0) {
        insertAt = prevInMerged + 1;
        break;
      }
    }
    merged.splice(insertAt, 0, step);
  }
  return merged;
}

/**
 * Resolve 1-based step counter against a fixed session step list.
 * @param {ReturnType<typeof buildInductionProgressSteps>} sessionSteps
 * @param {{
 *   wizardStepId: string,
 *   tutorialPos?: number,
 *   sessionTotal?: number,
 * }} state
 */
export function resolveProgressFromSessionSteps(sessionSteps, state) {
  const { wizardStepId, tutorialPos = 0, sessionTotal } = state;
  const total =
    typeof sessionTotal === 'number' && sessionTotal > 0
      ? Math.max(sessionTotal, sessionSteps.length)
      : sessionSteps.length || 1;

  if (wizardStepId === 'tutorial') {
    const idx = sessionSteps.findIndex(
      (s) => s.type === 'tutorial' && s.tutorialPos === tutorialPos,
    );
    return { current: idx >= 0 ? idx + 1 : 1, total };
  }

  const idx = sessionSteps.findIndex((s) => s.type === 'wizard' && s.id === wizardStepId);
  return { current: idx >= 0 ? idx + 1 : 1, total };
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
 *   sessionSteps?: ReturnType<typeof buildInductionProgressSteps>,
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
    sessionSteps,
  } = state;

  if (sessionSteps && sessionSteps.length > 0) {
    return resolveProgressFromSessionSteps(sessionSteps, {
      wizardStepId,
      tutorialPos,
      sessionTotal,
    });
  }

  const indices =
    tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
  const steps = buildInductionProgressSteps(prefs, ctx, { tutorialSlideIndices: indices });
  return resolveProgressFromSessionSteps(steps, {
    wizardStepId,
    tutorialPos,
    sessionTotal,
  });
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
  /** @type {ReturnType<typeof buildInductionProgressSteps>} */
  let sessionSteps = buildInductionProgressSteps(prefs, ctx, { tutorialSlideIndices: indices });
  let sessionTotal = sessionSteps.length || 1;

  return {
    getTotal() {
      return sessionTotal;
    },
    refresh(prefsNext, ctxNext, tutorialSlideIndicesNext) {
      const idx =
        tutorialSlideIndicesNext ?? getTutorialVisibleIndices(prefsNext?.aiEnabled !== false);
      const nextSteps = buildInductionProgressSteps(prefsNext, ctxNext, { tutorialSlideIndices: idx });
      sessionSteps = mergeInductionSessionSteps(sessionSteps, nextSteps);
      sessionTotal = sessionSteps.length || 1;
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
        sessionSteps,
      });
    },
  };
}

/**
 * Grow guided session when conditional cards appear (e.g. EEA health consent).
 * @param {ReturnType<typeof buildGuidedQuestionnaire>} existing
 * @param {ReturnType<typeof buildGuidedQuestionnaire>} next
 */
export function mergeGuidedSessionCards(existing, next) {
  if (!existing.length) return next;
  if (next.length <= existing.length) return existing;

  /** @type {ReturnType<typeof buildGuidedQuestionnaire>} */
  const merged = [...existing];
  for (const card of next) {
    if (merged.some((c) => c.id === card.id)) continue;
    const anchorIdx = next.findIndex((c) => c.id === card.id);
    let insertAt = merged.length;
    for (let i = anchorIdx - 1; i >= 0; i -= 1) {
      const prev = next[i];
      const prevInMerged = merged.findIndex((c) => c.id === prev.id);
      if (prevInMerged >= 0) {
        insertAt = prevInMerged + 1;
        break;
      }
    }
    merged.splice(insertAt, 0, card);
  }
  return merged;
}

/**
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 */
export function buildGuidedOnboardingProgressSteps(prefs, ctx) {
  return buildGuidedQuestionnaire(prefs, ctx);
}

/**
 * Session counter for guided questionnaire cards (replaces wizard+tutorial slide count).
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 */
export function createGuidedOnboardingProgressSession(prefs, ctx) {
  /** @type {ReturnType<typeof buildGuidedQuestionnaire>} */
  let sessionCards = buildGuidedQuestionnaire(prefs, ctx);
  let sessionTotal = sessionCards.length || 1;

  return {
    getTotal() {
      return sessionTotal;
    },
    getCards() {
      return sessionCards;
    },
    refresh(prefsNext, ctxNext) {
      const nextCards = buildGuidedQuestionnaire(prefsNext, ctxNext);
      sessionCards = mergeGuidedSessionCards(sessionCards, nextCards);
      sessionTotal = sessionCards.length || 1;
      return sessionTotal;
    },
    resolve(prefsNext, ctxNext, cardIndex) {
      this.refresh(prefsNext, ctxNext);
      return resolveGuidedCardProgress(sessionCards, cardIndex);
    },
  };
}
