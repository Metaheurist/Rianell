import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LOINC_MAP, buildFhirObservation, parseORU, mapLabResultsToLogFields } from '@rianell/shared';

const root = join(import.meta.dirname, '..', '..');

test('LOINC_MAP includes mood and pain codes', () => {
  assert.equal(LOINC_MAP.mood, '72133-2');
  assert.equal(LOINC_MAP.pain, '38208-5');
});

test('buildFhirObservation returns Observation resource', () => {
  const obs = buildFhirObservation({
    patientId: 'p1',
    field: 'mood',
    value: 7,
    effectiveDate: '2026-06-01',
  });
  assert.equal(obs.resourceType, 'Observation');
  assert.equal(obs.code.coding[0].code, '72133-2');
});

test('parseORU extracts OBX values', () => {
  const msg = [
    'MSH|^~\\&|LAB|HOSP|||202606011200||ORU^R01|1|P|2.5',
    'PID|1||123',
    'OBR|1|||GLU^Glucose',
    'OBX|1|NM|GLU^Glucose||95|mg/dL|70-100|N|||202606011200',
  ].join('\r');
  const rows = parseORU(msg);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].testName, 'Glucose');
  assert.equal(rows[0].value, '95');
});

test('mapLabResultsToLogFields maps glucose', () => {
  const fields = mapLabResultsToLogFields([{ testName: 'Glucose', value: '110', units: 'mg/dL', referenceRange: '', observedAt: '' }]);
  assert.equal(fields.bloodGlucose, 110);
});

test('docker-compose defines pwa and server services', () => {
  const yml = readFileSync(join(root, 'docker-compose.yml'), 'utf8');
  assert.match(yml, /rianell-pwa/);
  assert.match(yml, /rianell-server/);
});

test('self-hosted README exists', () => {
  assert.ok(existsSync(join(root, 'docs/self-hosted/README.md')));
});

test('Python FHIR routes module exists', () => {
  assert.ok(existsSync(join(root, 'server/routes/fhir.py')));
  const handler = readFileSync(join(root, 'server/handler.py'), 'utf8');
  assert.match(handler, /FhirRoutesMixin/);
  assert.match(handler, /\/fhir\/r4/);
});

test('FHIR edge function exists', () => {
  assert.ok(existsSync(join(root, 'supabase/functions/fhir-r4/index.ts')));
});

test('Fasten Health connector doc exists', () => {
  assert.ok(existsSync(join(root, 'docs/connectors/fasten-health.md')));
});
