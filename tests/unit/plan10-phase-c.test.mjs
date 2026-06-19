import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGoodDayStreak,
  computeFlareFreeDays,
  computeHomeStreakSnapshot,
  daysUntilAppointment,
  shouldShowAppointmentCard,
  appointmentCountdownLabelKey,
  normalizeWeatherCoords,
  parseWeatherApiResponse,
  isWeatherCacheFresh,
} from '@rianell/shared';

const LOGS = [
  { date: '2026-06-16', flare: 'No', mood: 7 },
  { date: '2026-06-17', flare: 'No', mood: 8 },
  { date: '2026-06-18', flare: 'Yes', mood: 5 },
  { date: '2026-06-19', flare: 'No', mood: 6 },
];

test('computeGoodDayStreak counts recent good days', () => {
  assert.equal(computeGoodDayStreak(LOGS), 1);
});

test('computeFlareFreeDays counts from latest log backward', () => {
  assert.equal(computeFlareFreeDays(LOGS), 1);
});

test('computeHomeStreakSnapshot hides when dismissed', () => {
  const snap = computeHomeStreakSnapshot(LOGS, { dismissed: true });
  assert.equal(snap.showCard, false);
});

test('appointment countdown within 14 days', () => {
  assert.equal(daysUntilAppointment('2026-06-25', '2026-06-19'), 6);
  assert.equal(shouldShowAppointmentCard('2026-06-25', '2026-06-19'), true);
  assert.equal(shouldShowAppointmentCard('2026-07-20', '2026-06-19'), false);
});

test('appointmentCountdownLabelKey maps today and tomorrow', () => {
  assert.equal(appointmentCountdownLabelKey(0), 'home.appointment.today');
  assert.equal(appointmentCountdownLabelKey(1), 'home.appointment.tomorrow');
  assert.equal(appointmentCountdownLabelKey(5), 'home.appointment.inDays');
});

test('parseWeatherApiResponse extracts pressure and AQI', () => {
  const snap = parseWeatherApiResponse(
    { current: { temperature_2m: 18.4, pressure_msl: 1012.2 } },
    { current: { us_aqi: 42 } }
  );
  assert.ok(snap);
  assert.equal(snap.tempC, 18.4);
  assert.equal(snap.pressureHpa, 1012);
  assert.equal(snap.usAqi, 42);
  assert.ok(isWeatherCacheFresh(snap));
});

test('normalizeWeatherCoords rounds to two decimals', () => {
  const c = normalizeWeatherCoords(51.12345, -0.98765);
  assert.deepEqual(c, { lat: 51.12, lon: -0.99 });
});
