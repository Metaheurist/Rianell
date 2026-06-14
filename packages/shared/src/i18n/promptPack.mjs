import { DEFAULT_LOCALE, isValidLocaleId, localeFallbackChain } from './locales.mjs';
import { PROMPT_PACKS_V1 } from './promptPackData.mjs';

/** Load prompt pack for locale with en-GB fallback chain. Optional preloaded map overrides bundled data. */
export function loadPromptPack(locale, preloaded) {
  const chain = localeFallbackChain(isValidLocaleId(locale) ? locale : DEFAULT_LOCALE);
  for (const loc of chain) {
    if (preloaded?.[loc]) return preloaded[loc];
    if (PROMPT_PACKS_V1[loc]) return PROMPT_PACKS_V1[loc];
  }
  return PROMPT_PACKS_V1[DEFAULT_LOCALE] || { locale: DEFAULT_LOCALE, strings: {} };
}

function promptString(pack, key, fallback) {
  const val = pack?.strings?.[key];
  return typeof val === 'string' ? val : fallback;
}

export function buildMotdPrompt(locale, theme, options = {}) {
  const pack = loadPromptPack(locale, options.packs);
  const system = promptString(
    pack,
    'motd.system',
    'You write one short, simple quote about healthy living for a health tracking app. '
      + 'Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. '
      + 'Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. '
      + 'Reply with only the quote sentence.',
  );
  const userBase = promptString(pack, 'motd.user', 'Write one healthy-lifestyle quote.');
  const user = theme ? `${userBase} Theme: ${theme}.` : userBase;
  return { system, user };
}

export function buildSummaryPrompt(locale, context, options = {}) {
  const pack = loadPromptPack(locale, options.packs);
  const system = promptString(
    pack,
    'summary.system',
    'You summarise health tracking data for the patient in exactly 2 short sentences. '
      + 'Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. '
      + 'Reply with only the summary text.',
  );
  return { system, user: `Data: ${context}` };
}

export function buildSuggestPrompt(locale, context, options = {}) {
  const pack = loadPromptPack(locale, options.packs);
  const system = promptString(
    pack,
    'suggest.system',
    'You write one short sentence for a daily health log note. Compare today to the recent average. '
      + 'Use only the data provided. Reply with only the note sentence.',
  );
  return { system, user: `Data: ${context}` };
}

export function buildHomeQuestionPrompt(locale, context, options = {}) {
  const pack = loadPromptPack(locale, options.packs);
  const system = promptString(
    pack,
    'homeQuestion.system',
    'You answer one specific health-tracking question using only the data provided. '
      + 'Write 3–5 short sentences in plain language. No diagnosis or medical orders. '
      + 'Be encouraging. Reply with only the answer text.',
  );
  return { system, user: context };
}

/** B2: client sends explicit locale; invalid values fall back to en-GB. */
export function buildLlmRequestPayload({ feature, model, modelSize, context, locale }) {
  return {
    feature,
    model,
    modelSize,
    context,
    locale: isValidLocaleId(locale) ? locale : DEFAULT_LOCALE,
  };
}
