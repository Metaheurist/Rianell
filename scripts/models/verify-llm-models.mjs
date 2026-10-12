#!/usr/bin/env node
/**
 * Verify LLM manifest and optional local mirrors (or remote Supabase chunks).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeModelFileEntries } from '../../packages/llm/src/chunks.mjs';
import { assertBucketName, assertModelFilePath, assertModelRef, assertStorageBaseUrl } from './model-ref.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const MODELS_ROOT = path.join(ROOT, 'apps', 'pwa-webapp', 'models');
const MANIFEST_PATH = path.join(MODELS_ROOT, 'manifest.json');

function readIfExists(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

function localFileSize(p) {
  try {
    return fs.statSync(p).size;
  } catch (e) {
    if (e.code === 'ENOENT') return 0;
    throw e;
  }
}

function loadSecurityEnv() {
  const envPath = path.join(ROOT, 'security', '.env');
  const text = readIfExists(envPath);
  if (text === null) return;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

function destPath(modelId, revision, file) {
  return path.join(MODELS_ROOT, modelId, 'resolve', revision, file);
}

async function remoteHead(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return null;
    const len = res.headers.get('content-length');
    return len ? Number(len) : -1;
  } catch {
    return null;
  }
}

async function main() {
  const manifestRaw = readIfExists(MANIFEST_PATH);
  if (manifestRaw === null) {
    console.error('[verify-llm-models] Missing manifest.json');
    process.exit(1);
  }
  const manifest = JSON.parse(manifestRaw);
  loadSecurityEnv();
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const bucket = assertBucketName(process.env.MODELS_STORAGE_BUCKET || 'llm-models');
  const publicBase = supabaseUrl
    ? `${assertStorageBaseUrl(supabaseUrl)}/storage/v1/object/public/${bucket}/`
    : '';

  let missingLocal = 0;
  let missingRemote = 0;

  for (const model of manifest.models || []) {
    const entries = normalizeModelFileEntries(model);
    assertModelRef(model, entries.map((e) => e.path));
    for (const entry of entries) {
      if (entry.chunks) entry.chunks.forEach(assertModelFilePath);
      const local = destPath(model.id, model.revision, entry.path);
      const size = localFileSize(local);
      const localOk = size > 0;

      if (entry.chunks && entry.chunks.length) {
        if (localOk) {
          if (entry.sizeBytes && size !== entry.sizeBytes) {
            console.error(`[verify-llm-models] size mismatch ${model.id}/${entry.path}`);
            missingLocal += 1;
          }
          continue;
        }
        if (!publicBase) {
          console.error(`[verify-llm-models] missing local ${model.id}/${entry.path} (set SUPABASE_URL to verify remote)`);
          missingLocal += 1;
          continue;
        }
        for (const chunk of entry.chunks) {
          const url = `${publicBase}models/${model.id}/resolve/${model.revision}/${chunk}`;
          const remoteSize = await remoteHead(url);
          if (remoteSize == null) {
            console.error(`[verify-llm-models] missing remote chunk ${chunk}`);
            missingRemote += 1;
          }
        }
        continue;
      }

      if (!localOk) {
        if (publicBase) {
          const url = `${publicBase}models/${model.id}/resolve/${model.revision}/${entry.path}`;
          const remoteSize = await remoteHead(url);
          if (remoteSize == null) {
            console.error(`[verify-llm-models] missing ${model.id}/${entry.path}`);
            missingRemote += 1;
          }
        } else {
          console.error(`[verify-llm-models] missing local ${model.id}/${entry.path}`);
          missingLocal += 1;
        }
      }
    }
  }

  const missing = missingLocal + missingRemote;
  if (missing) {
    console.error(`[verify-llm-models] ${missing} issue(s) — run npm run models:download`);
    process.exit(1);
  }
  console.log('[verify-llm-models] OK — manifest verified (local and/or remote checks)');
}

main().catch((err) => {
  console.error('[verify-llm-models]', err.message || err);
  process.exit(1);
});
