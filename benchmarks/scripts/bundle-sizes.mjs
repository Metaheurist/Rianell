#!/usr/bin/env node
/**
 * Record first-party JS/CSS byte sizes (raw + gzip) for CI benchmark artifacts.
 * Usage: node benchmarks/scripts/bundle-sizes.mjs [distDir]
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const distDir = path.resolve(process.argv[2] || path.join(root, 'apps', 'pwa-webapp', '.android-dist'));

function gzipSize(buf) {
  return zlib.gzipSync(buf).length;
}

function scanDir(dir, exts, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      scanDir(full, exts, out);
    } else if (exts.some((e) => name.endsWith(e))) {
      const raw = fs.readFileSync(full);
      out.push({
        file: path.relative(root, full).replace(/\\/g, '/'),
        bytes: raw.length,
        gzipBytes: gzipSize(raw),
      });
    }
  }
}

const files = [];
scanDir(distDir, ['.js', '.css'], files);
files.sort((a, b) => b.bytes - a.bytes);

const report = {
  generatedAt: new Date().toISOString(),
  distDir: path.relative(root, distDir).replace(/\\/g, '/'),
  totals: {
    jsBytes: files.filter((f) => f.file.endsWith('.js')).reduce((s, f) => s + f.bytes, 0),
    cssBytes: files.filter((f) => f.file.endsWith('.css')).reduce((s, f) => s + f.bytes, 0),
    jsGzipBytes: files.filter((f) => f.file.endsWith('.js')).reduce((s, f) => s + f.gzipBytes, 0),
    cssGzipBytes: files.filter((f) => f.file.endsWith('.css')).reduce((s, f) => s + f.gzipBytes, 0),
  },
  files,
};

const outJson = path.join(root, 'benchmarks', 'web-pwa', 'bundle-sizes.json');
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + '\n');

const mdLines = [
  '# PWA bundle sizes',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '| File | Raw | Gzip |',
  '|------|-----|------|',
];
for (const f of files.slice(0, 20)) {
  mdLines.push(`| ${f.file} | ${f.bytes} | ${f.gzipBytes} |`);
}
mdLines.push('', `**JS total (gzip):** ${report.totals.jsGzipBytes} bytes`, `**CSS total (gzip):** ${report.totals.cssGzipBytes} bytes`, '');
fs.writeFileSync(path.join(root, 'benchmarks', 'web-pwa', 'bundle-sizes.md'), mdLines.join('\n'));

console.log('bundle-sizes: wrote', path.relative(root, outJson));
console.log('  JS gzip total:', report.totals.jsGzipBytes, 'CSS gzip total:', report.totals.cssGzipBytes);
