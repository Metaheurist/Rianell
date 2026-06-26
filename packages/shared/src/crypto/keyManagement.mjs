/** Client-side DEK wrapping + AES-GCM helpers (Plan 15 FC4/FC5). */

const PBKDF2_ITERATIONS = 310_000;

function getSubtle() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto unavailable');
}

function randomBytes(length) {
  const buf = new Uint8Array(length);
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
  }
  return buf;
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(String(b64 || ''), 'base64'));
  }
  const binary = atob(String(b64 || ''));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function deriveWrappingKey(passphrase, salt) {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const baseKey = await subtle.importKey('raw', enc.encode(String(passphrase || '')), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

export async function generateDek() {
  const subtle = getSubtle();
  return subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function wrapDek(dek, wrappingKey) {
  const subtle = getSubtle();
  const wrapped = await subtle.wrapKey('raw', dek, wrappingKey, 'AES-KW');
  return wrapped;
}

export async function unwrapDek(wrappedDek, wrappingKey) {
  const subtle = getSubtle();
  return subtle.unwrapKey('raw', wrappedDek, wrappingKey, 'AES-KW', { name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptData(plaintext, dek) {
  const subtle = getSubtle();
  const iv = randomBytes(12);
  const enc = new TextEncoder();
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, dek, enc.encode(String(plaintext ?? '')));
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

export async function decryptData(ciphertextB64, ivB64, dek) {
  const subtle = getSubtle();
  const iv = base64ToBytes(ivB64);
  const ciphertext = base64ToBytes(ciphertextB64);
  const plainBuf = await subtle.decrypt({ name: 'AES-GCM', iv }, dek, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

export function generateSalt(bytes = 16) {
  return randomBytes(bytes);
}

export function saltToBase64(salt) {
  return bytesToBase64(salt);
}

export function base64ToSalt(b64) {
  return base64ToBytes(b64);
}

export function wrappedDekToBase64(buf) {
  return bytesToBase64(new Uint8Array(buf));
}

export function base64ToWrappedDek(b64) {
  return base64ToBytes(b64).buffer;
}

export { PBKDF2_ITERATIONS };
