import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import Voice from '@react-native-voice/voice';
import { Permissions } from '../permissions/permissions';

const DEFAULT_LOCALE = Platform.select({ ios: 'en-US', android: 'en-US', default: 'en-US' }) ?? 'en-US';

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
 * before starting native recognition — required on Android where RECORD_AUDIO must be granted first.
 */
export function VoiceNotesButton({ value, onChangeText, accent, textColor, accessibilityLabel = 'Voice input' }: Props) {
  const [listening, setListening] = useState(false);
  const baseRef = useRef('');
  const onChangeTextRef = useRef(onChangeText);
  onChangeTextRef.current = onChangeText;

  const stop = useCallback(async () => {
    try {
      await Voice.stop();
    } catch {
      /* ignore */
    }
    try {
      await Voice.cancel();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  useEffect(() => {
    Voice.onSpeechPartialResults = (e) => {
      const t = e.value?.[0] ?? '';
      const merged = `${baseRef.current}${baseRef.current && t.trim() ? ' ' : ''}${t}`.trim();
      onChangeTextRef.current(merged);
    };
    Voice.onSpeechResults = (e) => {
      const t = (e.value?.[0] ?? '').trim();
      if (!t) return;
      const merged = `${baseRef.current}${baseRef.current && t ? ' ' : ''}${t}`.trim();
      onChangeTextRef.current(merged);
      baseRef.current = merged;
    };
    Voice.onSpeechError = (e) => {
      const code = e.error?.code;
      const msg = e.error?.message ?? '';
      if (code === '7' || /cancel|abort/i.test(msg)) {
        setListening(false);
        return;
      }
      Alert.alert('Voice input', msg || 'Speech recognition failed.');
      setListening(false);
    };
    Voice.onSpeechEnd = () => setListening(false);

    return () => {
      void Voice.destroy().then(() => Voice.removeAllListeners());
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

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch {
      /* Voice may still work */
    }

    baseRef.current = value.trimEnd();

    try {
      await Voice.start(DEFAULT_LOCALE);
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
