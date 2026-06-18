import test from 'node:test';
import assert from 'node:assert/strict';
import { logsToFhirBundle } from '../../packages/shared/src/export/fhirLite.mjs';

test('logsToFhirBundle produces Observation resources', () => {
  const bundle = logsToFhirBundle([
    { date: '2026-06-18', mood: 3, fatigue: 4 },
  ]);
  assert.equal(bundle.resourceType, 'Bundle');
  assert.ok(bundle.entry.length >= 1);
  const obs = bundle.entry.find((e) => e.resource?.resourceType === 'Observation');
  assert.ok(obs);
  assert.equal(obs.resource.status, 'final');
});
