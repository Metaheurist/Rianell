/**
 * Plan 21 SEC8 — secure storage wrapper (RN uses encrypted storage; PWA falls back to localStorage).
 * Sensitive keys: userKeys, supabaseSession, vapidSubscription, encryptionPassphrase.
 */

export const SENSITIVE_STORAGE_KEYS = [
  'userKeys',
  'supabaseSession',
  'vapidSubscription',
  'encryptionPassphrase',
];

function isSensitiveKey(key) {
  return SENSITIVE_STORAGE_KEYS.includes(key);
}

/** @type {import('react-native-encrypted-storage') | null} */
let encryptedBackend = null;

export function configureSecureStorageBackend(backend) {
  encryptedBackend = backend;
}

export const secureStore = {
  async getItem(key) {
    if (isSensitiveKey(key) && encryptedBackend?.getItem) {
      return encryptedBackend.getItem(key);
    }
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    return null;
  },
  async setItem(key, value) {
    if (isSensitiveKey(key) && encryptedBackend?.setItem) {
      return encryptedBackend.setItem(key, value);
    }
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (isSensitiveKey(key) && encryptedBackend?.removeItem) {
      return encryptedBackend.removeItem(key);
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};
