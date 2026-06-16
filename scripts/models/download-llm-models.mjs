#!/usr/bin/env node
/**
 * Mirror Transformers.js ONNX weights into apps/pwa-webapp/models/ for same-origin hosting.
 * Requires network access to huggingface.co. Llama 3.2 needs HF_TOKEN + accepted license.
 *
 * Usage:
 *   node scripts/models/download-llm-models.mjs
 *   node scripts/models/download-llm-models.mjs --model smollm|llama
 *   HF_TOKEN=hf_... node scripts/models/download-llm-models.mjs
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const MODELS_ROOT = path.join(ROOT, 'apps', 'pwa-webapp', 'models');
const MANIFEST_PATH = path.join(MODELS_ROOT, 'manifest.json');

function parseArgs(argv) {
  const out = { model: 'all' };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--model' && argv[i + 1]) {
      out.model = String(argv[i + 1]).toLowerCase();
      i += 1;
    }
  }
  return out;
}

function hfHeaders() {
  const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN || '';
  const headers = { 'User-Agent': 'Rianell-models-sync/1.0' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function resolveUrl(sourceRepo, revision, file) {
  return `https://huggingface.co/${sourceRepo}/resolve/${revision}/${file}`;
}

function destPath(modelId, revision, file) {
  return path.join(MODELS_ROOT, modelId, 'resolve', revision, file);
}

async function downloadFile(url, dest, headers) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 30 * 60 * 1000);
  let res;
  try {
    res = await fetch(url, { headers, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const tmp = `${dest}.part`;
  const file = fs.createWriteStream(tmp);
  const reader = res.body.getReader();
  let written = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    file.write(Buffer.from(value));
    written += value.byteLength;
  }
  await new Promise((resolve, reject) => {
    file.on('finish', resolve);
    file.on('error', reject);
    file.end();
  });
  fs.renameSync(tmp, dest);
  return written;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function filterModels(models, arg) {
  if (arg === 'all') return models;
  if (arg === 'smollm') {
    return models.filter((m) => m.id.includes('SmolLM2'));
  }
  if (arg === 'llama') {
    return models.filter((m) => m.id.includes('Llama'));
  }
  throw new Error(`Unknown --model ${arg} (use smollm, llama, or omit for all)`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest: ${MANIFEST_PATH}`);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const models = filterModels(manifest.models || [], args.model);
  const headers = hfHeaders();
  const checksums = {};

  console.log(`[models] Downloading ${models.length} model(s) → ${MODELS_ROOT}`);

  for (const model of models) {
    console.log(`\n[models] ${model.label || model.id} (${model.sourceRepo})`);
    checksums[model.id] = { revision: model.revision, files: {} };

    for (const file of model.files) {
      const url = resolveUrl(model.sourceRepo, model.revision, file);
      const dest = destPath(model.id, model.revision, file);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        console.log(`  skip (exists) ${file}`);
        checksums[model.id].files[file] = sha256File(dest);
        continue;
      }
      process.stdout.write(`  fetch ${file} … `);
      try {
        const bytes = await downloadFile(url, dest, headers);
        checksums[model.id].files[file] = sha256File(dest);
        console.log(`${(bytes / (1024 * 1024)).toFixed(1)} MB`);
      } catch (err) {
        console.log('FAILED');
        throw new Error(`${file}: ${err.message}`);
      }
    }
  }

  const checksumPath = path.join(MODELS_ROOT, 'checksums.json');
  fs.writeFileSync(checksumPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), models: checksums }, null, 2)}\n`);
  console.log(`\n[models] Done. Wrote ${path.relative(ROOT, checksumPath)}`);
  console.log('[models] Upload to Supabase: npm run models:upload:supabase -- --purge-local');
  console.log('[models] Do not commit weight files — only manifest.json is tracked in git.');
}

main().catch((err) => {
  console.error('[models] Error:', err.message || err);
  if (String(err.message || '').includes('401')) {
    console.error('[models] Tip: export HF_TOKEN and accept model licenses on huggingface.co');
  }
  process.exit(1);
});
