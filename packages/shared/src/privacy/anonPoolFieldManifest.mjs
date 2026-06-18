/** Plan 05 P5 — fields included/excluded in anonymized research pool contribution. */

export const ANON_POOL_INCLUDED_FIELDS = [
  { id: 'date', labelKey: 'settings.privacy.anonPool.field.date' },
  { id: 'vitals', labelKey: 'settings.privacy.anonPool.field.vitals' },
  { id: 'scores', labelKey: 'settings.privacy.anonPool.field.scores' },
  { id: 'flare', labelKey: 'settings.privacy.anonPool.field.flare' },
  { id: 'foodNames', labelKey: 'settings.privacy.anonPool.field.foodNames' },
  { id: 'exercise', labelKey: 'settings.privacy.anonPool.field.exercise' },
  { id: 'stepsHydration', labelKey: 'settings.privacy.anonPool.field.stepsHydration' },
  { id: 'energyClarity', labelKey: 'settings.privacy.anonPool.field.energyClarity' },
];

export const ANON_POOL_EXCLUDED_FIELDS = [
  { id: 'notes', labelKey: 'settings.privacy.anonPool.field.notes' },
  { id: 'symptoms', labelKey: 'settings.privacy.anonPool.field.symptoms' },
  { id: 'stressors', labelKey: 'settings.privacy.anonPool.field.stressors' },
  { id: 'painLocation', labelKey: 'settings.privacy.anonPool.field.painLocation' },
  { id: 'userName', labelKey: 'settings.privacy.anonPool.field.userName' },
  { id: 'medicalCondition', labelKey: 'settings.privacy.anonPool.field.medicalCondition' },
];
