import { Platform } from 'react-native';
import { getFeatureAvailability, prefsToConsents, shouldAllowNetworkOperation } from '@rianell/shared';
import type { Preferences } from '../storage/preferences';

const PROJECT_KEY = 'c205987c47aef0b2da2a93569620b15a81bef013';

type SmartlookModule = {
  instance: {
    preferences: { setProjectKey: (key: string) => void };
    start: () => void;
    stop: () => void;
  };
};

let smartlookModule: SmartlookModule | null | undefined;
let started = false;

function getSmartlook(): SmartlookModule | null {
  if (Platform.OS === 'web') return null;
  if (smartlookModule !== undefined) return smartlookModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    smartlookModule = require('react-native-smartlook-analytics').default as SmartlookModule;
  } catch {
    smartlookModule = null;
  }
  return smartlookModule;
}

export function shouldEnableSessionRecording(prefs: Preferences): boolean {
  if (prefs.demoMode) return false;
  if (prefs.sessionRecording !== true) return false;
  if (!shouldAllowNetworkOperation(prefs, 'sessionRecording')) return false;
  const regionId = prefs.privacyRegion || 'other';
  const avail = getFeatureAvailability(regionId, 'sessionRecording', prefsToConsents(prefs));
  return avail.available === true;
}

export function applySessionRecording(prefs: Preferences): void {
  const sl = getSmartlook();
  if (!sl) return;
  if (!shouldEnableSessionRecording(prefs)) {
    if (started) {
      try {
        sl.instance.stop();
      } catch {
        /* native module optional */
      }
      started = false;
    }
    return;
  }
  try {
    sl.instance.preferences.setProjectKey(PROJECT_KEY);
    if (!started) {
      sl.instance.start();
      started = true;
    }
  } catch {
    /* Expo Go / missing native build */
  }
}
