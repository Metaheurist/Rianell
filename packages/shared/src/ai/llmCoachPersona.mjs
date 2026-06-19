export const LLM_COACH_PERSONAS = ['encouraging', 'clinical', 'minimal'];

export function normalizeLlmCoachPersona(value) {
  return LLM_COACH_PERSONAS.includes(value) ? value : 'encouraging';
}

export function coachPersonaPromptKey(persona) {
  return `persona.${normalizeLlmCoachPersona(persona)}`;
}
