#!/usr/bin/env node
/**
 * Copies the parent directory's web app files into public/legacy/
 * so the React shell can serve them at /legacy/ (e.g. for Capacitor/Android).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'public', 'legacy');

const toCopy = [
  'index.html',
  'manifest.json',
  'styles.css',
  'print-styles.css',
  'app.js',
  'AIEngine.js',
  'event-handlers.js',
  'storage-utils.js',
  'notifications.js',
  'notification-helpers.js',
  'export-utils.js',
  'import-utils.js',
  'print-utils.js',
  'performance-utils.js',
  'security-utils.js',
  'encryption-utils.js',
  'cloud-sync.js',
  'supabase-config.js',
  'prediction-worker.js',
  'sw.js',
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

if (!fs.existsSync(root)) {
  console.error('Parent directory not found:', root);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of toCopy) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, file));
    console.log('Copied', file);
  }
}

if (fs.existsSync(path.join(root, 'Icons'))) {
  copyDir(path.join(root, 'Icons'), path.join(outDir, 'Icons'));
  console.log('Copied Icons/');
}

if (fs.existsSync(path.join(root, 'apexcharts.min.js'))) {
  fs.copyFileSync(path.join(root, 'apexcharts.min.js'), path.join(outDir, 'apexcharts.min.js'));
  console.log('Copied apexcharts.min.js');
}

console.log('Web app copied to public/legacy/');
