#!/usr/bin/env node
/**
 * Copies the parent directory's web app files into public/legacy/
 * so the React shell can serve them at /legacy/ (e.g. Vite preview, Capacitor/Android).
 *
 * Must include every script referenced by apps/pwa-webapp/index.html and lazy-loaded modules
 * (e.g. summary-llm.js, workers/io-worker.js) or the iframe will 404 and the app won't boot.
 *
 * Production / APK: pass --min after `npm run build:web` so legacy/index.html loads the
 * content-hashed app bundle (see asset-manifest.json) instead of app.js. Dev: run without --min.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const webDir = path.join(root, 'apps', 'pwa-webapp');
const androidDistDir = path.join(webDir, '.android-dist');
const outDir = path.join(__dirname, 'public', 'legacy');

const useMin =
  process.argv.includes('--min') || process.env.LEGACY_USE_MINIFIED === '1';

/** Prefer full minified tree from build-site --skip-trace (Android/iOS) when present */
const sourceDir =
  useMin && fs.existsSync(path.join(androidDistDir, 'index.html'))
    ? androidDistDir
    : webDir;

const staticRootFiles = [
  'index.html',
  'manifest.json',
  'motd.json',
  'styles.css',
  'print-styles.css',
  'styles-charts.css', // loaded on demand by app.js (charts tab)
];

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
};

function readManifest(dir) {
  const p = path.join(dir, 'asset-manifest.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

if (!fs.existsSync(webDir)) {
  console.error('Web directory not found:', webDir);
  process.exit(1);
}

const manifest = readManifest(sourceDir);
const mainJsFile = manifest?.mainJs || 'app.min.js';

if (useMin) {
  const minPath = path.join(sourceDir, mainJsFile);
  if (!fs.existsSync(minPath)) {
    console.error(
      `copy-webapp --min: ${mainJsFile} not found. From repo root run: npm run build:web:apk (or npm run build:web) so apps/pwa-webapp has a built bundle + asset-manifest.json`
    );
    process.exit(1);
  }
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of staticRootFiles) {
  const src = path.join(sourceDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, file));
    console.log('Copied', file);
  }
}

if (manifest && fs.existsSync(path.join(sourceDir, 'asset-manifest.json'))) {
  fs.copyFileSync(
    path.join(sourceDir, 'asset-manifest.json'),
    path.join(outDir, 'asset-manifest.json')
  );
  console.log('Copied asset-manifest.json');
}

if (useMin && sourceDir === webDir) {
  const indexOut = path.join(outDir, 'index.html');
  if (fs.existsSync(indexOut)) {
    let html = fs.readFileSync(indexOut, 'utf8');
    html = html.replace(/src="app\.js(\?[^"]*)?"/g, `src="${mainJsFile}$1"`);
    html = html.replace(/href="app\.js(\?[^"]*)?"/g, `href="${mainJsFile}$1"`);
    fs.writeFileSync(indexOut, html);
    console.log('Patched index.html to load', mainJsFile);
  }
} else if (useMin && sourceDir === androidDistDir) {
  console.log(
    'Using apps/pwa-webapp/.android-dist (index.html already targets hashed bundles + minified assets)'
  );
}

// Root-level .js modules (index.html + lazy loaders).
for (const name of fs.readdirSync(sourceDir)) {
  if (!name.endsWith('.js')) continue;
  if (name === 'app.js' && useMin) continue;
  if (useMin && /^app\.[0-9a-f]+\.min\.js$/i.test(name) && name !== mainJsFile) {
    continue;
  }
  if (name === 'app.min.js' || /^app\.[0-9a-f]+\.min\.js$/i.test(name)) {
    if (useMin) {
      const src = path.join(sourceDir, name);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(outDir, name));
        console.log('Copied', name);
      }
    }
    continue;
  }
  const src = path.join(sourceDir, name);
  if (!fs.statSync(src).isFile()) continue;
  fs.copyFileSync(src, path.join(outDir, name));
  console.log('Copied', name);
}

// Hashed stylesheet from --site or android-dist (optional)
for (const name of fs.readdirSync(sourceDir)) {
  if (!/^styles\.[0-9a-f]+\.css$/i.test(name)) continue;
  const src = path.join(sourceDir, name);
  if (!fs.statSync(src).isFile()) continue;
  fs.copyFileSync(src, path.join(outDir, name));
  console.log('Copied', name);
}

if (fs.existsSync(path.join(sourceDir, 'workers'))) {
  copyDir(path.join(sourceDir, 'workers'), path.join(outDir, 'workers'));
  console.log('Copied workers/');
}

if (fs.existsSync(path.join(sourceDir, 'Icons'))) {
  copyDir(path.join(sourceDir, 'Icons'), path.join(outDir, 'Icons'));
  console.log('Copied Icons/');
}

console.log(
  'Web app copied to public/legacy/' +
    (useMin
      ? sourceDir === androidDistDir
        ? ' (Android dist: hashed app + minified modules)'
        : ' (minified app bundle)'
      : '')
);
