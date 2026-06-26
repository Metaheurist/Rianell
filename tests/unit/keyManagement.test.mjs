import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PBKDF2_ITERATIONS,
  deriveWrappingKey,
  generateDek,
  wrapDek,
  unwrapDek,
  encryptData,
  decryptData,
  saltToBase64,
  base64ToSalt,
  wrappedDekToBase64,
  base64ToWrappedDek,
  generateSalt,
} from '@rianell/shared';

test('deriveWrappingKey uses OWASP PBKDF2 iteration minimum', () => {
  assert.ok(PBKDF2_ITERATIONS >= 310_000);
});

test('wrapDek and unwrapDek round-trip', async () => {
  const salt = generateSalt(16);
  const wrappingKey = await deriveWrappingKey('test-passphrase', salt);
  const dek = await generateDek();
  const wrapped = await wrapDek(dek, wrappingKey);
  const unwrapped = await unwrapDek(wrapped, wrappingKey);
  const plain = 'health-log-payload';
  const enc = await encryptData(plain, dek);
  const decryptedWithUnwrapped = await decryptData(enc.ciphertext, enc.iv, unwrapped);
  assert.equal(decryptedWithUnwrapped, plain);
});

test('encryptData and decryptData round-trip', async () => {
  const dek = await generateDek();
  const payload = JSON.stringify({ logs: [{ date: '2026-06-26', mood: 7 }] });
  const { ciphertext, iv } = await encryptData(payload, dek);
  assert.ok(ciphertext.length > 0);
  assert.ok(iv.length > 0);
  const out = await decryptData(ciphertext, iv, dek);
  assert.deepEqual(JSON.parse(out), JSON.parse(payload));
});

test('salt and wrapped dek base64 helpers round-trip', () => {
  const salt = generateSalt(16);
  const b64 = saltToBase64(salt);
  const back = base64ToSalt(b64);
  assert.equal(back.length, salt.length);
  const wrapped = new Uint8Array([1, 2, 3, 4, 5]).buffer;
  const w64 = wrappedDekToBase64(wrapped);
  const wBack = base64ToWrappedDek(w64);
  assert.equal(new Uint8Array(wBack).length, 5);
});

test('migration path: legacy hex key can be wrapped', async () => {
  const legacyHex = 'a'.repeat(64);
  const salt = generateSalt(16);
  const wrappingKey = await deriveWrappingKey('user-pass', salt);
  const keyBytes = new Uint8Array(legacyHex.length / 2);
  for (let i = 0; i < legacyHex.length; i += 2) {
    keyBytes[i / 2] = parseInt(legacyHex.substr(i, 2), 16);
  }
  const subtle = globalThis.crypto.subtle;
  const dek = await subtle.importKey('raw', keyBytes.slice(0, 32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  const wrapped = await wrapDek(dek, wrappingKey);
  const unwrapped = await unwrapDek(wrapped, wrappingKey);
  const sample = await encryptData('legacy-migrated', dek);
  assert.equal(await decryptData(sample.ciphertext, sample.iv, unwrapped), 'legacy-migrated');
});
