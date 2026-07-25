#!/usr/bin/env node
/**
 * Rasterize SVG strings to PNG thumbnails via sharp (for Tk dashboard gallery).
 *
 * Usage:
 *   echo '[{"id":"x","svg":"<svg…>","bg":"#101816"}]' | node scripts/dev/svg-thumb.mjs
 *   node scripts/dev/svg-thumb.mjs --file=in.json
 *
 * Stdout: JSON array [{ id, ok, pngBase64?, error? }]
 * Optional disk cache: --cache-dir=artifacts/visual-gen/thumbs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith('--file='));
const cacheArg = args.find((a) => a.startsWith('--cache-dir='));
const sizeArg = args.find((a) => a.startsWith('--size='));
const SIZE = Math.max(32, Math.min(256, Number(sizeArg?.split('=')[1] || 96) || 96));
const CACHE_DIR = cacheArg
  ? path.resolve(root, cacheArg.split('=')[1] || 'artifacts/visual-gen/thumbs')
  : path.join(root, 'artifacts/visual-gen/thumbs');

function readInput() {
  if (fileArg) {
    const p = path.resolve(fileArg.split('=')[1]);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const raw = fs.readFileSync(0, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function stripDuplicateAttrs(tagInner) {
  // tagInner is the inside of <…> without brackets
  const parts = tagInner.match(/(?:[^\s"'=]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)/g) || [];
  if (!parts.length) return tagInner;
  const name = parts[0];
  const seen = new Set();
  const out = [name];
  for (let i = 1; i < parts.length; i += 1) {
    const p = parts[i];
    const key = p.split('=')[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out.join(' ');
}

function sanitizeSvgMarkup(svg) {
  let t = String(svg || '').trim();
  if (!t) return '';
  if ((t.match(/"/g) || []).length % 2 === 1) return '';
  // Move closing tags that wrongly sit after </svg> to just before it
  t = t.replace(/<\/svg>((?:\s*<\/[a-zA-Z][\w:-]*>)+)\s*$/i, (_, closers) => `${closers}</svg>`);
  const close = t.toLowerCase().indexOf('</svg>');
  if (close !== -1) t = t.slice(0, close + 6);
  t = t.replace(/<\/?(?:div|span|article|section|script|style|html|body)\b[^>]*>/gi, '');
  // Drop duplicate attributes (librsvg rejects redefined attrs)
  t = t.replace(/<([a-zA-Z][\w:-]*)(\s[^>]*)?>/g, (full, tag, attrs) => {
    if (!attrs) return full;
    if (attrs.trim().endsWith('/')) {
      const inner = attrs.replace(/\/\s*$/, '');
      return `<${stripDuplicateAttrs(`${tag}${inner}`)} />`;
    }
    return `<${stripDuplicateAttrs(`${tag}${attrs}`)}>`;
  });
  const balance = (tag) => {
    const re = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
    let openCount = 0;
    let m;
    while ((m = re.exec(t))) {
      if (String(m[1] || '').trim().endsWith('/')) continue;
      openCount += 1;
    }
    const closes = (t.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (openCount > closes) {
      t = t.replace(/<\/svg>\s*$/i, `${`</${tag}>`.repeat(openCount - closes)}</svg>`);
    }
  };
  balance('defs');
  balance('clipPath');
  balance('mask');
  balance('g');
  if ((t.match(/"/g) || []).length % 2 === 1) return '';
  return t;
}

function ensureSvg(svg) {
  let t = sanitizeSvgMarkup(svg);
  if (!t) return '';
  if (!/^<svg[\s>]/i.test(t)) {
    t = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${t}</svg>`;
  }
  if (!/\sxmlns=/i.test(t)) {
    t = t.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  t = t.replace(/currentColor/gi, '#7bdf8c');
  return t;
}

function cacheKey(svg, bg, size) {
  return crypto.createHash('sha1').update(`${size}|${bg}|${svg}`).digest('hex');
}

async function rasterOne(item) {
  const id = String(item?.id || '');
  const bg = String(item?.bg || '#101816');
  const svg = ensureSvg(item?.svg);
  if (!svg) {
    return { id, ok: false, error: 'empty svg' };
  }
  const key = cacheKey(svg, bg, SIZE);
  const cachePath = path.join(CACHE_DIR, `${key}.png`);
  try {
    if (fs.existsSync(cachePath)) {
      const buf = fs.readFileSync(cachePath);
      return { id, ok: true, pngBase64: buf.toString('base64'), cached: true };
    }
  } catch {
    /* ignore cache read */
  }

  try {
    const svgBuf = Buffer.from(svg, 'utf8');
    const icon = await sharp(svgBuf, { density: 192 })
      .resize(Math.round(SIZE * 0.72), Math.round(SIZE * 0.72), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const pad = Math.round((SIZE - Math.round(SIZE * 0.72)) / 2);
    const out = await sharp({
      create: {
        width: SIZE,
        height: SIZE,
        channels: 4,
        background: bg,
      },
    })
      .composite([{ input: icon, left: pad, top: pad }])
      .png()
      .toBuffer();

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cachePath, out);
    } catch {
      /* cache write optional */
    }
    return { id, ok: true, pngBase64: out.toString('base64'), cached: false };
  } catch (err) {
    return { id, ok: false, error: String(err?.message || err) };
  }
}

async function main() {
  let items;
  try {
    items = readInput();
  } catch (err) {
    process.stdout.write(JSON.stringify([{ id: '', ok: false, error: `input parse: ${err.message}` }]));
    process.exit(1);
  }
  if (!Array.isArray(items)) {
    process.stdout.write(JSON.stringify([{ id: '', ok: false, error: 'input must be a JSON array' }]));
    process.exit(1);
  }
  const results = [];
  for (const item of items) {
    results.push(await rasterOne(item));
  }
  process.stdout.write(JSON.stringify(results));
}

main().catch((err) => {
  process.stdout.write(JSON.stringify([{ id: '', ok: false, error: String(err?.message || err) }]));
  process.exit(1);
});
