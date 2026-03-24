/**
 * Generate app icon PNG sizes from a single source image.
 *
 * Usage:
 *   node scripts/generate-icon-set.mjs --source "C:/path/to/source.png"
 *
 * Outputs:
 *   web/Icons/logo-source.png
 *   web/Icons/Icon-<size>.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const iconsDir = path.join(projectRoot, 'web', 'Icons');

const ICON_SIZES = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 167, 180, 192, 384, 512];
const LOGO_SOURCE_SIZE = 1024;
const BG = { r: 10, g: 15, b: 20, alpha: 1 };

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

async function ensureDirs() {
  await fs.promises.mkdir(iconsDir, { recursive: true });
  await fs.promises.mkdir(path.join(iconsDir, 'beta'), { recursive: true });
}

async function renderSquare(sourcePath, size, targetPath) {
  await sharp(sourcePath)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .flatten({ background: BG })
    .png()
    .toFile(targetPath);
}

async function main() {
  const sourcePath = parseArg('--source');
  if (!sourcePath) {
    throw new Error('Missing --source argument. Example: node scripts/generate-icon-set.mjs --source "C:/image.png"');
  }
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source image not found: ${sourcePath}`);
  }

  await ensureDirs();

  const logoSourceOut = path.join(iconsDir, 'logo-source.png');
  await renderSquare(sourcePath, LOGO_SOURCE_SIZE, logoSourceOut);
  console.log('Generated logo-source.png');

  for (const size of ICON_SIZES) {
    const out = path.join(iconsDir, `Icon-${size}.png`);
    await renderSquare(sourcePath, size, out);
    console.log(`Generated Icon-${size}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

