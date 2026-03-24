#!/usr/bin/env node
/**
 * Copies the parent directory's web app files into public/legacy/
 * so the React shell can serve them at /legacy/ (e.g. Vite preview, Capacitor/Android).
 *
 * Must include every script referenced by web/index.html and lazy-loaded modules
 * (e.g. summary-llm.js, workers/io-worker.js) or the iframe will 404 and the app won't boot.
 *
 * Production / APK: pass --min after `npm run build:web` so legacy/index.html loads app.min.js
 * (smaller, faster parse) instead of the multi‑MB app.js. Dev: run without --min (default).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const webDir = path.join(root, 'web');
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

if (!fs.existsSync(webDir)) {
  console.error('Web directory not found:', webDir);
  process.exit(1);
}

if (useMin) {
  const minPath = path.join(sourceDir, 'app.min.js');
  if (!fs.existsSync(minPath)) {
    console.error(
      'copy-webapp --min: app.min.js not found. From repo root run: npm run build:web:apk (or npm run build:web)'
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

  if (useMin && sourceDir === webDir) {
    const indexOut = path.join(outDir, 'index.html');
    if (fs.existsSync(indexOut)) {
      let html = fs.readFileSync(indexOut, 'utf8');
      html = html.replace(/src="app\.js(\?[^"]*)?"/g, 'src="app.min.js$1"');
      html = html.replace(/href="app\.js(\?[^"]*)?"/g, 'href="app.min.js$1"');
      fs.writeFileSync(indexOut, html);
      console.log('Patched index.html to load app.min.js');
    }
  } else if (useMin && sourceDir === androidDistDir) {
    console.log('Using web/.android-dist (index.html already targets app.min.js + minified assets)');
  }

// Root-level .js modules (index.html + lazy loaders).
for (const name of fs.readdirSync(sourceDir)) {
  if (!name.endsWith('.js')) continue;
  if (name === 'app.min.js') {
    if (useMin) {
      const src = path.join(sourceDir, name);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(outDir, name));
        console.log('Copied', name);
      }
    }
    continue;
  }
  if (name === 'app.js' && useMin) continue;
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
        ? ' (Android dist: app.min.js + minified modules)'
        : ' (minified app bundle)'
      : '')
);
