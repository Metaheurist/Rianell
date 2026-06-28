import { normalizeLlmCoachPersona } from '../ai/llmCoachPersona.mjs';
import { applyRegionDefaultLocale } from '../i18n/resolveLocale.mjs';
import { resolvePolicyPack } from '../privacy/resolvePolicyPack.mjs';
import { isPrivacyRegionConfigured } from '../privacy/profileSync.mjs';
import { completeFirstRunWizard } from './firstRunOrchestrator.mjs';

/** @typedef {'info'|'choice'|'consent'|'reminder'} GuidedCardKind */

/** Canonical guided onboarding card order (PWA + RN). */
export const GUIDED_QUESTIONNAIRE_CARD_IDS = [
  'welcome',
  'region',
  'coachTone',
  'helperLevel',
  'healthConsent',
  'cookies',
  'sessionRecording',
  'aiDownload',
  'communityHelp',
  'dailyNudge',
  'install',
  'finish',
];

/** @typedef {'welcome'|'region'|'coachTone'|'helperLevel'|'healthConsent'|'cookies'|'sessionRecording'|'aiDownload'|'communityHelp'|'dailyNudge'|'install'|'finish'} GuidedCardId */

export const GUIDED_CARD_META = {
  welcome: {
    kind: 'info',
    titleKey: 'onboarding.questionnaire.welcome.title',
    bodyKey: 'onboarding.questionnaire.welcome.body',
    illustration: 'mascot-wave',
    settingsHintKey: '',
  },
  region: {
    kind: 'choice',
    titleKey: 'onboarding.questionnaire.region.title',
    bodyKey: 'onboarding.questionnaire.region.body',
    illustration: 'globe',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'confirm', labelKey: 'onboarding.questionnaire.region.confirm' },
      { id: 'pickAnother', labelKey: 'onboarding.questionnaire.region.pickAnother' },
    ],
  },
  coachTone: {
    kind: 'choice',
    titleKey: 'onboarding.questionnaire.coachTone.title',
    bodyKey: 'onboarding.questionnaire.coachTone.body',
    illustration: 'coach',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'encouraging', labelKey: 'onboarding.questionnaire.coachTone.warm', hintKey: 'onboarding.questionnaire.coachTone.warmHint' },
      { id: 'clinical', labelKey: 'onboarding.questionnaire.coachTone.facts', hintKey: 'onboarding.questionnaire.coachTone.factsHint' },
      { id: 'minimal', labelKey: 'onboarding.questionnaire.coachTone.short', hintKey: 'onboarding.questionnaire.coachTone.shortHint' },
    ],
  },
  helperLevel: {
    kind: 'choice',
    titleKey: 'onboarding.questionnaire.helperLevel.title',
    bodyKey: 'onboarding.questionnaire.helperLevel.body',
    illustration: 'helper',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'guideAlot', labelKey: 'onboarding.questionnaire.helperLevel.guide', hintKey: 'onboarding.questionnaire.helperLevel.guideHint' },
      { id: 'keepSimple', labelKey: 'onboarding.questionnaire.helperLevel.simple', hintKey: 'onboarding.questionnaire.helperLevel.simpleHint' },
      { id: 'exploreMyself', labelKey: 'onboarding.questionnaire.helperLevel.explore', hintKey: 'onboarding.questionnaire.helperLevel.exploreHint' },
    ],
  },
  healthConsent: {
    kind: 'consent',
    titleKey: 'onboarding.questionnaire.healthConsent.title',
    bodyKey: 'onboarding.questionnaire.healthConsent.body',
    illustration: 'shield',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'agree', labelKey: 'onboarding.questionnaire.healthConsent.agree' },
      { id: 'notNow', labelKey: 'onboarding.questionnaire.healthConsent.notNow' },
    ],
  },
  cookies: {
    kind: 'consent',
    titleKey: 'onboarding.questionnaire.cookies.title',
    bodyKey: 'onboarding.questionnaire.cookies.body',
    illustration: 'cookie',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'accept', labelKey: 'onboarding.questionnaire.cookies.accept' },
      { id: 'decline', labelKey: 'onboarding.questionnaire.cookies.decline' },
    ],
  },
  sessionRecording: {
    kind: 'consent',
    titleKey: 'onboarding.questionnaire.sessionRecording.title',
    bodyKey: 'onboarding.questionnaire.sessionRecording.body',
    illustration: 'sparkle',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'yes', labelKey: 'onboarding.questionnaire.sessionRecording.yes' },
      { id: 'no', labelKey: 'onboarding.questionnaire.sessionRecording.no' },
    ],
  },
  aiDownload: {
    kind: 'choice',
    titleKey: 'onboarding.questionnaire.aiDownload.title',
    bodyKey: 'onboarding.questionnaire.aiDownload.body',
    illustration: 'brain',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'now', labelKey: 'onboarding.questionnaire.aiDownload.now' },
      { id: 'later', labelKey: 'onboarding.questionnaire.aiDownload.later' },
    ],
  },
  communityHelp: {
    kind: 'choice',
    titleKey: 'onboarding.questionnaire.communityHelp.title',
    bodyKey: 'onboarding.questionnaire.communityHelp.body',
    illustration: 'heart',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'yes', labelKey: 'onboarding.questionnaire.communityHelp.yes' },
      { id: 'no', labelKey: 'onboarding.questionnaire.communityHelp.no' },
    ],
  },
  dailyNudge: {
    kind: 'reminder',
    titleKey: 'onboarding.questionnaire.dailyNudge.title',
    bodyKey: 'onboarding.questionnaire.dailyNudge.body',
    illustration: 'bell',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'yes', labelKey: 'onboarding.questionnaire.dailyNudge.yes' },
      { id: 'no', labelKey: 'onboarding.questionnaire.dailyNudge.no' },
    ],
  },
  install: {
    kind: 'choice',
    titleKey: 'onboarding.questionnaire.install.title',
    bodyKey: 'onboarding.questionnaire.install.body',
    illustration: 'install',
    settingsHintKey: 'onboarding.questionnaire.settingsHint',
    choices: [
      { id: 'install', labelKey: 'onboarding.questionnaire.install.install' },
      { id: 'skip', labelKey: 'onboarding.questionnaire.install.skip' },
    ],
  },
  finish: {
    kind: 'info',
    titleKey: 'onboarding.questionnaire.finish.title',
    bodyKey: 'onboarding.questionnaire.finish.body',
    illustration: 'celebrate',
    settingsHintKey: '',
    choices: [
      { id: 'start', labelKey: 'onboarding.questionnaire.finish.start' },
      { id: 'quickTour', labelKey: 'onboarding.questionnaire.finish.quickTour' },
    ],
  },
};

/**
 * @param {GuidedCardId} cardId
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 */
export function shouldSkipGuidedCard(cardId, prefs, ctx) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const c = ctx && typeof ctx === 'object' ? ctx : { platform: 'pwa' };

  switch (cardId) {
    case 'welcome':
    case 'coachTone':
    case 'helperLevel':
    case 'communityHelp':
    case 'dailyNudge':
    case 'finish':
      return false;
    case 'region':
      return isPrivacyRegionConfigured(p);
    case 'healthConsent':
      return p.privacyRegion !== 'eea_uk' || p.healthDataConsent === true;
    case 'cookies':
      if (p.cookieConsent === true) return true;
      if (c.cookieConsentAccepted === true) return true;
      return false;
    case 'sessionRecording': {
      if (typeof p.sessionRecordingDisclosureAt === 'string' && p.sessionRecordingDisclosureAt.length > 0) {
        return true;
      }
      const regionId = typeof p.privacyRegion === 'string' && p.privacyRegion ? p.privacyRegion : 'other';
      const resolved = resolvePolicyPack(regionId);
      const feat = resolved.features?.sessionRecording;
      if (!feat || feat.enabled === false) return true;
      return false;
    }
    case 'aiDownload':
      if (p.aiEnabled === false) return true;
      if (p.aiModelDownloadConsent === 'granted' || p.aiModelDownloadConsent === 'deferred') return true;
      return false;
    case 'install':
      if (c.platform !== 'pwa') return true;
      if (c.installModalSeen === true) return true;
      if (c.standalonePwa === true) return true;
      return false;
    default:
      return true;
  }
}

/**
 * @param {Record<string, unknown>} prefs
 * @param {import('./firstRunSteps.mjs').FirstRunPlatformContext} ctx
 * @returns {Array<{ id: GuidedCardId, kind: GuidedCardKind, titleKey: string, bodyKey: string, illustration: string, settingsHintKey: string, choices?: Array<{ id: string, labelKey: string, hintKey?: string }> }>}
 */
export function buildGuidedQuestionnaire(prefs, ctx) {
  return GUIDED_QUESTIONNAIRE_CARD_IDS
    .filter((id) => !shouldSkipGuidedCard(id, prefs, ctx))
    .map((id) => {
      const meta = GUIDED_CARD_META[id];
      return {
        id,
        kind: meta.kind,
        titleKey: meta.titleKey,
        bodyKey: meta.bodyKey,
        illustration: meta.illustration,
        settingsHintKey: meta.settingsHintKey,
        choices: meta.choices ? [...meta.choices] : undefined,
      };
    });
}

/**
 * @param {Record<string, unknown>} prefs
 * @param {GuidedCardId} cardId
 * @param {string} choiceId
 * @param {{ regionId?: string, policyPackId?: string, reminderTime?: string, installModalSeen?: boolean }} [extra]
 */
export function applyQuestionnaireAnswer(prefs, cardId, choiceId, extra = {}) {
  const p = prefs && typeof prefs === 'object' ? { ...prefs } : {};
  const now = new Date().toISOString();

  switch (cardId) {
    case 'welcome':
      return p;
    case 'region': {
      if (choiceId !== 'confirm' && choiceId !== 'pickAnother') return p;
      const regionId = typeof extra.regionId === 'string' && extra.regionId ? extra.regionId : p.privacyRegion;
      if (!regionId) return p;
      const packId = extra.policyPackId || p.policyAcknowledgedVersion || 'v1.0.0';
      const withRegion = {
        ...p,
        privacyRegion: regionId,
        privacyRegionSource: 'onboarding',
        privacyRegionUpdatedAt: now,
        policyAcknowledgedVersion: packId,
        policyAcknowledgedAt: now,
        uiLocaleSource: 'onboarding',
      };
      return applyRegionDefaultLocale(withRegion, regionId, resolvePolicyPack(regionId));
    }
    case 'coachTone':
      return {
        ...p,
        performance: {
          ...(typeof p.performance === 'object' && p.performance ? p.performance : {}),
          llmCoachPersona: normalizeLlmCoachPersona(choiceId),
        },
        llmCoachPersona: normalizeLlmCoachPersona(choiceId),
      };
    case 'helperLevel': {
      if (choiceId === 'guideAlot') {
        return { ...p, aiEnabled: true, simpleMode: false };
      }
      if (choiceId === 'keepSimple') {
        return { ...p, aiEnabled: true, simpleMode: true };
      }
      if (choiceId === 'exploreMyself') {
        return { ...p, aiEnabled: false, simpleMode: false };
      }
      return p;
    }
    case 'healthConsent':
      if (choiceId === 'agree') {
        return { ...p, healthDataConsent: true, healthDataConsentAt: now };
      }
      if (choiceId === 'notNow') {
        return { ...p, healthDataConsent: false, healthDataConsentAt: null };
      }
      return p;
    case 'cookies':
      if (choiceId === 'accept') {
        return { ...p, cookieConsent: true, cookieConsentAt: now };
      }
      if (choiceId === 'decline') {
        return { ...p, cookieConsent: false, cookieConsentAt: null };
      }
      return p;
    case 'sessionRecording': {
      const enabled = choiceId === 'yes';
      return {
        ...p,
        sessionRecording: enabled,
        sessionRecordingAt: enabled ? now : null,
        sessionRecordingDisclosureAt: now,
      };
    }
    case 'aiDownload': {
      if (choiceId === 'now') {
        return { ...p, aiModelDownloadConsent: 'granted', aiModelDownloadConsentAt: now };
      }
      if (choiceId === 'later') {
        return { ...p, aiModelDownloadConsent: 'deferred' };
      }
      return p;
    }
    case 'communityHelp':
      if (choiceId === 'yes') {
        return { ...p, contributeAnonData: true, contributeAnonDataAt: now, useOpenData: true };
      }
      if (choiceId === 'no') {
        return { ...p, contributeAnonData: false, contributeAnonDataAt: null, useOpenData: false };
      }
      return p;
    case 'dailyNudge': {
      const reminderTime = typeof extra.reminderTime === 'string' && extra.reminderTime
        ? extra.reminderTime
        : '09:00';
      const notifications = typeof p.notifications === 'object' && p.notifications ? { ...p.notifications } : {};
      if (choiceId === 'yes') {
        return {
          ...p,
          reminder: true,
          notifications: { ...notifications, enabled: true, dailyReminderTime: reminderTime },
        };
      }
      if (choiceId === 'no') {
        return {
          ...p,
          reminder: false,
          notifications: { ...notifications, enabled: false },
        };
      }
      return p;
    }
    case 'install':
      if (choiceId === 'skip' || choiceId === 'install') {
        return { ...p, installModalSeen: true };
      }
      return p;
    case 'finish':
      if (choiceId === 'quickTour') {
        return completeFirstRunWizard({ ...p, replayTutorial: true, tutorialSeen: false });
      }
      if (choiceId === 'start') {
        return completeFirstRunWizard(p);
      }
      return p;
    default:
      return p;
  }
}

/**
 * @param {Array<{ id: GuidedCardId }>} cards
 * @param {GuidedCardId} cardId
 */
export function resolveGuidedCardIndex(cards, cardId) {
  const idx = cards.findIndex((c) => c.id === cardId);
  return idx >= 0 ? idx : 0;
}

/**
 * @param {Array<{ id: GuidedCardId }>} cards
 * @param {GuidedCardId} answeredCardId
 */
export function resolveNextGuidedCardIndex(cards, answeredCardId) {
  const orderIdx = GUIDED_QUESTIONNAIRE_CARD_IDS.indexOf(answeredCardId);
  if (orderIdx < 0) return 0;
  for (let i = orderIdx + 1; i < GUIDED_QUESTIONNAIRE_CARD_IDS.length; i += 1) {
    const idx = cards.findIndex((c) => c.id === GUIDED_QUESTIONNAIRE_CARD_IDS[i]);
    if (idx >= 0) return idx;
  }
  return Math.max(cards.length - 1, 0);
}

/**
 * @param {Array<{ id: GuidedCardId }>} cards
 * @param {number} cardIndex
 */
export function resolveGuidedCardProgress(cards, cardIndex) {
  const total = cards.length || 1;
  const current = Math.min(Math.max(cardIndex + 1, 1), total);
  return { current, total };
}
