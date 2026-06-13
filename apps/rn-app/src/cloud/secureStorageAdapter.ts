import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { SupportedStorage } from '@supabase/supabase-js';

const SECURE_PREFIX = 'rianell.supabase.auth.';

/** Keys longer than SecureStore limit are sharded in AsyncStorage with a SecureStore index. */
const SECURE_MAX = 2048;

async function secureGet(key: string): Promise<string | null> {
  const index = await SecureStore.getItemAsync(`${SECURE_PREFIX}${key}.idx`);
  if (index === '1') {
    return SecureStore.getItemAsync(`${SECURE_PREFIX}${key}`);
  }
  if (index === 'multi') {
    const countStr = await SecureStore.getItemAsync(`${SECURE_PREFIX}${key}.parts`);
    const count = countStr ? parseInt(countStr, 10) : 0;
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await AsyncStorage.getItem(`${SECURE_PREFIX}${key}.part.${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  }
  return AsyncStorage.getItem(`${SECURE_PREFIX}${key}`);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (value.length <= SECURE_MAX) {
    await SecureStore.setItemAsync(`${SECURE_PREFIX}${key}`, value);
    await SecureStore.setItemAsync(`${SECURE_PREFIX}${key}.idx`, '1');
    for (let i = 0; i < 8; i++) {
      await AsyncStorage.removeItem(`${SECURE_PREFIX}${key}.part.${i}`);
    }
    await AsyncStorage.removeItem(`${SECURE_PREFIX}${key}.parts`);
    return;
  }
  const chunkSize = SECURE_MAX;
  const parts = Math.ceil(value.length / chunkSize);
  for (let i = 0; i < parts; i++) {
    await AsyncStorage.setItem(`${SECURE_PREFIX}${key}.part.${i}`, value.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  await SecureStore.setItemAsync(`${SECURE_PREFIX}${key}.parts`, String(parts));
  await SecureStore.setItemAsync(`${SECURE_PREFIX}${key}.idx`, 'multi');
  await SecureStore.deleteItemAsync(`${SECURE_PREFIX}${key}`);
}

async function secureRemove(key: string): Promise<void> {
  const index = await SecureStore.getItemAsync(`${SECURE_PREFIX}${key}.idx`);
  if (index === '1') {
    await SecureStore.deleteItemAsync(`${SECURE_PREFIX}${key}`);
  }
  if (index === 'multi') {
    const countStr = await SecureStore.getItemAsync(`${SECURE_PREFIX}${key}.parts`);
    const count = countStr ? parseInt(countStr, 10) : 0;
    for (let i = 0; i < count; i++) {
      await AsyncStorage.removeItem(`${SECURE_PREFIX}${key}.part.${i}`);
    }
    await SecureStore.deleteItemAsync(`${SECURE_PREFIX}${key}.parts`);
  }
  await SecureStore.deleteItemAsync(`${SECURE_PREFIX}${key}.idx`);
  await AsyncStorage.removeItem(`${SECURE_PREFIX}${key}`);
}

/** Supabase auth storage: session tokens in SecureStore (with chunk fallback). */
export const supabaseAuthStorage: SupportedStorage = {
  getItem: (key: string) => secureGet(key),
  setItem: (key: string, value: string) => secureSet(key, value),
  removeItem: (key: string) => secureRemove(key),
};
