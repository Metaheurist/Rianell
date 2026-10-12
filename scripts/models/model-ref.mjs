/**
 * Validation for manifest-derived values that end up in download/upload URLs and local paths.
 */
const REPO_RE = /^[A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*$/;
const REVISION_RE = /^[A-Za-z0-9][\w.-]*$/;
const SEGMENT_RE = /^[A-Za-z0-9_][\w.-]*$/;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function assertModelRepo(value, field = 'repo') {
  const s = String(value || '');
  if (!REPO_RE.test(s)) throw new Error(`Invalid model ${field}: ${JSON.stringify(value)}`);
  return s;
}

export function assertModelRevision(value) {
  const s = String(value || '');
  if (!REVISION_RE.test(s)) throw new Error(`Invalid model revision: ${JSON.stringify(value)}`);
  return s;
}

export function assertModelFilePath(value) {
  const s = String(value || '');
  const segments = s.split('/');
  if (!s || !segments.every((seg) => SEGMENT_RE.test(seg))) {
    throw new Error(`Invalid model file path: ${JSON.stringify(value)}`);
  }
  return s;
}

/** Validate id, sourceRepo (when present), revision and every file path of a manifest model. */
export function assertModelRef(model, filePaths) {
  assertModelRepo(model?.id, 'id');
  if (model?.sourceRepo !== undefined) assertModelRepo(model.sourceRepo, 'sourceRepo');
  assertModelRevision(model?.revision);
  for (const p of filePaths) assertModelFilePath(p);
  return model;
}

/** Storage base URL must be https (http only for a local Supabase stack). Returns the origin without trailing slash. */
export function assertStorageBaseUrl(value) {
  let u;
  try {
    u = new URL(String(value || ''));
  } catch {
    throw new Error(`Invalid SUPABASE_URL: ${JSON.stringify(value)}`);
  }
  const ok = u.protocol === 'https:' || (u.protocol === 'http:' && LOCAL_HOSTS.has(u.hostname));
  if (!ok || u.username || u.password) {
    throw new Error(`SUPABASE_URL must be an https URL (http allowed only for localhost): ${JSON.stringify(value)}`);
  }
  return `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
}

export function assertBucketName(value) {
  const s = String(value || '');
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(s)) throw new Error(`Invalid storage bucket: ${JSON.stringify(value)}`);
  return s;
}
