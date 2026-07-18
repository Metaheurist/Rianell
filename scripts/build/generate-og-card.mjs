#!/usr/bin/env node
/**
 * Generate the Open Graph / Twitter social share card (1200x630) for rianell.com.
 * Deterministic SVG -> PNG render (crisp text, on-brand) using sharp.
 * Output: apps/pwa-webapp/Icons/og-card.png
 *
 * Usage: node scripts/build/generate-og-card.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, '..', '..');
const iconsDir = path.join(root, 'apps', 'pwa-webapp', 'Icons');
const logoPath = path.join(iconsDir, 'Icon-512.png');
const outPath = path.join(iconsDir, 'og-card.png');

const WIDTH = 1200;
const HEIGHT = 630;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    throw new Error(`[og-card] logo not found at ${path.relative(root, logoPath)}`);
  }
  // Embed the real app logo (rounded) as a data URI so the card is self-contained.
  const logoBuf = await sharp(logoPath).resize(200, 200, { fit: 'cover' }).png().toBuffer();
  const logoData = `data:image/png;base64,${logoBuf.toString('base64')}`;

  const title = 'Rianell';
  const tagline = 'Track chronic conditions. Own your data.';
  const features = 'Symptoms · Vitals · Mood · On-device AI insights';
  const foot = 'Free · Open source · Encrypted · rianell.com';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070807"/>
      <stop offset="1" stop-color="#0f1613"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#78c06e"/>
      <stop offset="1" stop-color="#2e7d50"/>
    </linearGradient>
    <clipPath id="logoClip"><rect x="80" y="150" width="200" height="200" rx="44"/></clipPath>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="14" height="${HEIGHT}" fill="url(#accent)"/>
  <circle cx="1080" cy="120" r="260" fill="#78c06e" opacity="0.06"/>
  <circle cx="1160" cy="560" r="200" fill="#2e7d50" opacity="0.07"/>

  <image href="${logoData}" x="80" y="150" width="200" height="200" clip-path="url(#logoClip)"/>
  <rect x="80" y="150" width="200" height="200" rx="44" fill="none" stroke="#78c06e" stroke-opacity="0.35" stroke-width="2"/>

  <text x="330" y="250" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="104" font-weight="800" fill="#f1f5f9">${esc(title)}</text>
  <rect x="332" y="278" width="120" height="8" rx="4" fill="url(#accent)"/>

  <text x="80" y="452" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="50" font-weight="700" fill="#e2e8f0">${esc(tagline)}</text>
  <text x="80" y="516" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" font-weight="500" fill="#9fb0a6">${esc(features)}</text>
  <text x="80" y="580" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#78c06e">${esc(foot)}</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().resize(WIDTH, HEIGHT).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) {
    throw new Error(`[og-card] expected ${WIDTH}x${HEIGHT}, got ${meta.width}x${meta.height}`);
  }
  console.log(`[og-card] wrote ${path.relative(root, outPath)} (${meta.width}x${meta.height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
