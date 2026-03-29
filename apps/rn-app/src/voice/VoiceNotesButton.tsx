import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';
import { Permissions } from '../permissions/permissions';

const DEFAULT_LOCALE = Platform.select({ ios: 'en-GB', android: 'en-GB', default: 'en-GB' }) ?? 'en-GB';

type Props = {
  /** Current field text; snapshotted when dictation starts (matches web `voiceBaseValue`). */
  value: string;
  onChangeText: (next: string) => void;
  accent: string;
  textColor: string;
  accessibilityLabel?: string;
};

/**
 * Mic control for speech-to-text on a text field. Requests microphone permission (via expo-av)
 * before starting native recognition - required on Android where RECORD_AUDIO must be granted first.
 */
export function VoiceNotesButton({ value, onChangeText, accent, textColor, accessibilityLabel = 'Voice input' }: Props) {
  const [listening, setListening] = useState(false);
  const baseRef = useRef('');
  const onChangeTextRef = useRef(onChangeText);
  onChangeTextRef.current = onChangeText;

  const stop = useCallback(async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  useSpeechRecognitionEvent('result', (e: ExpoSpeechRecognitionResultEvent) => {
    const t = (e.results[0]?.transcript ?? '').trim();
    if (!e.isFinal) {
      const merged = `${baseRef.current}${baseRef.current && t ? ' ' : ''}${t}`.trim();
      onChangeTextRef.current(merged);
      return;
    }
    if (!t) return;
    const merged = `${baseRef.current}${baseRef.current && t ? ' ' : ''}${t}`.trim();
    onChangeTextRef.current(merged);
    baseRef.current = merged;
  });

  useSpeechRecognitionEvent('error', (err: ExpoSpeechRecognitionErrorEvent) => {
    if (err.error === 'aborted') {
      setListening(false);
      return;
    }
    const msg = err.message ?? '';
    if (/cancel|abort/i.test(msg)) {
      setListening(false);
      return;
    }
    Alert.alert('Voice input', msg || 'Speech recognition failed.');
    setListening(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const onPress = async () => {
    if (listening) {
      await stop();
      return;
    }

    const status = await Permissions.request('microphone');
    if (status !== 'granted') {
      Alert.alert(
        'Voice input',
        'Microphone permission is required for speech-to-text. Allow access in system settings and try again.'
      );
      return;
    }

    const speechPerm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!speechPerm.granted) {
      Alert.alert(
        'Voice input',
        'Speech recognition permission is required. Allow access in system settings and try again.'
      );
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch {
      /* recognition may still work */
    }

    baseRef.current = value.trimEnd();

    try {
      ExpoSpeechRecognitionModule.start({
        lang: DEFAULT_LOCALE,
        interimResults: true,
        maxAlternatives: 1,
        // continuous mode is not supported on Android 12 and below; false still yields interim + final results until end-of-utterance.
        continuous: false,
      });
      setListening(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start speech recognition.';
      Alert.alert('Voice input', msg);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => void onPress()}
        style={({ pressed }) => [
          styles.btn,
          { borderColor: accent, opacity: pressed ? 0.85 : 1 },
          listening && { backgroundColor: 'rgba(123, 223, 140, 0.22)' },
        ]}
        accessibilityRole="button"
        accessibilityLabel={listening ? `${accessibilityLabel}, listening` : accessibilityLabel}
        accessibilityState={{ busy: listening }}
      >
        <Ionicons name={listening ? 'mic' : 'mic-outline'} size={22} color={listening ? accent : textColor} />
        <Text style={[styles.hint, { color: textColor }]}>{listening ? 'Stop' : 'Voice'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', marginBottom: 8 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  hint: { fontSize: 13, fontWeight: '600' },
});
