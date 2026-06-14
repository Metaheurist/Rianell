import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import {
  deleteCloudLogs,
  loadFromCloud,
  syncAnonymizedData,
  syncToCloud,
} from '../cloud/sync';
import { getSupabaseClient } from '../cloud/supabaseClient';
import { loadPreferences } from '../storage/preferences';
import { checkFeatureForPrefs } from '../privacy/helpers';
import type { Preferences } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

export function SettingsCloudPane() {
  const theme = useTheme();
  const { t } = useT();
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useEffect(() => {
    void loadPreferences().then(setPrefs);
  }, []);

  const backupFeature = prefs ? checkFeatureForPrefs(prefs, 'backup') : { available: true };
  const anonFeature = prefs ? checkFeatureForPrefs(prefs, 'contributeAnonData') : { available: true };

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function runAction(label: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(true);
    try {
      const result = await fn();
      Alert.alert(label, result.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSignIn() {
    if (!supabase) return;
    if (!email.trim() || !password) {
      Alert.alert(t('settings.cloud.signIn'), t('settings.cloud.enterCredentials'));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) Alert.alert(t('settings.cloud.signIn'), error.message);
      else setPassword('');
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp() {
    if (!supabase) return;
    if (!email.trim() || !password) {
      Alert.alert(t('settings.cloud.signUp'), t('settings.cloud.enterCredentials'));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) Alert.alert(t('settings.cloud.signUp'), error.message);
      else Alert.alert(t('settings.cloud.signUp'), t('settings.cloud.verifyEmail'));
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert(t('settings.cloud.signOut'), error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!supabase) {
    return (
      <View style={styles.block}>
        <Text style={[styles.hint, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          {t('settings.cloud.notConfigured')}
        </Text>
      </View>
    );
  }

  if (session?.user) {
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
          {t('settings.cloud.signedInAs', { email: session.user.email ?? '—' })}
        </Text>
        {!backupFeature.available ? (
          <Text style={[styles.hint, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
            {t('settings.cloud.backupUnavailable')}
          </Text>
        ) : null}
        <Pressable
          style={[styles.btn, { opacity: busy || !backupFeature.available ? 0.6 : 1 }]}
          onPress={() => void runAction(t('settings.cloud.sync'), syncToCloud)}
          disabled={busy || !backupFeature.available}
        >
          <Text style={styles.btnText}>{t('settings.cloud.sync')}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, { opacity: busy || !backupFeature.available ? 0.6 : 1 }]}
          onPress={() => void runAction(t('settings.cloud.load'), loadFromCloud)}
          disabled={busy || !backupFeature.available}
        >
          <Text style={styles.btnText}>{t('settings.cloud.load')}</Text>
        </Pressable>
        {!anonFeature.available ? (
          <Text style={[styles.hint, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
            {t('settings.cloud.anonUnavailable')}
          </Text>
        ) : null}
        <Pressable
          style={[styles.btn, { opacity: busy || !anonFeature.available ? 0.6 : 1 }]}
          onPress={() => {
            void (async () => {
              const latest = await loadPreferences();
              if (!checkFeatureForPrefs(latest, 'contributeAnonData').available) return;
              await runAction(t('settings.cloud.anon'), () => syncAnonymizedData(latest.medicalCondition));
            })();
          }}
          disabled={busy || !anonFeature.available}
        >
          <Text style={styles.btnText}>{t('settings.cloud.anon')}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnDanger, { opacity: busy ? 0.6 : 1 }]}
          onPress={() => void runAction(t('settings.cloud.delete'), deleteCloudLogs)}
          disabled={busy}
        >
          <Text style={styles.btnText}>{t('settings.cloud.delete')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, { opacity: busy ? 0.6 : 1 }]} onPress={() => void onSignOut()} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('settings.cloud.signOut')}</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="rgba(255,255,255,0.45)"
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="rgba(255,255,255,0.45)"
        secureTextEntry
        style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}
      />
      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.btnHalf, { opacity: busy ? 0.6 : 1 }]} onPress={() => void onSignUp()} disabled={busy}>
          <Text style={styles.btnText}>{t('settings.cloud.signUp')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnHalf, { opacity: busy ? 0.6 : 1 }]} onPress={() => void onSignIn()} disabled={busy}>
          <Text style={styles.btnText}>{t('settings.cloud.signIn')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  hint: { lineHeight: 20 },
  label: { marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  btnDanger: { backgroundColor: 'rgba(244,67,54,0.35)' },
  btnHalf: { flex: 1 },
  btnText: { color: '#fff', fontWeight: '800' },
});
