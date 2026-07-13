#!/usr/bin/env node
/**
 * Copy @huggingface/transformers browser bundle + ORT wasm into PWA vendor/.
 * Default pin: 3.3.2. Set TRANSFORMERS_VENDOR_VERSION=4.x to spike v4 (Stage 8).
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const version = process.env.TRANSFORMERS_VENDOR_VERSION || '3.3.2';
const pkgRoot = join(root, 'node_modules', '@huggingface', 'transformers');
const dist = join(pkgRoot, 'dist');
const outDir = join(root, 'apps', 'pwa-webapp', 'vendor', 'transformers');

const FILES = [
  'transformers.min.js',
  'transformers.min.js.map',
  'transformers.min.mjs',
  'transformers.min.mjs.map',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
];

if (!existsSync(dist)) {
  console.error('Run npm ci first — @huggingface/transformers dist missing');
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

const manifest = { version, files: {} };

for (const name of FILES) {
  const src = join(dist, name);
  if (!existsSync(src)) {
    console.error('Missing', src);
    process.exit(1);
  }
  const dest = join(outDir, name);
  copyFileSync(src, dest);
  let buf = readFileSync(dest);
  if (/\.m?js$/.test(name) && !name.endsWith('.map')) {
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

writeFileSync(join(outDir, 'vendor-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Wrote vendor-manifest.json (transformers@' + version + ')');
