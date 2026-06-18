/** Plan 06 D7 — encrypted blob backup to user-owned WebDAV (Basic auth). */

import { encryptExportWithPassphrase } from '../privacy/encryptedExport.mjs';

export async function buildEncryptedBackupBlob(logs, passphrase) {
  const envelope = await encryptExportWithPassphrase({ logs: Array.isArray(logs) ? logs : [] }, passphrase);
  return JSON.stringify(envelope);
}

export async function putWebDavEncryptedBackup({ url, username, password, body, filename }) {
  const base = String(url || '').replace(/\/$/, '');
  if (!base.startsWith('http')) throw new Error('WebDAV URL must start with http:// or https://');
  const name = filename || `rianell-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const target = `${base}/${encodeURIComponent(name)}`;
  const auth = typeof btoa === 'function'
    ? btoa(`${username}:${password}`)
    : Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  const res = await fetch(target, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`WebDAV upload failed (${res.status})`);
  return { url: target, status: res.status };
}
