/** Plan 06 D6 — time-limited encrypted read-only share envelope (client-side + hosted links). */

import {
  encryptExportWithPassphrase,
  ENCRYPTED_EXPORT_FORMAT,
} from '../privacy/encryptedExport.mjs';

export const SHARE_LINK_FORMAT = 'rianell-share-v1';
export const SHARE_LINK_KDF_ITERATIONS = 310000;

const SHARE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const STRIP_WHEN_NOTES_OFF = [
  'notes',
  'energyClarity',
  'painLocation',
  'food',
  'barcodeFood',
  'medications',
  'medicationDoses',
];

export function generateShareCode(len = 16) {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    throw new Error('crypto.getRandomValues not available');
  }
  return Array.from(bytes).map((b) => SHARE_CODE_CHARS[b % SHARE_CODE_CHARS.length]).join('');
}

export function buildShareSnapshot(logs, opts = {}) {
  const from = opts.dateFrom || null;
  const to = opts.dateTo || null;
  const includeNotes = opts.includeNotes === true;
  const list = Array.isArray(logs) ? logs : [];
  const filtered = list
    .filter((l) => l && l.date && (!from || l.date >= from) && (!to || l.date <= to))
    .map((l) => {
      const entry = { ...l };
      if (!includeNotes) {
        STRIP_WHEN_NOTES_OFF.forEach((f) => {
          delete entry[f];
        });
      }
      return entry;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const snapshot = { logs: filtered };
  if (opts.includeCondition && opts.conditionName) {
    snapshot.condition = String(opts.conditionName).slice(0, 200);
  }
  return snapshot;
}

export async function createReadOnlyShareEnvelope(logs, passphrase, expiresInHours = 72) {
  const hours = Math.min(168, Math.max(1, Number(expiresInHours) || 72));
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const envelope = await encryptExportWithPassphrase(
    { logs: Array.isArray(logs) ? logs : [], share: { readOnly: true, expiresAt } },
    passphrase,
  );
  return {
    format: SHARE_LINK_FORMAT,
    encrypted: envelope,
    expiresAt,
    exportFormat: ENCRYPTED_EXPORT_FORMAT,
  };
}

export function shareEnvelopeToPortableJson(envelope) {
  return JSON.stringify(envelope, null, 2);
}

export async function uploadShareLink(snapshot, passphrase, supabaseClient, opts = {}) {
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    throw new Error('Supabase client unavailable');
  }
  const shareCode = generateShareCode();
  const hours = Math.min(2160, Math.max(1, Number(opts.ttlHours) || 168));
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const logs = snapshot && Array.isArray(snapshot.logs) ? snapshot.logs : [];
  const payload = {
    logs,
    share: { readOnly: true, expiresAt },
  };
  if (snapshot && snapshot.condition) {
    payload.condition = snapshot.condition;
  }
  const envelope = await encryptExportWithPassphrase(
    payload,
    passphrase,
    undefined,
    { iterations: SHARE_LINK_KDF_ITERATIONS },
  );
  const metadata = {
    log_count: logs.length,
    date_from: logs[0]?.date ?? null,
    date_to: logs[logs.length - 1]?.date ?? null,
    has_notes: opts.includeNotes === true,
    has_condition: opts.includeCondition === true,
  };
  const { error } = await supabaseClient.from('share_links').insert({
    share_code: shareCode,
    encrypted_blob: envelope.ciphertext,
    salt: envelope.salt,
    iv: envelope.iv,
    kdf_iterations: envelope.iterations,
    expires_at: expiresAt,
    metadata,
  });
  if (error) throw new Error(error.message || 'Failed to upload share link');
  return {
    shareCode,
    url: `https://rianell.com/share/${shareCode}`,
    expiresAt,
  };
}

export async function fetchShareLink(shareCode, supabaseClient) {
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    throw new Error('Supabase client unavailable');
  }
  const code = String(shareCode || '').trim();
  if (!code) throw new Error('Share code required');
  const { data, error } = await supabaseClient
    .from('share_links')
    .select('encrypted_blob, salt, iv, kdf_iterations, expires_at, metadata')
    .eq('share_code', code)
    .single();
  if (error || !data) {
    throw new Error(error?.message || 'Share link not found or expired');
  }
  if (typeof supabaseClient.rpc === 'function') {
    supabaseClient.rpc('increment_share_access', { p_code: code }).then(() => {}).catch(() => {});
  }
  return data;
}

export function shareRowToEnvelope(row) {
  if (!row) throw new Error('Share link data missing');
  return {
    format: ENCRYPTED_EXPORT_FORMAT,
    kdf: 'PBKDF2',
    iterations: row.kdf_iterations || SHARE_LINK_KDF_ITERATIONS,
    salt: row.salt,
    iv: row.iv,
    ciphertext: row.encrypted_blob,
  };
}
