/** Plan 13 — unified anonymized log payload (PWA + RN parity). */

import { buildResearchFacetsFromLog } from './researchFacets.mjs';

export function buildAnonymizedLogPayload(log) {
  const anonymized = {
    date: log?.date,
    bpm: log?.bpm,
    weight: log?.weight,
    backPain: log?.backPain,
    jointPain: log?.jointPain,
    stiffness: log?.stiffness,
    swelling: log?.swelling,
    sleep: log?.sleep,
    mood: log?.mood,
    irritability: log?.irritability,
    mobility: log?.mobility,
    dailyFunction: log?.dailyFunction,
    fatigue: log?.fatigue,
    flare: log?.flare,
    hydration: log?.hydration,
    steps: log?.steps,
    weatherSensitivity: log?.weatherSensitivity,
    energyClarity: log?.energyClarity,
    exercise: log?.exercise,
    food: flattenFood(log?.food),
  };
  Object.keys(anonymized).forEach((key) => {
    const v = anonymized[key];
    if (v === undefined || v === null || v === '') delete anonymized[key];
  });
  return anonymized;
}

function flattenFood(food) {
  if (!food) return undefined;
  const arr = Array.isArray(food)
    ? food
    : [].concat(
        food.breakfast || [],
        food.lunch || [],
        food.dinner || [],
        food.snack || [],
      );
  if (!arr.length) return undefined;
  return arr.map((item) => ({
    name: (item && item.name) || '',
    calories: item && item.calories,
    protein: item && item.protein,
  }));
}

export function buildAnonymizedInsertRow(log, opts) {
  const payload = buildAnonymizedLogPayload(log);
  const research_facets = buildResearchFacetsFromLog(log);
  return {
    user_id: opts.userId,
    medical_condition: opts.medicalCondition,
    anonymized_log: opts.encryptedLog,
    research_facets,
  };
}
