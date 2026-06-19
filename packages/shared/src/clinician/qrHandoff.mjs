/** Plan 12 CL2 — ephemeral encrypted QR handoff (P4 crypto, bounded payload). */

import { encryptExportWithPassphrase, decryptExportWithPassphrase } from '../privacy/encryptedExport.mjs';

export const QR_HANDOFF_FORMAT = 'rianell-qr-handoff-v1';
export const QR_HANDOFF_MAX_CHARS = 2400;
export const QR_HANDOFF_DEFAULT_TTL_MINUTES = 60;

export function buildQrHandoffLogsSubset(logs, maxLogs = 14) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) =>
    String(a?.date || '').localeCompare(String(b?.date || ''))
  );
  return list.slice(-Math.max(1, Math.min(30, maxLogs)));
}

export async function createQrHandoffPayload(logs, passphrase, opts = {}) {
  if (typeof passphrase !== 'string' || passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters');
  }
  const ttlMin = Math.min(180, Math.max(5, Number(opts.ttlMinutes) || QR_HANDOFF_DEFAULT_TTL_MINUTES));
  const expiresAt = new Date(Date.now() + ttlMin * 60_000).toISOString();
  const subset = buildQrHandoffLogsSubset(logs, opts.maxLogs ?? 14);
  const encrypted = await encryptExportWithPassphrase(
    {
      logs: subset,
      handoff: { readOnly: true, expiresAt, format: QR_HANDOFF_FORMAT },
    },
    passphrase,
    opts.subtle,
  );
  const payload = {
    format: QR_HANDOFF_FORMAT,
    expiresAt,
    encrypted,
  };
  const token = JSON.stringify(payload);
  if (token.length > QR_HANDOFF_MAX_CHARS) {
    throw new Error('Handoff payload too large for QR. Try fewer logs or use encrypted file export');
  }
  return { token, expiresAt, logCount: subset.length };
}

export function parseQrHandoffToken(token) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('Empty handoff token');
  const parsed = JSON.parse(token);
  if (!parsed || parsed.format !== QR_HANDOFF_FORMAT) throw new Error('Unsupported handoff format');
  return parsed;
}

export function isQrHandoffExpired(payload, now = new Date()) {
  if (!payload?.expiresAt) return true;
  return Date.parse(payload.expiresAt) <= now.getTime();
}

export async function decryptQrHandoffToken(token, passphrase, opts = {}) {
  const payload = parseQrHandoffToken(token);
  if (isQrHandoffExpired(payload, opts.now)) throw new Error('Handoff expired');
  const data = await decryptExportWithPassphrase(payload.encrypted, passphrase, opts.subtle);
  return {
    logs: Array.isArray(data?.logs) ? data.logs : [],
    expiresAt: payload.expiresAt,
    readOnly: true,
  };
}
