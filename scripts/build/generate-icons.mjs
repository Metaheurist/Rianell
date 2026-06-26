#!/usr/bin/env node
/** Plan 22 PF6 — WebP/AVIF icon generation from PNG sources. */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const iconsDir = path.join(root, 'apps/pwa-webapp/Icons');
const webpDir = path.join(iconsDir, 'webp');
const avifDir = path.join(iconsDir, 'avif');

if (!fs.existsSync(iconsDir)) {
  console.log('No Icons directory — skipping');
  process.exit(0);
}

fs.mkdirSync(webpDir, { recursive: true });
fs.mkdirSync(avifDir, { recursive: true });

const pngs = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.png'));
for (const png of pngs) {
  const src = path.join(iconsDir, png);
  const base = png.replace(/\.png$/i, '');
  await sharp(src).webp({ quality: 85 }).toFile(path.join(webpDir, `${base}.webp`));
  await sharp(src).avif({ quality: 70 }).toFile(path.join(avifDir, `${base}.avif`));
}
console.log(`Generated ${pngs.length} WebP + AVIF icons`);
