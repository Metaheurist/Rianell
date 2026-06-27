/** HMAC-signed OAuth state for connector CSRF protection. */

function base64UrlEncode(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(String(str || ''), 'base64url'));
  }
  const padded = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret) {
  const raw = new TextEncoder().encode(String(secret || ''));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createOAuthState({ userId, provider, secret, ttlSec = 600 }) {
  const payload = {
    userId: String(userId),
    provider: String(provider),
    nonce: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const key = await importHmacKey(secret);
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return `${base64UrlEncode(data)}.${base64UrlEncode(new Uint8Array(sig))}`;
}

export async function verifyOAuthState(state, secret) {
  const parts = String(state || '').split('.');
  if (parts.length !== 2) return null;
  const data = base64UrlDecode(parts[0]);
  const sig = base64UrlDecode(parts[1]);
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify('HMAC', key, sig, data);
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(data));
  } catch {
    return null;
  }
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
