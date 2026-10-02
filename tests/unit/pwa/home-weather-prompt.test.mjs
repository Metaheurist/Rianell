import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');

function fnBody(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' exists');
  const next = app.indexOf('\nfunction ', start + 10);
  return app.slice(start, next > 0 ? next : undefined);
}

test('weather prompt ignores taps while a location request is in flight', () => {
  const body = fnBody('enableHomeWeatherStrip');
  assert.match(body, /if \(_homeWeatherLocating\) return;/);
  assert.match(body, /setHomeWeatherPromptBusy\(true\)/);
  assert.match(body, /setHomeWeatherPromptBusy\(false\)/);
});

test('PERMISSION_DENIED is remembered and later taps open the city form', () => {
  const body = fnBody('enableHomeWeatherStrip');
  assert.match(body, /err\.code === 1/);
  assert.match(body, /appSettings\.weatherLocationDeniedAt = Date\.now\(\)/);
  assert.match(body, /appSettings\.weatherLocationDeniedAt && !options\.forceGeolocation[\s\S]*openHomeWeatherCityForm\(\)/);
});

test('city form validates input, uses geocoding helper and never injects user text as HTML', () => {
  const body = fnBody('openHomeWeatherCityForm');
  assert.match(body, /S\.sanitizePlaceQuery\(input\.value\)/);
  assert.match(body, /S\.geocodePlace\(q,/);
  assert.match(body, /errorEl\.textContent = /);
  assert.doesNotMatch(body, /innerHTML\s*[+]?=\s*[^;]*(input\.value|place\.name|\bq\b)/);
});

test('settings defaults include weather place + denial memory', () => {
  assert.match(app, /weatherPlaceName: null,/);
  assert.match(app, /weatherLocationDeniedAt: null,/);
});

test('CSP allows the Open-Meteo geocoding host', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const csp = html.match(/content="([^"]*connect-src[^"]*)"/i)[1];
  assert.match(csp, /connect-src[^;]*https:\/\/geocoding-api\.open-meteo\.com/);
});
