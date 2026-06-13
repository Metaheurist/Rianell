#!/usr/bin/env node
/**
 * Upload mirrored LLM weights to Supabase Storage with chunking for free-tier limits (50 MB/object).
 *
 * Prerequisites:
 *   1. Apply supabase/Schema.sql (storage bucket section)
 *   2. npm run models:download  (local files under apps/pwa-webapp/models/)
 *   3. Credentials in security/.env or env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run models:upload:supabase
 *   npm run models:upload:supabase -- --model smollm
 *   npm run models:upload:supabase -- --purge-local   # delete local weights after upload
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_CHUNK_BYTE_LIMIT,
  chunkPartPath,
  planFileChunks,
  normalizeModelFileEntries,
} from '../packages/llm/src/chunks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MODELS_ROOT = path.join(ROOT, 'apps', 'pwa-webapp', 'models');
const MANIFEST_PATH = path.join(MODELS_ROOT, 'manifest.json');
const DEFAULT_BUCKET = 'llm-models';

function parseArgs(argv) {
  const out = { model: 'all', bucket: DEFAULT_BUCKET, purgeLocal: false, force: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--model' && argv[i + 1]) {
      out.model = String(argv[i + 1]).toLowerCase();
      i += 1;
    } else if (argv[i] === '--bucket' && argv[i + 1]) {
      out.bucket = String(argv[i + 1]);
      i += 1;
    } else if (argv[i] === '--purge-local') {
      out.purgeLocal = true;
    } else if (argv[i] === '--force') {
      out.force = true;
    }
  }
  return out;
}

function loadSecurityEnv() {
  const envPath = path.join(ROOT, 'security', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function filterModels(models, arg) {
  if (arg === 'all') return models;
  if (arg === 'smollm') return models.filter((m) => m.id.includes('SmolLM2'));
  if (arg === 'llama') return models.filter((m) => m.id.includes('Llama'));
  throw new Error(`Unknown --model ${arg}`);
}

function storagePath(modelId, revision, file) {
  return `models/${modelId}/resolve/${revision}/${file.replace(/\\/g, '/')}`;
}

function guessContentType(file) {
  if (file.endsWith('.json')) return 'application/json';
  if (file.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

function localModelPath(modelId, revision, file) {
  return path.join(MODELS_ROOT, modelId, 'resolve', revision, file);
}

async function remoteObjectSize(publicBase, objectPath) {
  const url = `${publicBase}${objectPath}`;
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return null;
    const len = res.headers.get('content-length');
    return len ? Number(len) : null;
  } catch {
    return null;
  }
}

async function uploadBuffer(client, bucket, objectPath, buffer) {
  const { error } = await client.storage.from(bucket).upload(objectPath, buffer, {
    upsert: true,
    contentType: guessContentType(objectPath),
    cacheControl: '31536000',
  });
  if (error) throw new Error(`${objectPath}: ${error.message}`);
  return buffer.byteLength;
}

async function uploadFile(client, bucket, objectPath, localPath) {
  const buffer = fs.readFileSync(localPath);
  return uploadBuffer(client, bucket, objectPath, buffer);
}

async function uploadLogicalFile(client, bucket, modelId, revision, logicalPath, publicBase, chunkByteLimit, force) {
  const local = localModelPath(modelId, revision, logicalPath);
  if (!fs.existsSync(local)) {
    throw new Error(`Missing local file ${local}`);
  }
  const size = fs.statSync(local).size;
  const plan = planFileChunks(size, chunkByteLimit);
  const objectPath = storagePath(modelId, revision, logicalPath);

  if (!plan.chunks) {
    if (!force) {
      const remote = await remoteObjectSize(publicBase, objectPath);
      if (remote === size) {
        console.log(`  skip ${objectPath} (${(size / (1024 * 1024)).toFixed(1)} MB)`);
        return { path: logicalPath, sizeBytes: size, chunks: null };
      }
    }
    process.stdout.write(`  ${objectPath} (${(size / (1024 * 1024)).toFixed(1)} MB) … `);
    await uploadFile(client, bucket, objectPath, local);
    console.log('ok');
    return { path: logicalPath, sizeBytes: size, chunks: null };
  }

  const chunkRelPaths = [];
  const fd = fs.openSync(local, 'r');
  try {
    for (const part of plan.chunks) {
      const chunkRel = chunkPartPath(logicalPath, part.index);
      const chunkObjectPath = storagePath(modelId, revision, chunkRel);
      chunkRelPaths.push(chunkRel);

      if (!force) {
        const remote = await remoteObjectSize(publicBase, chunkObjectPath);
        if (remote === part.sizeBytes) {
          console.log(`  skip ${chunkObjectPath} (part ${part.index}, ${(part.sizeBytes / (1024 * 1024)).toFixed(1)} MB)`);
          continue;
        }
      }

      const buffer = Buffer.alloc(part.sizeBytes);
      fs.readSync(fd, buffer, 0, part.sizeBytes, part.offset);
      process.stdout.write(`  ${chunkObjectPath} (part ${part.index}, ${(part.sizeBytes / (1024 * 1024)).toFixed(1)} MB) … `);
      await uploadBuffer(client, bucket, chunkObjectPath, buffer);
      console.log('ok');
    }
  } finally {
    fs.closeSync(fd);
  }

  return { path: logicalPath, sizeBytes: size, chunks: chunkRelPaths };
}

function buildManifestFileEntry(entry) {
  if (entry.chunks && entry.chunks.length) {
    return { path: entry.path, sizeBytes: entry.sizeBytes, chunks: entry.chunks };
  }
  return entry.path;
}

function purgeLocalModelWeights(models) {
  let removed = 0;
  for (const model of models) {
    for (const entry of normalizeModelFileEntries(model)) {
      const local = localModelPath(model.id, model.revision, entry.path);
      if (fs.existsSync(local)) {
        fs.unlinkSync(local);
        removed += 1;
      }
      if (entry.chunks) {
        for (const chunk of entry.chunks) {
          const chunkLocal = localModelPath(model.id, model.revision, chunk);
          if (fs.existsSync(chunkLocal)) {
            fs.unlinkSync(chunkLocal);
            removed += 1;
          }
        }
      }
    }
    const checksums = path.join(MODELS_ROOT, 'checksums.json');
    if (fs.existsSync(checksums)) fs.unlinkSync(checksums);
  }
  console.log(`[models:upload] Purged ${removed} local weight file(s) from ${MODELS_ROOT}`);
}

async function main() {
  loadSecurityEnv();
  const args = parseArgs(process.argv);
  const url = process.env.SUPABASE_URL || process.env.RIANELL_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';
  if (!url || !serviceKey) {
    throw new Error(
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in security/.env (service role only — never ship to clients)'
    );
  }
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing ${MANIFEST_PATH} — run npm run models:download first`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const models = filterModels(manifest.models || [], args.model);
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const publicBase = `${url.replace(/\/$/, '')}/storage/v1/object/public/${args.bucket}/`;

  console.log(`[models:upload] Bucket ${args.bucket} @ ${url}`);
  console.log(`[models:upload] Chunk limit ${(DEFAULT_CHUNK_BYTE_LIMIT / (1024 * 1024)).toFixed(0)} MB (Supabase free tier max 50 MB/object)`);

  const updatedModels = [];

  for (const model of models) {
    console.log(`\n[models:upload] ${model.label || model.id}`);
    const fileEntries = normalizeModelFileEntries(model);
    const uploadedEntries = [];

    for (const entry of fileEntries) {
      const result = await uploadLogicalFile(
        client,
        args.bucket,
        model.id,
        model.revision,
        entry.path,
        publicBase,
        DEFAULT_CHUNK_BYTE_LIMIT,
        args.force
      );
      uploadedEntries.push(result);
    }

    updatedModels.push({
      ...model,
      files: uploadedEntries.map(buildManifestFileEntry),
    });
  }

  const otherModels = (manifest.models || []).filter((m) => !models.some((x) => x.id === m.id));
  const nextManifest = {
    ...manifest,
    version: 2,
    chunkByteLimit: DEFAULT_CHUNK_BYTE_LIMIT,
    description:
      'On-device LLM weights on Supabase Storage. Large files are split into .partNNN chunks (free tier 50 MB limit).',
    models: [...otherModels, ...updatedModels],
  };

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(nextManifest, null, 2)}\n`);
  await uploadFile(client, args.bucket, 'models/manifest.json', MANIFEST_PATH);
  console.log('\n  uploaded models/manifest.json (with chunk metadata)');

  if (args.purgeLocal) {
    purgeLocalModelWeights(updatedModels);
  }

  console.log(`\n[models:upload] Done. Public base URL:\n  ${publicBase}`);
  console.log('[models:upload] Clients download chunks and reassemble into on-device cache.');
}

main().catch((err) => {
  console.error('[models:upload]', err.message || err);
  process.exit(1);
});
