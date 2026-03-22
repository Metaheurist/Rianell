#!/usr/bin/env node
/**
 * Copies the parent directory's web app files into public/legacy/
 * so the React shell can serve them at /legacy/ (e.g. Vite preview, Capacitor/Android).
 *
 * Must include every script referenced by web/index.html and lazy-loaded modules
 * (e.g. summary-llm.js, workers/io-worker.js) or the iframe will 404 and the app won't boot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const webDir = path.join(root, 'web');
const outDir = path.join(__dirname, 'public', 'legacy');

const staticRootFiles = [
  'index.html',
  'manifest.json',
  'styles.css',
  'print-styles.css',
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

fs.mkdirSync(outDir, { recursive: true });

for (const file of staticRootFiles) {
  const src = path.join(webDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, file));
    console.log('Copied', file);
  }
}

// All root-level .js modules (index.html + lazy loaders). Skip generated min bundle.
for (const name of fs.readdirSync(webDir)) {
  if (!name.endsWith('.js')) continue;
  if (name === 'app.min.js') continue;
  const src = path.join(webDir, name);
  if (!fs.statSync(src).isFile()) continue;
  fs.copyFileSync(src, path.join(outDir, name));
  console.log('Copied', name);
}

if (fs.existsSync(path.join(webDir, 'workers'))) {
  copyDir(path.join(webDir, 'workers'), path.join(outDir, 'workers'));
  console.log('Copied workers/');
}

if (fs.existsSync(path.join(webDir, 'Icons'))) {
  copyDir(path.join(webDir, 'Icons'), path.join(outDir, 'Icons'));
  console.log('Copied Icons/');
}

console.log('Web app copied to public/legacy/');
