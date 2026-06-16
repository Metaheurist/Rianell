/** Supabase free tier object limit is 50 MB — stay under with a safety margin. */
export const DEFAULT_CHUNK_BYTE_LIMIT = 47 * 1024 * 1024;

export function chunkPartPath(logicalPath, index, options = {}) {
  const n = String(index).padStart(3, '0');
  if (options.opaque && options.packIndex != null) {
    return `parts/p${options.packIndex}/c${n}.bin`;
  }
  return `${logicalPath}.part${n}`;
}

export function planFileChunks(sizeBytes, chunkByteLimit = DEFAULT_CHUNK_BYTE_LIMIT) {
  if (!sizeBytes || sizeBytes <= chunkByteLimit) {
    return { path: null, sizeBytes, chunks: null };
  }
  const chunks = [];
  let offset = 0;
  let index = 0;
  while (offset < sizeBytes) {
    const partSize = Math.min(chunkByteLimit, sizeBytes - offset);
    chunks.push({ offset, sizeBytes: partSize, index });
    offset += partSize;
    index += 1;
  }
  return { sizeBytes, chunks };
}

/** Normalize manifest `files` entries (string or { path, chunks, sizeBytes }). */
export function normalizeModelFileEntries(model) {
  const raw = model?.files || [];
  return raw.map((entry) => {
    if (typeof entry === 'string') {
      return { path: entry, sizeBytes: null, chunks: null };
    }
    return {
      path: String(entry.path || ''),
      sizeBytes: entry.sizeBytes ?? null,
      chunks: Array.isArray(entry.chunks) ? entry.chunks.slice() : null,
    };
  }).filter((e) => e.path);
}

export function logicalFilePaths(model) {
  return normalizeModelFileEntries(model).map((e) => e.path);
}

export function buildModelFileUrl(baseUrl, modelId, revision, filePath) {
  const base = String(baseUrl || '/').replace(/\/?$/, '/');
  const rev = revision || 'main';
  const path = String(filePath || '').replace(/^\/+/, '');
  return `${base}models/${modelId}/resolve/${rev}/${path}`;
}

export function mergeArrayBuffers(buffers) {
  const total = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const buf of buffers) {
    out.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return out.buffer;
}
