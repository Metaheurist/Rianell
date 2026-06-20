import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveConditionIconId,
  resolveTempIconId,
  resolvePressureIconId,
  resolveAqiIconId,
  resolveWeatherIconTone,
  buildWeatherDisplayMetrics,
} from '../../packages/shared/src/home/weatherIcons.mjs';
import { parseWeatherApiResponse } from '../../packages/shared/src/home/homeWeather.mjs';

test('resolveConditionIconId maps WMO codes', () => {
  assert.equal(resolveConditionIconId(0), 'weather-clear');
  assert.equal(resolveConditionIconId(2), 'weather-partly-cloudy');
  assert.equal(resolveConditionIconId(3), 'weather-cloudy');
  assert.equal(resolveConditionIconId(45), 'weather-fog');
  assert.equal(resolveConditionIconId(61), 'weather-rain');
  assert.equal(resolveConditionIconId(71), 'weather-snow');
  assert.equal(resolveConditionIconId(95), 'weather-thunder');
});

test('resolveTempIconId tiers temperature bands', () => {
  assert.equal(resolveTempIconId(0), 'weather-temp-cold');
  assert.equal(resolveTempIconId(12), 'weather-temp-mild');
  assert.equal(resolveTempIconId(24), 'weather-temp-warm');
  assert.equal(resolveTempIconId(30), 'weather-temp-hot');
});

test('resolvePressureIconId tiers pressure bands', () => {
  assert.equal(resolvePressureIconId(990), 'weather-pressure-low');
  assert.equal(resolvePressureIconId(1013), 'weather-pressure');
  assert.equal(resolvePressureIconId(1030), 'weather-pressure-high');
});

test('resolveAqiIconId tiers air quality', () => {
  assert.equal(resolveAqiIconId(25), 'weather-aqi-good');
  assert.equal(resolveAqiIconId(75), 'weather-aqi-moderate');
  assert.equal(resolveAqiIconId(150), 'weather-aqi-poor');
});

test('resolveWeatherIconTone maps semantic tiers', () => {
  assert.equal(resolveWeatherIconTone('weather-aqi-good'), 'success');
  assert.equal(resolveWeatherIconTone('weather-aqi-moderate'), 'warning');
  assert.equal(resolveWeatherIconTone('weather-aqi-poor'), 'danger');
  assert.equal(resolveWeatherIconTone('weather-temp-cold'), 'warning');
  assert.equal(resolveWeatherIconTone('weather-temp-mild'), 'default');
  assert.equal(resolveWeatherIconTone('weather-cloudy'), 'default');
});

test('buildWeatherDisplayMetrics returns condition + metric icons', () => {
  const display = buildWeatherDisplayMetrics({
    tempC: 18,
    pressureHpa: 1015,
    usAqi: 42,
    weatherCode: 0,
  });
  assert.ok(display);
  assert.equal(display.conditionIcon, 'weather-clear');
  assert.equal(display.metrics.length, 3);
  assert.equal(display.metrics[0].icon, 'weather-temp-mild');
  assert.equal(display.metrics[0].text, '18°C');
  assert.equal(display.metrics[2].icon, 'weather-aqi-good');
});

test('parseWeatherApiResponse includes weatherCode', () => {
  const snap = parseWeatherApiResponse(
    { current: { temperature_2m: 12.4, pressure_msl: 1012.2, weather_code: 2 } },
    { current: { us_aqi: 33 } },
  );
  assert.ok(snap);
  assert.equal(snap.weatherCode, 2);
  assert.equal(snap.tempC, 12.4);
});
