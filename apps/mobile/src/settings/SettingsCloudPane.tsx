import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../cloud/supabaseClient';
import { useTheme } from '../theme/ThemeProvider';

export function SettingsCloudPane() {
  const theme = useTheme();
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function onSignIn() {
    if (!supabase) return;
    if (!email.trim() || !password) {
      Alert.alert('Sign in', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert('Sign in', error.message);
      else setPassword('');
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp() {
    if (!supabase) return;
    if (!email.trim() || !password) {
      Alert.alert('Sign up', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert('Sign up', error.message);
      else Alert.alert('Sign up', 'Check your email to verify your account, then sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('Sign out', error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!supabase) {
    return (
      <View style={styles.block}>
        <Text style={[styles.hint, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          Cloud sync is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env
          (see .env.example), then rebuild.
        </Text>
      </View>
    );
  }

  if (session?.user) {
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
          Signed in as {session.user.email ?? '—'}
        </Text>
        <Pressable
          style={[styles.btn, { opacity: busy ? 0.6 : 1 }]}
          onPress={() => void onSignOut()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Sign out of cloud"
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign out</Text>}
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
        accessibilityLabel="Cloud email"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="rgba(255,255,255,0.45)"
        secureTextEntry
        style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}
        accessibilityLabel="Cloud password"
      />
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.btnHalf, { opacity: busy ? 0.6 : 1 }]}
          onPress={() => void onSignUp()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Sign up for cloud"
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign up</Text>}
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnHalf, { opacity: busy ? 0.6 : 1 }]}
          onPress={() => void onSignIn()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Sign in to cloud"
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
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
  btnHalf: { flex: 1 },
  btnText: { color: '#fff', fontWeight: '800' },
});
