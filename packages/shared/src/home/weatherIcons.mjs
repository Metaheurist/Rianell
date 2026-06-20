/** Home weather strip — WMO / metric icon ids (pair with PWA `#icon-{id}` sprites). */

/** @param {number | null | undefined} weatherCode Open-Meteo WMO code */
export function resolveConditionIconId(weatherCode) {
  const code = typeof weatherCode === 'number' && Number.isFinite(weatherCode) ? weatherCode : null;
  if (code == null) return 'weather-unknown';
  if (code === 0) return 'weather-clear';
  if (code === 1 || code === 2) return 'weather-partly-cloudy';
  if (code === 3) return 'weather-cloudy';
  if (code === 45 || code === 48) return 'weather-fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'weather-rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'weather-snow';
  if (code >= 95 && code <= 99) return 'weather-thunder';
  return 'weather-cloudy';
}

/** @param {number | null | undefined} tempC */
export function resolveTempIconId(tempC) {
  if (typeof tempC !== 'number' || !Number.isFinite(tempC)) return 'weather-temp-mild';
  if (tempC < 5) return 'weather-temp-cold';
  if (tempC < 20) return 'weather-temp-mild';
  if (tempC < 28) return 'weather-temp-warm';
  return 'weather-temp-hot';
}

/** @param {number | null | undefined} pressureHpa */
export function resolvePressureIconId(pressureHpa) {
  if (typeof pressureHpa !== 'number' || !Number.isFinite(pressureHpa)) return 'weather-pressure';
  if (pressureHpa < 1000) return 'weather-pressure-low';
  if (pressureHpa > 1020) return 'weather-pressure-high';
  return 'weather-pressure';
}

/** @param {number | null | undefined} usAqi */
export function resolveAqiIconId(usAqi) {
  if (typeof usAqi !== 'number' || !Number.isFinite(usAqi)) return 'weather-aqi-moderate';
  if (usAqi <= 50) return 'weather-aqi-good';
  if (usAqi <= 100) return 'weather-aqi-moderate';
  return 'weather-aqi-poor';
}

/**
 * @param {{ tempC?: number | null, pressureHpa?: number | null, usAqi?: number | null, weatherCode?: number | null } | null | undefined} snapshot
 * @returns {{ conditionIcon: string, metrics: Array<{ key: string, icon: string, text: string }> } | null}
 */
export function buildWeatherDisplayMetrics(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const metrics = [];
  if (snapshot.tempC != null) {
    metrics.push({
      key: 'temp',
      icon: resolveTempIconId(snapshot.tempC),
      text: `${snapshot.tempC}°C`,
    });
  }
  if (snapshot.pressureHpa != null) {
    metrics.push({
      key: 'pressure',
      icon: resolvePressureIconId(snapshot.pressureHpa),
      text: `${snapshot.pressureHpa} hPa`,
    });
  }
  if (snapshot.usAqi != null) {
    metrics.push({
      key: 'aqi',
      icon: resolveAqiIconId(snapshot.usAqi),
      text: `AQI ${snapshot.usAqi}`,
    });
  }
  if (!metrics.length) return null;
  return {
    conditionIcon: resolveConditionIconId(snapshot.weatherCode),
    metrics,
  };
}
