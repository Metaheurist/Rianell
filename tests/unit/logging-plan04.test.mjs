import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLogEntry,
  normalizeLogFavorites,
  addLogFavorite,
  normalizeSymptomTemplates,
  getSymptomChipsForCondition,
  normalizeMedSchedule,
  buildTodayMedDoseStatuses,
  getUnlockedLogCategories,
  shouldShowWizardCategory,
  extractLogFieldsFromVoiceTranscript,
  formatBarcodeFoodLabel,
  mergeLogEntriesForDate,
} from '@rianell/shared';

test('normalizeLogEntry preserves plan 04 extensions', () => {
  const entry = normalizeLogEntry({
    date: '2026-06-18',
    subEntries: [{ period: 'AM', mood: 6, notes: 'Morning check-in' }],
    cycle: { cycleDay: 12, phase: 'follicular', flow: 'light' },
    medicationDoses: [{ drug: 'Ibuprofen', status: 'taken', scheduledAt: '2026-06-18T08:00' }],
  });
  assert.equal(entry.subEntries?.length, 1);
  assert.equal(entry.cycle?.cycleDay, 12);
  assert.equal(entry.medicationDoses?.[0]?.status, 'taken');
});

test('mergeLogEntriesForDate merges sub-entries by id', () => {
  const merged = mergeLogEntriesForDate(
    { date: '2026-06-18', subEntries: [{ id: 'a', period: 'AM', mood: 4 }] },
    { date: '2026-06-18', subEntries: [{ id: 'b', period: 'PM', mood: 7 }] },
  );
  assert.equal(merged.subEntries.length, 2);
});

test('log favorites normalize and dedupe', () => {
  const fav = addLogFavorite(normalizeLogFavorites(null), 'meals', 'Oats');
  assert.deepEqual(fav.meals, ['Oats']);
  const again = addLogFavorite(fav, 'meals', 'oats');
  assert.equal(again.meals.length, 1);
});

test('symptom templates resolve condition chips', () => {
  const templates = normalizeSymptomTemplates([{ condition: 'Fibromyalgia', chips: ['Brain fog', 'Stiffness'] }]);
  const chips = getSymptomChipsForCondition(templates, 'Fibromyalgia');
  assert.deepEqual(chips, ['Brain fog', 'Stiffness']);
});

test('med schedule builds today dose statuses', () => {
  const schedule = normalizeMedSchedule([{ id: 'rx1', drug: 'Med A', times: ['08:00'], enabled: true }]);
  const doses = buildTodayMedDoseStatuses(schedule, '2026-06-18');
  assert.equal(doses.length, 1);
  assert.equal(doses[0].status, 'pending');
});

test('progressive tracking unlocks categories over time', () => {
  const profile = { configuredAt: new Date(Date.now() - 86400000 * 10).toISOString(), fields: { mood: true, pain: true, notes: true, sleep: true, fatigue: true } };
  const unlocked = getUnlockedLogCategories(profile);
  assert.ok(unlocked.includes('core'));
  assert.ok(unlocked.includes('food'));
  assert.equal(shouldShowWizardCategory(profile, 'medications'), false);
});

test('voice extract maps wellness transcript fields', () => {
  const fields = extractLogFieldsFromVoiceTranscript('Feeling low today, fatigue level 8, pain level 6');
  assert.equal(fields.fatigue, 8);
  assert.equal(fields.jointPain, 6);
  assert.match(fields.notes, /low/i);
});

test('barcode food label formats product', () => {
  assert.equal(formatBarcodeFoodLabel({ brand: 'Brand', name: 'Bar' }), 'Brand — Bar');
});
