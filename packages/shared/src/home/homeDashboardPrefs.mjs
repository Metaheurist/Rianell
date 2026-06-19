import { roundWeatherCoord } from './homeWeather.mjs';
import { parseAppointmentDate } from './homeAppointment.mjs';
import { normalizeTreatmentStarts } from '../clinician/medTimeline.mjs';

export function normalizeHomeDashboardPrefs(raw) {
  const v = raw && typeof raw === 'object' ? raw : {};
  const lat = roundWeatherCoord(v.weatherLat);
  const lon = roundWeatherCoord(v.weatherLon);
  let weatherCache = null;
  if (v.weatherCache && typeof v.weatherCache === 'object') {
    weatherCache = v.weatherCache;
  } else if (typeof v.weatherCacheJson === 'string' && v.weatherCacheJson) {
    try {
      weatherCache = JSON.parse(v.weatherCacheJson);
    } catch {
      weatherCache = null;
    }
  }
  return {
    homeStreakCardDismissed: v.homeStreakCardDismissed === true,
    weatherStripEnabled: v.weatherStripEnabled === true,
    weatherLat: lat,
    weatherLon: lon,
    weatherCache,
    nextAppointmentDate: parseAppointmentDate(v.nextAppointmentDate),
    treatmentStarts: normalizeTreatmentStarts(v.treatmentStarts),
    homeGapQuestionCache:
      v.homeGapQuestionCache && typeof v.homeGapQuestionCache === 'object'
        ? v.homeGapQuestionCache
        : null,
    homeQuestionAnswerState:
      v.homeQuestionAnswerState && typeof v.homeQuestionAnswerState === 'object'
        ? v.homeQuestionAnswerState
        : null,
  };
}
