import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLogEntry,
  normalizeVitalMetrics,
  computeBmiKg,
  mmolToMgdl,
  mgdlToMmol,
  lbsToKg,
  PAIN_REGIONS,
} from '@rianell/shared';

test('normalizeVitalMetrics clamps blood pressure', () => {
  const v = normalizeVitalMetrics({ bloodPressureSystolic: 500, bloodPressureDiastolic: 10 });
  assert.equal(v?.bloodPressureSystolic, 250);
  assert.equal(v?.bloodPressureDiastolic, 40);
});

test('normalizeVitalMetrics stores glucose as mmol/L', () => {
  const v = normalizeVitalMetrics({ bloodGlucose: 126, bloodGlucoseUnit: 'mgdl' });
  assert.ok(v?.bloodGlucose);
  assert.equal(v?.bloodGlucoseUnit, 'mmol');
  assert.ok(Math.abs(v.bloodGlucose - mgdlToMmol(126)) < 0.1);
});

test('normalizeVitalMetrics stores weight as kg', () => {
  const v = normalizeVitalMetrics({ bodyWeight: 150, bodyWeightUnit: 'lbs' });
  assert.equal(v?.bodyWeightUnit, 'kg');
  assert.ok(Math.abs(v.bodyWeight - lbsToKg(150)) < 0.1);
});

test('normalizeVitalMetrics validates bristol scale', () => {
  assert.equal(normalizeVitalMetrics({ bristol: 0 })?.bristol, undefined);
  assert.equal(normalizeVitalMetrics({ bristol: 4 })?.bristol, 4);
  assert.equal(normalizeVitalMetrics({ bristol: 9 })?.bristol, undefined);
});

test('normalizeVitalMetrics normalizes pain locations', () => {
  const v = normalizeVitalMetrics({
    painLocations: [{ region: 'lower-back', intensity: 7 }, { region: 'invalid', intensity: 3 }],
  });
  assert.equal(v?.painLocations?.length, 1);
  assert.equal(v?.painLocations?.[0]?.region, 'lower-back');
});

test('normalizeLogEntry includes plan 16 vital fields', () => {
  const entry = normalizeLogEntry({
    date: '2026-06-26',
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    spO2: 98,
    gratitude: 'Quiet morning',
    supplements: [{ name: 'Magnesium', dose: '200', unit: 'mg' }],
  });
  assert.equal(entry.bloodPressureSystolic, 120);
  assert.equal(entry.spO2, 98);
  assert.equal(entry.gratitude, 'Quiet morning');
  assert.equal(entry.supplements?.[0]?.name, 'Magnesium');
});

test('computeBmiKg from weight and height', () => {
  const bmi = computeBmiKg(70, 175);
  assert.ok(bmi && bmi > 20 && bmi < 25);
});

test('PAIN_REGIONS includes minimum body map regions', () => {
  assert.ok(PAIN_REGIONS.has('lower-back'));
  assert.ok(PAIN_REGIONS.has('head'));
  assert.equal(PAIN_REGIONS.size, 15);
});

test('glucose unit conversion helpers', () => {
  assert.ok(Math.abs(mmolToMgdl(5.5) - 99.1) < 0.2);
});

test('painBodyStateToLocations maps legacy regions', async () => {
  const { painBodyStateToLocations } = await import('@rianell/shared');
  const locs = painBodyStateToLocations({ head: 2, left_knee: 1 });
  assert.ok(locs?.length >= 2);
  assert.ok(locs?.some((x) => x.region === 'head'));
});

test('normalizeVitalMetrics accepts health-photos storage paths', () => {
  const v = normalizeVitalMetrics({
    photoAttachments: [{ url: 'health-photos/user-id/photo.jpg' }],
  });
  assert.equal(v?.photoAttachments?.[0]?.url, 'health-photos/user-id/photo.jpg');
});
