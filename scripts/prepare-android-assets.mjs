#!/usr/bin/env node
/**
 * Writes apps/capacitor-app/assets/logo.png (1024×1024) for @capacitor/assets Easy Mode.
 * Sources: apps/pwa-webapp/Icons/beta/logo-source.png (preferred when present), else .../Icons/logo-source.png,
 * else .../Icons/beta/Icon-512.png, else .../Icons/Icon-512.png (upscale),
 * else a solid brand-colour placeholder so CI still produces launcher icons.
 *
 * Run from repo root before: cd apps/capacitor-app && npx @capacitor/assets generate --android ...
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'apps', 'capacitor-app', 'assets');
const outFile = path.join(outDir, 'logo.png');
const srcBetaPreferred = path.join(root, 'apps', 'pwa-webapp', 'Icons', 'beta', 'logo-source.png');
const srcPreferred = path.join(root, 'apps', 'pwa-webapp', 'Icons', 'logo-source.png');
const srcBeta512 = path.join(root, 'apps', 'pwa-webapp', 'Icons', 'beta', 'Icon-512.png');
const srcFallback = path.join(root, 'apps', 'pwa-webapp', 'Icons', 'Icon-512.png');
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
    'prepare-android-assets: no apps/pwa-webapp/Icons/beta/logo-source.png, logo-source.png, or Icon-512.png; wrote flat placeholder logo.png - add logo assets for branded APK icons.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
