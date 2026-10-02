import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizePlaceQuery,
  buildGeocodingUrl,
  parseGeocodingResponse,
  geocodePlace,
  PLACE_QUERY_MAX_LENGTH,
} from '@rianell/shared';

test('sanitizePlaceQuery accepts real place names in any script', () => {
  assert.equal(sanitizePlaceQuery('  Manchester  '), 'Manchester');
  assert.equal(sanitizePlaceQuery('Saint-Étienne'), 'Saint-Étienne');
  assert.equal(sanitizePlaceQuery("Dún Laoghaire"), 'Dún Laoghaire');
  assert.equal(sanitizePlaceQuery('São Paulo'), 'São Paulo');
  assert.equal(sanitizePlaceQuery('תל אביב'), 'תל אביב');
  assert.equal(sanitizePlaceQuery('القاهرة'), 'القاهرة');
  assert.equal(sanitizePlaceQuery("Bishop's Stortford"), "Bishop's Stortford");
  assert.equal(sanitizePlaceQuery('Frankfurt (Oder)'), 'Frankfurt (Oder)');
  assert.equal(sanitizePlaceQuery('New   York'), 'New York');
});

test('sanitizePlaceQuery rejects markup, URLs, control chars and bad lengths', () => {
  for (const bad of [
    '',
    'a',
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    'https://evil.example',
    'Paris; DROP TABLE',
    'Lon\u0000don',
    'x'.repeat(PLACE_QUERY_MAX_LENGTH + 1),
    '-Leeds',
    null,
    42,
  ]) {
    assert.equal(sanitizePlaceQuery(bad), null, `rejects ${JSON.stringify(bad)}`);
  }
});

test('buildGeocodingUrl targets the geocoding host with an encoded query and safe language', () => {
  const url = new URL(buildGeocodingUrl('São Paulo', 'pt'));
  assert.equal(url.origin, 'https://geocoding-api.open-meteo.com');
  assert.equal(url.pathname, '/v1/search');
  assert.equal(url.searchParams.get('name'), 'São Paulo');
  assert.equal(url.searchParams.get('count'), '1');
  assert.equal(url.searchParams.get('language'), 'pt');
  assert.equal(new URL(buildGeocodingUrl('Leeds', 'en&x=1')).searchParams.get('language'), 'en');
  assert.equal(buildGeocodingUrl('<b>'), null);
});

test('parseGeocodingResponse keeps a label and rounded coordinates only', () => {
  const place = parseGeocodingResponse({
    results: [{ name: 'Manchester', admin1: 'England', country: 'United Kingdom', latitude: 53.48095, longitude: -2.23743, population: 395515, timezone: 'Europe/London' }],
  });
  assert.deepEqual(place, { name: 'Manchester, England, United Kingdom', lat: 53.48, lon: -2.24 });
  assert.deepEqual(parseGeocodingResponse({ results: [{ name: 'Monaco', admin1: 'Monaco', country: 'Monaco', latitude: 43.73, longitude: 7.42 }] }).name, 'Monaco');
  assert.equal(parseGeocodingResponse({}), null);
  assert.equal(parseGeocodingResponse({ results: [] }), null);
  assert.equal(parseGeocodingResponse({ results: [{ name: 'Nowhere', latitude: 200, longitude: 0 }] }), null);
  assert.equal(parseGeocodingResponse({ results: [{ name: 'X', latitude: '53', longitude: '-2' }] }), null);
  assert.equal(parseGeocodingResponse({ results: [{ latitude: 1, longitude: 1 }] }), null);
});

test('geocodePlace never fetches for invalid input and fails closed on errors', async () => {
  const calls = [];
  const okFetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ results: [{ name: 'Leeds', country: 'United Kingdom', latitude: 53.8, longitude: -1.55 }] }) };
  };
  assert.deepEqual(await geocodePlace('Leeds', { fetchFn: okFetch, language: 'en' }), { name: 'Leeds, United Kingdom', lat: 53.8, lon: -1.55 });
  assert.equal(calls.length, 1);
  assert.equal(await geocodePlace('<img>', { fetchFn: okFetch }), null);
  assert.equal(calls.length, 1, 'invalid query is not sent');
  assert.equal(await geocodePlace('Leeds', { fetchFn: async () => ({ ok: false }) }), null);
  assert.equal(await geocodePlace('Leeds', { fetchFn: async () => { throw new Error('csp'); } }), null);
});
