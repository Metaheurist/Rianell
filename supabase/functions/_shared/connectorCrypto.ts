function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importAesKey(secretB64: string) {
  const raw = base64UrlDecode(secretB64.replace(/=+$/, '') || secretB64);
  const keyBytes = raw.length >= 32 ? raw.slice(0, 32) : new TextEncoder().encode(secretB64.padEnd(32, '0')).slice(0, 32);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptToken(plaintext: string, secret: string): Promise<string> {
  const key = await importAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return `v1:${base64UrlEncode(iv)}:${base64UrlEncode(new Uint8Array(ct))}`;
}

export async function decryptToken(ciphertext: string, secret: string): Promise<string> {
  const parts = String(ciphertext || '').split(':');
  if (parts.length !== 3 || parts[0] !== 'v1') throw new Error('Invalid token format');
  const iv = base64UrlDecode(parts[1]);
  const combined = base64UrlDecode(parts[2]);
  const key = await importAesKey(secret);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(plain);
}

export async function createSignedState(payload: Record<string, unknown>, secret: string): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return `${base64UrlEncode(data)}.${base64UrlEncode(new Uint8Array(sig))}`;
}

export async function verifySignedState(state: string, secret: string): Promise<Record<string, unknown> | null> {
  const [payloadB64, sigB64] = state.split('.');
  if (!payloadB64 || !sigB64) return null;
  const data = base64UrlDecode(payloadB64);
  const sig = base64UrlDecode(sigB64);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const ok = await crypto.subtle.verify('HMAC', key, sig, data);
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(data));
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
