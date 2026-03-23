/**
 * Builds web/Icons/beta/* from clean originals in web/Icons/ (matches .app-beta-badge in styles.css).
 * Does not modify originals. Run: npm run icons:beta
 *
 * Re-running overwrites beta outputs only (safe). Regenerate after editing master icons.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'web', 'Icons');
const betaDir = path.join(iconsDir, 'beta');

/** Same gradient + border intent as .app-beta-badge */
function badgeSvg(width, height, label) {
  const gradId = 'bg';
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffa726"/>
      <stop offset="100%" stop-color="#e65100"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#e65100" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${Math.min(height / 2, 8)}"
    fill="url(#${gradId})" stroke="rgba(255,255,255,0.35)" stroke-width="1" filter="url(#sh)"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui,Segoe UI,Arial,sans-serif" font-weight="800" font-size="${Math.floor(height * 0.42)}"
    letter-spacing="0.06em" fill="#ffffff">${label}</text>
</svg>`
  );
}

function badgeSizeForIcon(iconSize) {
  if (iconSize < 36) {
    const s = Math.max(6, Math.round(iconSize * 0.28));
    return { w: s, h: s, label: null };
  }
  const h = Math.max(10, Math.round(iconSize * 0.115));
  const w = Math.round(h * 2.55);
  return { w, h, label: 'BETA' };
}

async function addBadgeToFile(srcPath, destPath) {
  const base = await sharp(srcPath);
  const meta = await base.metadata();
  const iw = meta.width;
  const ih = meta.height;
  if (!iw || !ih) return;

  const { w: bw, h: bh, label } = badgeSizeForIcon(Math.min(iw, ih));
  const margin = Math.max(1, Math.round(Math.min(iw, ih) * 0.035));

  let overlay;
  if (!label) {
    const r = Math.max(1, Math.floor(bw / 3));
    overlay = sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffa726"/><stop offset="100%" stop-color="#e65100"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${bw}" height="${bh}" rx="${r}" fill="url(#g)" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>
</svg>`
      )
    ).png();
  } else {
    overlay = sharp(badgeSvg(bw, bh, label)).png();
  }

  const overlayBuf = await overlay.toBuffer();
  const left = iw - bw - margin;
  const top = ih - bh - margin;
  if (left < 0 || top < 0) return;

  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await base
    .composite([{ input: overlayBuf, left, top, blend: 'over' }])
    .png()
    .toFile(destPath + '.tmp');

  await fs.promises.rename(destPath + '.tmp', destPath);
}

function listSourcePngs() {
  const names = fs.readdirSync(iconsDir);
  return names.filter((n) => {
    if (!n.endsWith('.png')) return false;
    if (n === 'screenshot-wide.png' || n === 'screenshot-narrow.png') return false;
    return /^Icon-/.test(n) || n === 'logo-source.png';
  });
}

async function main() {
  const pngs = listSourcePngs();
  for (const name of pngs.sort()) {
    const src = path.join(iconsDir, name);
    const dest = path.join(betaDir, name);
    process.stdout.write(`BETA → beta/${name} … `);
    await addBadgeToFile(src, dest);
    console.log('ok');
  }
  console.log('Done. Outputs in web/Icons/beta/ (originals unchanged).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
