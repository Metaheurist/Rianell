import type Ionicons from '@expo/vector-icons/Ionicons';
import { buildWeatherDisplayMetrics } from '@rianell/shared';

type IonName = keyof typeof Ionicons.glyphMap;

const WEATHER_ICON_ION_MAP: Record<string, IonName> = {
  'weather-clear': 'sunny-outline',
  'weather-partly-cloudy': 'partly-sunny-outline',
  'weather-cloudy': 'cloudy-outline',
  'weather-fog': 'cloud-outline',
  'weather-rain': 'rainy-outline',
  'weather-snow': 'snow-outline',
  'weather-thunder': 'thunderstorm-outline',
  'weather-unknown': 'help-circle-outline',
  'weather-temp-cold': 'snow-outline',
  'weather-temp-mild': 'thermometer-outline',
  'weather-temp-warm': 'thermometer-outline',
  'weather-temp-hot': 'flame-outline',
  'weather-pressure': 'speedometer-outline',
  'weather-pressure-low': 'arrow-down-outline',
  'weather-pressure-high': 'arrow-up-outline',
  'weather-aqi-good': 'leaf-outline',
  'weather-aqi-moderate': 'alert-circle-outline',
  'weather-aqi-poor': 'warning-outline',
};

export function weatherIconIonName(iconId: string): IonName {
  return WEATHER_ICON_ION_MAP[iconId] || 'cloud-outline';
}

export type WeatherDisplayMetrics = NonNullable<ReturnType<typeof buildWeatherDisplayMetrics>>;

export function getWeatherDisplayMetrics(
  snapshot: {
    tempC?: number | null;
    pressureHpa?: number | null;
    usAqi?: number | null;
    weatherCode?: number | null;
  } | null | undefined,
): WeatherDisplayMetrics | null {
  return buildWeatherDisplayMetrics(snapshot);
}
