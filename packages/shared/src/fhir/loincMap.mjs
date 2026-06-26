/** Plan 20 SH2 — LOINC code map for FHIR Observation resources. */

export const LOINC_MAP = {
  mood: '72133-2',
  pain: '38208-5',
  fatigue: '72514-3',
  sleep_hours: '93832-4',
  weight: '29463-7',
  blood_pressure_systolic: '8480-6',
  blood_pressure_diastolic: '8462-4',
  blood_glucose: '15074-8',
  spO2: '59408-5',
  hrv: '80404-7',
};

/** Reverse lookup: LOINC → Rianell field. */
export const LOINC_TO_FIELD = Object.fromEntries(
  Object.entries(LOINC_MAP).map(([field, code]) => [code, field]),
);

export function loincForField(field) {
  return LOINC_MAP[field] || null;
}

export function fieldForLoinc(code) {
  return LOINC_TO_FIELD[String(code || '')] || null;
}

/** Build minimal FHIR R4 Observation from a log value. */
export function buildFhirObservation({ patientId, field, value, unit, effectiveDate }) {
  const code = loincForField(field);
  if (!code) return null;
  return {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${patientId}` },
    code: {
      coding: [{ system: 'http://loinc.org', code, display: field }],
    },
    effectiveDateTime: effectiveDate,
    valueQuantity: value != null ? { value: Number(value), unit: unit || '1' } : undefined,
  };
}
