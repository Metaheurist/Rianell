#!/usr/bin/env node
/**
 * Resizes web/Icons/logo-source.png into web/Icons/Icon-{size}.png for PWA, favicon, iOS.
 * Run from repo root: npm run generate:icons
 * Requires: sharp (npm install)
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'web', 'Icons', 'logo-source.png');
const outDir = path.join(root, 'web', 'Icons');

/** Brand background (matches logo plate); maskable icons use full-bleed safe content inside. */
const BG = { r: 26, g: 29, b: 30, alpha: 1 };

const SIZES = [
  16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 167, 180, 192, 384, 512
];

async function main() {
  if (!fs.existsSync(src)) {
    console.error('Missing source image:', src);
    process.exit(1);
  }

  for (const size of SIZES) {
    const dest = path.join(outDir, `Icon-${size}.png`);
    await sharp(src)
      .resize(size, size, {
        fit: 'contain',
        position: 'centre',
        background: BG
      })
      .png()
      .toFile(dest);
    console.log('Wrote', path.relative(root, dest));
  }

  console.log('Done. Total:', SIZES.length, 'icons.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
