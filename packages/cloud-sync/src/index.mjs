export { mergeHealthLogs } from '@rianell/shared';

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

export async function deriveAesKeyFromHex(hex, subtle) {
  const cryptoSubtle = subtle || (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle);
  if (!cryptoSubtle) throw new Error('Web Crypto subtle not available');
  const keyBytes = hexToBytes(hex);
  return cryptoSubtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptJsonAesGcm(data, keyHex, subtle) {
  const cryptoSubtle = subtle || globalThis.crypto.subtle;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKeyFromHex(keyHex, cryptoSubtle);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await cryptoSubtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  if (typeof Buffer !== 'undefined') return Buffer.from(combined).toString('base64');
  let binary = '';
  combined.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export async function decryptJsonAesGcm(base64, keyHex, subtle) {
  const cryptoSubtle = subtle || globalThis.crypto.subtle;
  let bytes;
  if (typeof Buffer !== 'undefined') {
    bytes = new Uint8Array(Buffer.from(base64, 'base64'));
  } else {
    const binary = atob(base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  }
  const iv = bytes.slice(0, 12);
  const cipher = bytes.slice(12);
  const key = await deriveAesKeyFromHex(keyHex, cryptoSubtle);
  const plain = await cryptoSubtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plain));
}
