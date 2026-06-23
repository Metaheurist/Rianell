/**
 * Device-local AES-256-GCM envelope for health logs (Phase 7).
 * Key material: 32-byte hex in SecureStore; IV per write via expo-crypto.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { decryptJsonAesGcm, encryptJsonAesGcm } from '@rianell/cloud-sync';

const DEVICE_LOGS_KEY = 'rianell.deviceLogsKey.v1';
const ENVELOPE_PREFIX = 'rianell-enc:v1:';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getOrCreateDeviceLogsKeyHex(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_LOGS_KEY);
  if (existing && /^[0-9a-f]{64}$/i.test(existing)) return existing.toLowerCase();
  const random = await Crypto.getRandomBytesAsync(32);
  const hex = bytesToHex(random);
  await SecureStore.setItemAsync(DEVICE_LOGS_KEY, hex);
  return hex;
}

export function isEncryptedLogsEnvelope(raw: string): boolean {
  return typeof raw === 'string' && raw.startsWith(ENVELOPE_PREFIX);
}

export async function encryptLogsEnvelope<T>(payload: T): Promise<string> {
  const keyHex = await getOrCreateDeviceLogsKeyHex();
  const cipher = await encryptJsonAesGcm(payload, keyHex);
  return `${ENVELOPE_PREFIX}${cipher}`;
}

export async function decryptLogsEnvelope<T>(raw: string): Promise<T> {
  if (!isEncryptedLogsEnvelope(raw)) {
    return JSON.parse(raw) as T;
  }
  const keyHex = await getOrCreateDeviceLogsKeyHex();
  const cipher = raw.slice(ENVELOPE_PREFIX.length);
  return decryptJsonAesGcm(cipher, keyHex) as Promise<T>;
}
