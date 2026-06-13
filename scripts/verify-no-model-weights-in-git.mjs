#!/usr/bin/env node
/**
 * Fail CI if LLM weight files are tracked by git.
 * Weights are hosted on Supabase Storage (chunked); only manifest.json + README are committed.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const MODELS_PREFIX = 'apps/pwa-webapp/models/';
const ALLOWED_UNDER_MODELS = new Set([
  'apps/pwa-webapp/models/manifest.json',
  'apps/pwa-webapp/models/README.md',
]);

const WEIGHT_GLOB = [
  /\.onnx$/i,
  /\.onnx_data$/i,
  /\.part\d{3}$/i,
  /\/onnx\//i,
  /onnx-community\//i,
  /checksums\.json$/i,
];

function isWeightPath(rel) {
  return WEIGHT_GLOB.some((pat) => pat.test(rel));
}

let failed = false;

const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
  .split(/\n/)
  .map((s) => s.trim())
  .filter(Boolean);

for (const rel of tracked) {
  if (rel.startsWith(MODELS_PREFIX) && !ALLOWED_UNDER_MODELS.has(rel)) {
    console.error(`verify-no-model-weights-in-git: unexpected tracked file under models/: ${rel}`);
    failed = true;
  }
  if (isWeightPath(rel)) {
    console.error(`verify-no-model-weights-in-git: tracked LLM weight artifact: ${rel}`);
    failed = true;
  }
}

const gitignorePath = path.join(root, '.gitignore');
const gitignore = fs.readFileSync(gitignorePath, 'utf8');
if (!gitignore.includes('apps/pwa-webapp/models/**')) {
  console.error('verify-no-model-weights-in-git: .gitignore must ignore apps/pwa-webapp/models/**');
  failed = true;
}

if (failed) process.exit(1);
console.log('verify-no-model-weights-in-git: OK (manifest + README only; weights on Supabase)');
