#!/usr/bin/env node
/**
 * Writes react-app/assets/logo.png (1024×1024) for @capacitor/assets Easy Mode.
 * Sources: web/Icons/beta/logo-source.png (preferred when present), else web/Icons/logo-source.png,
 * else web/Icons/beta/Icon-512.png, else web/Icons/Icon-512.png (upscale),
 * else a solid brand-colour placeholder so CI still produces launcher icons.
 *
 * Run from repo root before: cd react-app && npx @capacitor/assets generate --android ...
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'react-app', 'assets');
const outFile = path.join(outDir, 'logo.png');
const srcBetaPreferred = path.join(root, 'web', 'Icons', 'beta', 'logo-source.png');
const srcPreferred = path.join(root, 'web', 'Icons', 'logo-source.png');
const srcBeta512 = path.join(root, 'web', 'Icons', 'beta', 'Icon-512.png');
const srcFallback = path.join(root, 'web', 'Icons', 'Icon-512.png');
const BG = { r: 26, g: 29, b: 30, alpha: 1 };

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  if (fs.existsSync(srcBetaPreferred)) {
    await sharp(srcBetaPreferred)
      .resize(1024, 1024, { fit: 'contain', position: 'centre', background: BG })
      .png()
      .toFile(outFile);
    console.log('prepare-android-assets: wrote', path.relative(root, outFile), 'from Icons/beta/logo-source.png');
    return;
  }
  if (fs.existsSync(srcPreferred)) {
    await sharp(srcPreferred)
      .resize(1024, 1024, { fit: 'contain', position: 'centre', background: BG })
      .png()
      .toFile(outFile);
    console.log('prepare-android-assets: wrote', path.relative(root, outFile), 'from logo-source.png');
    return;
  }
  if (fs.existsSync(srcBeta512)) {
    await sharp(srcBeta512)
      .resize(1024, 1024, { fit: 'contain', position: 'centre', background: BG })
      .png()
      .toFile(outFile);
    console.log('prepare-android-assets: wrote', path.relative(root, outFile), 'from Icons/beta/Icon-512.png');
    return;
  }
  if (fs.existsSync(srcFallback)) {
    await sharp(srcFallback)
      .resize(1024, 1024, { fit: 'contain', position: 'centre', background: BG })
      .png()
      .toFile(outFile);
    console.log('prepare-android-assets: wrote', path.relative(root, outFile), 'from Icon-512.png');
    return;
  }

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: { r: BG.r, g: BG.g, b: BG.b },
    },
  })
    .png()
    .toFile(outFile);
  console.warn(
    'prepare-android-assets: no web/Icons/beta/logo-source.png, logo-source.png, or Icon-512.png; wrote flat placeholder logo.png - add logo assets for branded APK icons.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
