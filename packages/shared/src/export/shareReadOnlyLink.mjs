/** Plan 06 D6 — time-limited encrypted read-only share envelope (client-side). */

import { encryptExportWithPassphrase, ENCRYPTED_EXPORT_FORMAT } from '../privacy/encryptedExport.mjs';

export const SHARE_LINK_FORMAT = 'rianell-share-v1';

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
