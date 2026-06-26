/** Plan 06 D4 — FHIR R4-lite Observation bundle for key daily metrics. */

const METRIC_CODES = {
  mood: { system: 'http://loinc.org', code: '80296-7', display: 'Mood' },
  sleep: { system: 'http://loinc.org', code: '93832-4', display: 'Sleep duration' },
  fatigue: { system: 'http://loinc.org', code: '75826-7', display: 'Fatigue' },
  bpm: { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
  weight: { system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
  bodyWeight: { system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
  bloodPressureSystolic: { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
  bloodPressureDiastolic: { system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' },
  bloodGlucose: { system: 'http://loinc.org', code: '2339-0', display: 'Glucose' },
  spO2: { system: 'http://loinc.org', code: '59408-5', display: 'Oxygen saturation' },
  hrv: { system: 'http://loinc.org', code: '80404-7', display: 'HRV RMSSD' },
  bbt: { system: 'http://loinc.org', code: '8310-5', display: 'Basal body temperature' },
};

const METRIC_UNITS = {
  weight: 'kg',
  bodyWeight: 'kg',
  bpm: '/min',
  bloodPressureSystolic: 'mmHg',
  bloodPressureDiastolic: 'mmHg',
  bloodGlucose: 'mmol/L',
  spO2: '%',
  hrv: 'ms',
  bbt: 'Cel',
};

function observationFor(log, field, value) {
  const coding = METRIC_CODES[field];
  if (!coding || value === undefined || value === null || value === '') return null;
  const num = Number(value);
  const isNum = Number.isFinite(num);
  return {
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
    code: { coding: [coding] },
    subject: { display: 'Rianell user' },
    effectiveDateTime: `${log.date}T12:00:00Z`,
    valueQuantity: isNum
      ? { value: num, unit: METRIC_UNITS[field] || '{score}' }
      : undefined,
    valueString: isNum ? undefined : String(value),
  };
}

export function logToFhirObservations(log) {
  if (!log || !log.date) return [];
  const out = [];
  for (const field of Object.keys(METRIC_CODES)) {
    const obs = observationFor(log, field, log[field]);
    if (obs) out.push(obs);
  }
  if (log.notes) {
    out.push({
      resourceType: 'Observation',
      status: 'final',
      code: { text: 'Daily notes' },
      effectiveDateTime: `${log.date}T12:00:00Z`,
      valueString: String(log.notes).slice(0, 2000),
    });
  }
  return out;
}

export function logsToFhirBundle(logs) {
  const entries = [];
  const list = Array.isArray(logs) ? logs : [];
  for (const log of list) {
    for (const obs of logToFhirObservations(log)) {
      entries.push({ fullUrl: `urn:uuid:rianell-${log.date}-${obs.code?.coding?.[0]?.code || 'note'}`, resource: obs });
    }
  }
  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: entries,
  };
}
