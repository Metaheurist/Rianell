import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hashMedicalConditionLabel,
  MEDICAL_CONDITION_POOL_SALT,
} from '../../../packages/shared/src/research/medicalConditionHash.mjs';

test('hashMedicalConditionLabel is deterministic and normalizes case', async () => {
  const a = await hashMedicalConditionLabel('Rheumatoid Arthritis');
  const b = await hashMedicalConditionLabel('rheumatoid arthritis');
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('hashMedicalConditionLabel uses pool salt', async () => {
  assert.ok(MEDICAL_CONDITION_POOL_SALT.includes('rianell'));
  assert.equal(await hashMedicalConditionLabel(''), '');
});
