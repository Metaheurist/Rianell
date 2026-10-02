#!/usr/bin/env node
/**
 * Copy the @huggingface/transformers web bundle + its pinned onnxruntime-web WASM
 * runtimes into PWA vendor/ and write vendor-manifest.json (sha256 per file).
 * Pin comes from package.json (4.3.0). The worker rewrites transformers.js' default
 * jsDelivr wasmPaths to these self-hosted copies, so both ORT variants it may pick
 * (asyncify, or plain on Safari < 26 without WebGPU) must be vendored.
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pkgRoot = join(root, 'node_modules', '@huggingface', 'transformers');
const ortRoot = join(root, 'node_modules', 'onnxruntime-web');
const outDir = join(root, 'apps', 'pwa-webapp', 'vendor', 'transformers');

const FILES = [
  // transformers.min.js inlines the ORT WebGPU bundle; transformers.web*.js keep bare
  // `onnxruntime-web` imports that only a bundler can resolve.
  { from: join(pkgRoot, 'dist'), name: 'transformers.min.js' },
  { from: join(ortRoot, 'dist'), name: 'ort-wasm-simd-threaded.asyncify.mjs' },
  { from: join(ortRoot, 'dist'), name: 'ort-wasm-simd-threaded.asyncify.wasm' },
  { from: join(ortRoot, 'dist'), name: 'ort-wasm-simd-threaded.mjs' },
  { from: join(ortRoot, 'dist'), name: 'ort-wasm-simd-threaded.wasm' },
];

function readVersion(dir) {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
}

if (!existsSync(join(pkgRoot, 'dist')) || !existsSync(join(ortRoot, 'dist'))) {
  console.error('Run npm ci first — @huggingface/transformers or onnxruntime-web dist missing');
  process.exit(1);
}

const version = readVersion(pkgRoot);
const ortVersion = readVersion(ortRoot);
const declaredOrt = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')).dependencies?.['onnxruntime-web'];
if (declaredOrt && declaredOrt !== ortVersion) {
  console.error(`onnxruntime-web ${ortVersion} does not match transformers@${version} pin ${declaredOrt}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

/**
 * GitHub secret scanning treats `s.` + exactly 24 alnum chars as a HashiCorp Vault
 * service token. Transformers.js minified Deberta-style re-exports match that pattern.
 * Bracket notation is equivalent and clears the FP.
 */
function neutralizeVaultShapedPropertyAccess(source) {
  return source.replace(
    /(^|[^A-Za-z0-9_$])s\.([A-Za-z0-9]{24})(?![A-Za-z0-9_$])/g,
    '$1s["$2"]',
  );
}

const keep = new Set(FILES.map((f) => f.name).concat('vendor-manifest.json'));
for (const name of readdirSync(outDir)) {
  if (!keep.has(name)) {
    rmSync(join(outDir, name));
    console.log('Removed stale', name);
  }
}

const manifest = { version, onnxruntimeWeb: ortVersion, files: {} };

for (const { from, name } of FILES) {
  const src = join(from, name);
  if (!existsSync(src)) {
    console.error('Missing', src);
    process.exit(1);
  }
  const dest = join(outDir, name);
  copyFileSync(src, dest);
  let buf = readFileSync(dest);
  if (/\.m?js$/.test(name)) {
    const rewritten = neutralizeVaultShapedPropertyAccess(buf.toString('utf8'));
    if (rewritten !== buf.toString('utf8')) {
      writeFileSync(dest, rewritten);
      buf = Buffer.from(rewritten, 'utf8');
      console.log('Neutralized Vault-shaped identifiers in', name);
    }
  }
  manifest.files[name] = {
    sha256: createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
  };
  console.log('Copied', name);
}

writeFileSync(join(outDir, 'vendor-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote vendor-manifest.json (transformers@${version}, onnxruntime-web@${ortVersion})`);
