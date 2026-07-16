import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { getTokens } from '@rianell/tokens';
import type { Preferences } from '../storage/preferences';
import {
  getAiModelDownloadConsent,
  preloadNativeLlm,
  resolveNativeModelId,
  setAiModelDownloadConsent,
  subscribeNativeLlmDownloadProgress,
  type LlmDownloadProgress,
} from '../ai/llmNative';
import { recordProcessingActivity } from '../storage/processingActivity';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
  children: React.ReactNode;
};

type GatePhase = 'idle' | 'consent' | 'downloading' | 'ready';

export function AiModelDownloadGate({ prefs, onChangePrefs, children }: Props) {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const tokens = useMemo(
    () => getTokens({ team: prefs.team, mode: scheme, colorblindMode: prefs.accessibility.colorblindMode }),
    [prefs.team, scheme, prefs.accessibility.colorblindMode]
  );
  const [phase, setPhase] = useState<GatePhase>('idle');
  const [progress, setProgress] = useState<LlmDownloadProgress>({ pct: 0, status: 'idle' });
  const [fileLabel, setFileLabel] = useState('');

  const aiEnabled = prefs.aiEnabled !== false;

  const grantConsent = () => {
    void setAiModelDownloadConsent('granted');
    onChangePrefs({ ...prefs, aiModelDownloadConsent: 'granted' });
  };

  const downloadStartedRef = useRef(false);

  useEffect(() => {
    if (!aiEnabled) {
      setPhase('ready');
      return;
    }
    let cancelled = false;
    void (async () => {
      const { shouldAllowAiModelDownload, shouldAllowNetworkOperation } = await import('@rianell/shared');
      const allow = typeof shouldAllowAiModelDownload === 'function'
        ? shouldAllowAiModelDownload(prefs)
        : shouldAllowNetworkOperation(prefs, 'modelDownload');
      if (!allow) {
        setPhase('ready');
        return;
      }
      const consent = prefs.aiModelDownloadConsent === 'granted'
        ? 'granted'
        : await getAiModelDownloadConsent();
      if (cancelled) return;
      if (consent !== 'granted') {
        downloadStartedRef.current = false;
        setPhase('consent');
        return;
      }
      if (downloadStartedRef.current) return;
      downloadStartedRef.current = true;
      setPhase('downloading');
      setProgress({ pct: 0, status: 'downloading' });
      const modelId = resolveNativeModelId(prefs);
      setFileLabel(modelId.split('/').pop() || 'model');
      try {
        await preloadNativeLlm(prefs);
        if (!cancelled) {
          await recordProcessingActivity(prefs, { type: 'model_download', detail: modelId }, onChangePrefs);
          setProgress({ pct: 100, status: 'ready' });
          setPhase('ready');
        }
      } catch {
        if (!cancelled) {
          setProgress({ pct: 0, status: 'error' });
          setPhase('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aiEnabled, prefs, prefs.aiModelDownloadConsent]);

  useEffect(() => {
    if (phase !== 'downloading') return;
    return subscribeNativeLlmDownloadProgress((p) => {
      setProgress(p);
      if (p.file) setFileLabel(p.file);
    });
  }, [phase]);

  if (!aiEnabled || phase === 'ready') {
    return <>{children}</>;
  }

  const pct = Math.max(0, Math.min(100, progress.pct || 0));
  const cardBg = scheme === 'light' ? '#ffffff' : tokens.color.surface ?? '#1a1f1e';
  const border = scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={() => {}}>
      <View style={[styles.root, { backgroundColor: tokens.color.background as string }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          {phase === 'consent' ? (
            <>
              <Text style={[styles.title, { color: tokens.color.text }]}>Download on-device AI model?</Text>
              <Text style={[styles.body, { color: tokens.color.textMuted }]}>
                Download the AI model for summaries, note suggestions, and daily quotes. Wi-Fi recommended.
              </Text>
              <Text style={[styles.hint, { color: tokens.color.textMuted }]}>
                The model stays on this device. Remove it anytime in Settings → Performance.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={grantConsent}
                style={[styles.primaryBtn, { backgroundColor: tokens.color.primary }]}
              >
                <Text style={styles.primaryBtnText}>Download now</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: tokens.color.text }]}>Downloading AI model</Text>
              <Text style={[styles.body, { color: tokens.color.textMuted }]}>
                {fileLabel ? `Downloading AI model… ${fileLabel}` : 'Preparing on-device AI…'}
              </Text>
              <View style={[styles.track, { backgroundColor: scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' }]}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tokens.color.primary }]} />
              </View>
              <Text style={[styles.pct, { color: tokens.color.primary }]}>{pct}%</Text>
              <Text style={[styles.hint, { color: tokens.color.textMuted }]}>
                Wi-Fi recommended. The app will start when the download finishes.
              </Text>
              {progress.status === 'downloading' && pct < 100 ? (
                <ActivityIndicator color={tokens.color.primary} style={styles.spinner} />
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 18 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden', marginBottom: 8 },
  fill: { height: '100%', borderRadius: 999 },
  pct: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 8, fontVariant: ['tabular-nums'] },
  spinner: { marginTop: 8 },
  primaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#041008', fontWeight: '700', fontSize: 16 },
});
