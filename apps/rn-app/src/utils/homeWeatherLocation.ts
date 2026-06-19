import { Platform } from 'react-native';

/** Opt-in coarse coords for Open-Meteo (Plan 10 H5). */
export async function requestWeatherCoords(): Promise<{ lat: number; lon: number } | null> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
      );
    });
  }
  try {
    // Optional native module — graceful when not linked in a given build.
    const Location = require('expo-location') as {
      requestForegroundPermissionsAsync: () => Promise<{ status: string }>;
      getCurrentPositionAsync: (opts: { accuracy: number }) => Promise<{ coords: { latitude: number; longitude: number } }>;
      Accuracy: { Balanced: number };
    };
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    return null;
  }
}
