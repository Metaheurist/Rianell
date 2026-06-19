import { SHIPPED_LOCALES } from '../i18n/locales.mjs';
import {
  buildMotdPrompt,
  buildSummaryPrompt,
  buildSuggestPrompt,
  buildHomeQuestionPrompt,
  buildClinicianBriefPrompt,
  buildDoctorQuestionsPrompt,
  buildExplainChartPrompt,
  buildStructuredSummaryPrompt,
  buildWeekChatPrompt,
} from '../i18n/promptPack.mjs';
import { isLlmInferenceAllowed } from './llmCapability.mjs';

export const GOLDEN_LLM_LOCALES = SHIPPED_LOCALES;

const SAMPLE_CONTEXT = {
  summary: '{"totalLogs":7,"flareDays":1,"avgSleep":6.5}',
  suggest: '{"sleep":7,"fatigue":4,"mood":6}',
  homeQuestion: 'Question: How is my sleep?\nRange: last 14 days.\n7 logged day(s).',
  clinicianBrief: 'Range: Last 14 days. 7 logged day(s). Flare days: 1.',
  doctorQuestions: 'Range: Last 14 days. Mood avg 6.2/10. Fatigue avg 5.1/10. Flare days: 1.',
  explainChart: 'Chart range: Last 7 days. Mood avg 6.2.',
  structuredSummary: '{"totalLogs":7,"flareDays":0}',
  weekChat: 'Week scope: Last 14 days.\nUser: What patterns do you see?',
};

const WELLNESS_GUARDRAIL_RES = [
  /no diagnosis|no medical|wellness|only the data|no prescription|no tool|reply with only/i,
  /keine diagnose|keine medizinisch|nur die|antworte nur|bereitgestellten/i,
  /sin diagnóstico|sin consejo médico|solo los datos|responde solo/i,
  /pas de diagnostic|pas de conseil médical|uniquement les données|réponds uniquement/i,
  /niente diagnosi|niente consigli medici|solo i dati|rispondi solo/i,
  /geen diagnose|geen medisch|alleen de verstrekte|antwoord alleen/i,
  /bez diagnozy|bez porad medycznych|tylko podanych|odpowiedz tylko/i,
  /sem diagnóstico|sem conselho médico|apenas os dados|responda apenas|responde apenas/i,
];

function hasWellnessGuardrail(system) {
  const sys = String(system || '');
  return WELLNESS_GUARDRAIL_RES.some((re) => re.test(sys));
}

/** @typedef {{ id: string, build: (locale: string) => { system: string, user: string } }} GoldenIntent */

export const GOLDEN_LLM_INTENTS = /** @type {GoldenIntent[]} */ ([
  { id: 'motd', build: (locale) => buildMotdPrompt(locale, 'water') },
  { id: 'summary', build: (locale) => buildSummaryPrompt(locale, SAMPLE_CONTEXT.summary) },
  { id: 'suggestNote', build: (locale) => buildSuggestPrompt(locale, SAMPLE_CONTEXT.suggest) },
  { id: 'homeQuestion', build: (locale) => buildHomeQuestionPrompt(locale, SAMPLE_CONTEXT.homeQuestion) },
  { id: 'clinicianBrief', build: (locale) => buildClinicianBriefPrompt(locale, SAMPLE_CONTEXT.clinicianBrief) },
  { id: 'doctorQuestions', build: (locale) => buildDoctorQuestionsPrompt(locale, SAMPLE_CONTEXT.doctorQuestions) },
  { id: 'explainChart', build: (locale) => buildExplainChartPrompt(locale, SAMPLE_CONTEXT.explainChart) },
  { id: 'structuredSummary', build: (locale) => buildStructuredSummaryPrompt(locale, SAMPLE_CONTEXT.structuredSummary) },
  { id: 'weekChat', build: (locale) => buildWeekChatPrompt(locale, SAMPLE_CONTEXT.weekChat) },
]);

/**
 * @param {string} intentId
 * @param {string} system
 * @param {string} user
 */
export function auditGoldenPrompt(intentId, system, user) {
  const errors = [];
  const sys = String(system || '').trim();
  const usr = String(user || '').trim();
  if (sys.length < 16) errors.push(`${intentId}: system prompt too short`);
  if (usr.length < 3) errors.push(`${intentId}: user prompt too short`);
  if (!hasWellnessGuardrail(sys)) {
    errors.push(`${intentId}: missing wellness guardrail in system prompt`);
  }
  if (intentId === 'structuredSummary' && !/json/i.test(sys)) {
    errors.push(`${intentId}: structured intent must mention JSON`);
  }
  if (intentId === 'weekChat' && !/coach|conversation|scope/i.test(sys)) {
    errors.push(`${intentId}: week chat system prompt missing scope guardrail`);
  }
  return errors;
}

/**
 * @param {string[]} [locales]
 * @returns {{ errors: string[], checked: number }}
 */
export function runGoldenPromptAudit(locales = GOLDEN_LLM_LOCALES) {
  const errors = [];
  let checked = 0;
  for (const locale of locales) {
    for (const intent of GOLDEN_LLM_INTENTS) {
      checked += 1;
      const { system, user } = intent.build(locale);
      errors.push(...auditGoldenPrompt(intent.id, system, user));
      if (!isLlmInferenceAllowed(locale) && ['ar', 'he', 'ga'].includes(locale)) {
        // ui-only locales must stay blocked at inference entry
        continue;
      }
    }
  }
  return { errors, checked };
}
