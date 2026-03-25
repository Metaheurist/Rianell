import * as Speech from 'expo-speech';

export type TtsOptions = {
  enabled: boolean;
  readModeEnabled: boolean;
};

export function speakLabel(label: string, opts: TtsOptions) {
  if (!opts.enabled) return;
  const text = (label || '').trim();
  if (!text) return;
  try {
    Speech.stop();
  } catch {
    // ignore
  }
  Speech.speak(text, {
    rate: 1,
    pitch: 1,
    volume: 1,
  });
}

