import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateShareCode,
  buildShareSnapshot,
  SHARE_LINK_FORMAT,
  SHARE_LINK_KDF_ITERATIONS,
  createReadOnlyShareEnvelope,
  shareEnvelopeToPortableJson,
} from '../../packages/shared/src/export/shareReadOnlyLink.mjs';
import {
  encryptExportWithPassphrase,
  ENCRYPTED_EXPORT_MIN_LENGTH,
} from '../../packages/shared/src/privacy/encryptedExport.mjs';

// ── generateShareCode ─────────────────────────────────────────────────────────

test('generateShareCode returns a string of default length 16', () => {
  const code = generateShareCode();
  assert.equal(typeof code, 'string');
  assert.equal(code.length, 16);
});

test('generateShareCode uses only safe chars (no O, 0, I, l, 1)', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateShareCode();
    assert.doesNotMatch(code, /[OIl01]/);
  }
});

test('generateShareCode accepts custom length', () => {
  const code = generateShareCode(24);
  assert.equal(code.length, 24);
});

test('generateShareCode produces unique values', () => {
  const codes = new Set(Array.from({ length: 50 }, () => generateShareCode()));
  assert.ok(codes.size >= 45, 'expected most codes to be unique');
});

// ── buildShareSnapshot ────────────────────────────────────────────────────────

const SAMPLE_LOGS = [
  { date: '2026-06-01', mood: 3, notes: 'felt okay', food: 'salad' },
  { date: '2026-06-10', mood: 4, notes: 'good day', food: 'pasta' },
  { date: '2026-06-20', mood: 2, notes: 'tired', food: 'soup' },
];

test('buildShareSnapshot returns logs array', () => {
  const snap = buildShareSnapshot(SAMPLE_LOGS);
  assert.ok(Array.isArray(snap.logs));
  assert.equal(snap.logs.length, 3);
});

test('buildShareSnapshot strips notes and food by default', () => {
  const snap = buildShareSnapshot(SAMPLE_LOGS);
  for (const l of snap.logs) {
    assert.equal(l.notes, undefined);
    assert.equal(l.food, undefined);
  }
});

test('buildShareSnapshot includes notes when includeNotes=true', () => {
  const snap = buildShareSnapshot(SAMPLE_LOGS, { includeNotes: true });
  assert.equal(snap.logs[0].notes, 'felt okay');
});

test('buildShareSnapshot filters by date range', () => {
  const snap = buildShareSnapshot(SAMPLE_LOGS, { dateFrom: '2026-06-05', dateTo: '2026-06-15' });
  assert.equal(snap.logs.length, 1);
  assert.equal(snap.logs[0].date, '2026-06-10');
});

test('buildShareSnapshot sorts logs by date ascending', () => {
  const shuffled = [...SAMPLE_LOGS].reverse();
  const snap = buildShareSnapshot(shuffled);
  const dates = snap.logs.map((l) => l.date);
  assert.deepEqual(dates, [...dates].sort());
});

test('buildShareSnapshot includes condition when requested', () => {
  const snap = buildShareSnapshot(SAMPLE_LOGS, {
    includeCondition: true,
    conditionName: 'Fibromyalgia',
  });
  assert.equal(snap.condition, 'Fibromyalgia');
});

test('buildShareSnapshot omits condition field when not requested', () => {
  const snap = buildShareSnapshot(SAMPLE_LOGS);
  assert.equal(snap.condition, undefined);
});

test('buildShareSnapshot handles empty log array', () => {
  const snap = buildShareSnapshot([]);
  assert.deepEqual(snap.logs, []);
});

test('buildShareSnapshot handles non-array input gracefully', () => {
  const snap = buildShareSnapshot(null);
  assert.deepEqual(snap.logs, []);
});

// ── SHARE_LINK_KDF_ITERATIONS ─────────────────────────────────────────────────

test('SHARE_LINK_KDF_ITERATIONS is higher than export default', async () => {
  const { ENCRYPTED_EXPORT_KDF_ITERATIONS } = await import(
    '../../packages/shared/src/privacy/encryptedExport.mjs'
  );
  assert.ok(SHARE_LINK_KDF_ITERATIONS > ENCRYPTED_EXPORT_KDF_ITERATIONS,
    'Share link iterations should exceed default export iterations');
});

// ── createReadOnlyShareEnvelope (backward compat) ────────────────────────────

test('createReadOnlyShareEnvelope produces valid envelope', async () => {
  const logs = [{ date: '2026-06-01', mood: 3 }];
  const env = await createReadOnlyShareEnvelope(logs, 'MySecret12345!', 24);
  assert.equal(env.format, SHARE_LINK_FORMAT);
  assert.ok(env.encrypted, 'expected encrypted field');
  assert.ok(env.encrypted.ciphertext, 'expected ciphertext inside encrypted');
  assert.ok(env.expiresAt);
});

test('createReadOnlyShareEnvelope rejects short passphrase', async () => {
  await assert.rejects(
    () => createReadOnlyShareEnvelope([], 'short'),
    /at least \d+ characters/,
  );
});

// ── shareEnvelopeToPortableJson ───────────────────────────────────────────────

test('shareEnvelopeToPortableJson returns valid JSON string', async () => {
  const env = { format: SHARE_LINK_FORMAT, foo: 'bar' };
  const json = shareEnvelopeToPortableJson(env);
  assert.doesNotThrow(() => JSON.parse(json));
  assert.equal(JSON.parse(json).format, SHARE_LINK_FORMAT);
});

// ── ENCRYPTED_EXPORT_MIN_LENGTH enforcement ───────────────────────────────────

test('ENCRYPTED_EXPORT_MIN_LENGTH is 12', () => {
  assert.equal(ENCRYPTED_EXPORT_MIN_LENGTH, 12);
});

test('encryptExportWithPassphrase rejects passphrase shorter than 12 chars', async () => {
  await assert.rejects(
    () => encryptExportWithPassphrase({}, 'short', undefined),
    /at least 12 characters/,
  );
});

test('encryptExportWithPassphrase accepts exactly 12-char passphrase', async () => {
  const env = await encryptExportWithPassphrase({ x: 1 }, 'Abc123456789');
  assert.ok(env.ciphertext);
});
