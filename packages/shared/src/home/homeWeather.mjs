/** Plan 10 H5 — Open-Meteo weather / air-quality strip (no API key). */

export const WEATHER_CACHE_MS = 60 * 60 * 1000;

export function roundWeatherCoord(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

export function normalizeWeatherCoords(lat, lon) {
  const la = roundWeatherCoord(lat);
  const lo = roundWeatherCoord(lon);
  if (la == null || lo == null) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return { lat: la, lon: lo };
}

export function buildWeatherForecastUrl(lat, lon) {
  const coords = normalizeWeatherCoords(lat, lon);
  if (!coords) return null;
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: 'pressure_msl,temperature_2m,weather_code',
    timezone: 'auto',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function buildAirQualityUrl(lat, lon) {
  const coords = normalizeWeatherCoords(lat, lon);
  if (!coords) return null;
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: 'us_aqi',
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
}

export function parseWeatherApiResponse(forecastJson, aqiJson) {
  const current = forecastJson?.current;
  if (!current || typeof current !== 'object') return null;
  const temp =
    typeof current.temperature_2m === 'number' ? Number(current.temperature_2m.toFixed(1)) : null;
  const pressure =
    typeof current.pressure_msl === 'number' ? Math.round(current.pressure_msl) : null;
  const usAqi =
    aqiJson?.current && typeof aqiJson.current.us_aqi === 'number'
      ? Math.round(aqiJson.current.us_aqi)
      : null;
  const weatherCode =
    typeof current.weather_code === 'number' ? Math.round(current.weather_code) : null;
  if (temp == null && pressure == null && usAqi == null) return null;
  return {
    tempC: temp,
    pressureHpa: pressure,
    usAqi,
    weatherCode,
    fetchedAt: Date.now(),
  };
}

export function isWeatherCacheFresh(cache, maxAgeMs = WEATHER_CACHE_MS) {
  if (!cache || typeof cache !== 'object') return false;
  const at = cache.fetchedAt;
  return typeof at === 'number' && Date.now() - at < maxAgeMs;
}

/**
 * @param {number} lat
 * @param {number} lon
 * @param {{ fetchFn?: typeof fetch }} [options]
 */
export async function fetchHomeWeatherSnapshot(lat, lon, options = {}) {
  const coords = normalizeWeatherCoords(lat, lon);
  if (!coords) return null;
  const fetchFn = options.fetchFn || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (!fetchFn) return null;
  const forecastUrl = buildWeatherForecastUrl(coords.lat, coords.lon);
  const aqiUrl = buildAirQualityUrl(coords.lat, coords.lon);
  if (!forecastUrl) return null;
  let forecastJson = null;
  try {
    const forecastRes = await fetchFn(forecastUrl);
    if (!forecastRes?.ok) return null;
    forecastJson = await forecastRes.json();
  } catch {
    return null;
  }
  let aqiJson = null;
  if (aqiUrl) {
    try {
      const aqiRes = await fetchFn(aqiUrl);
      if (aqiRes?.ok) aqiJson = await aqiRes.json();
    } catch {
      aqiJson = null;
    }
  }
  return parseWeatherApiResponse(forecastJson, aqiJson);
}
