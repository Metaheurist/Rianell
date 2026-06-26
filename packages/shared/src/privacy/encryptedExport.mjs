/** Plan 05 P4 — password-protected export envelope (PBKDF2 + AES-GCM). */

export const ENCRYPTED_EXPORT_FORMAT = 'rianell-encrypted-export-v1';
export const ENCRYPTED_EXPORT_KDF_ITERATIONS = 120000;
export const ENCRYPTED_EXPORT_MIN_LENGTH = 12;

function getSubtle(subtle) {
  const s = subtle || (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle);
  if (!s) throw new Error('Web Crypto subtle not available');
  return s;
}

function randomBytes(n) {
  const arr = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
  else throw new Error('crypto.getRandomValues not available');
  return arr;
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToBytes(b64) {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveExportKey(passphrase, salt, subtle, iterations) {
  const enc = new TextEncoder();
  const cryptoSubtle = getSubtle(subtle);
  const iters = iterations || ENCRYPTED_EXPORT_KDF_ITERATIONS;
  const keyMaterial = await cryptoSubtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return cryptoSubtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iters, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptExportWithPassphrase(payload, passphrase, subtle, opts) {
  const options = opts && typeof opts === 'object' ? opts : {};
  const iterations = options.iterations || ENCRYPTED_EXPORT_KDF_ITERATIONS;
  if (typeof passphrase !== 'string' || passphrase.length < ENCRYPTED_EXPORT_MIN_LENGTH) {
    throw new Error(`Passphrase must be at least ${ENCRYPTED_EXPORT_MIN_LENGTH} characters`);
  }
  const cryptoSubtle = getSubtle(subtle);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveExportKey(passphrase, salt, cryptoSubtle, iterations);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await cryptoSubtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    format: ENCRYPTED_EXPORT_FORMAT,
    kdf: 'PBKDF2',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
  };
}

export async function decryptExportWithPassphrase(envelope, passphrase, subtle) {
  if (!envelope || envelope.format !== ENCRYPTED_EXPORT_FORMAT) {
    throw new Error('Unsupported encrypted export format');
  }
  if (typeof passphrase !== 'string' || !passphrase) throw new Error('Passphrase required');
  const cryptoSubtle = getSubtle(subtle);
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const cipher = base64ToBytes(envelope.ciphertext);
  const iterations = envelope.iterations || ENCRYPTED_EXPORT_KDF_ITERATIONS;
  const key = await deriveExportKey(passphrase, salt, cryptoSubtle, iterations);
  const plain = await cryptoSubtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plain));
}
