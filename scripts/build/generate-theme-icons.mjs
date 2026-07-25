#!/usr/bin/env node
/**
 * Extract plain icon sprite + generate fancy team sprites (hand-authored heroes +
 * claymorphic wraps for remaining symbols). Budget-gated via THEME_FX_TOKENS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGzip } from 'zlib';
import { createHash } from 'crypto';
import { THEME_FX_TOKENS, getTeamIds } from '@rianell/tokens';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const pwa = path.join(root, 'apps/pwa-webapp');
const assetsDir = path.join(pwa, 'assets');
const indexPath = path.join(pwa, 'index.html');
const fancyOverrideDir = path.join(root, 'artifacts/visual-gen/fancy-overrides');

/** Prefer Ollama fancy override fragment when present (visual-gen-apply). */
function loadFancyOverride(symbolId, team) {
  const key = `fancy__${symbolId}__${team}`;
  const file = path.join(fancyOverrideDir, `${key}.svgfrag`);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8').trim();
  if (!text || /<script[\s>]/i.test(text)) return null;
  return text
    .replace(/^```(?:svg|xml)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();
}

/** Hand-authored fancy heroes (~20) — plan Phase 2a */
const HEROES = [
  'icon-weather-clear',
  'icon-weather-cloudy',
  'icon-weather-rain',
  'icon-weather-partly-cloudy',
  'icon-palette',
  'icon-brain',
  'icon-heart-pulse',
  'icon-leaf',
  'icon-cloud',
  'icon-star',
  'icon-check',
  'icon-user',
  'icon-activity',
  'icon-calendar',
  'icon-chart-bars',
  'icon-sparkle-ring',
  'icon-shield-check',
  'icon-zap',
  'icon-sleep',
  'icon-pill',
];

function gzipKb(buf) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const gz = createGzip({ level: 9 });
    gz.on('data', (c) => chunks.push(c));
    gz.on('end', () => resolve(Buffer.concat(chunks).length / 1024));
    gz.on('error', reject);
    gz.end(buf);
  });
}

function contentHash(buf, len = 10) {
  return createHash('sha256').update(buf).digest('hex').slice(0, len);
}

/** Light SVGO-less minify */
function minifySvg(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractDefs(html) {
  const m = html.match(/<svg[^>]*id="icon-defs"[^>]*>([\s\S]*?)<\/svg>/i)
    || html.match(/<svg[^>]*class="rianell-icon-sprite"[^>]*>([\s\S]*?)<\/svg>/i);
  if (!m) throw new Error('icon sprite host not found in index.html');
  return m[1];
}

function parseSymbols(defsInner) {
  const out = [];
  const re = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi;
  let m;
  while ((m = re.exec(defsInner)) !== null) {
    const attrs = m[1];
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/);
    if (!idMatch) continue;
    out.push({ id: idMatch[1], attrs: attrs.trim(), inner: m[2].trim() });
  }
  return out;
}

/** Nav emblems live outside the main sprite — include in fancy packs for bold intensity. */
function parseNavSymbols(html) {
  const out = [];
  const re = /<symbol[^>]*id=["'](rianell-nav-[^"']+)["'][^>]*>([\s\S]*?)<\/symbol>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ id: m[1], attrs: `id="${m[1]}"`, inner: m[2].trim() });
  }
  return out;
}

function loadNavFancyOverride(navId, team) {
  const key = `fancy-nav__${navId}__${team}`;
  const file = path.join(fancyOverrideDir, `${key}.svgfrag`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').trim()
    .replace(/^```(?:svg|xml)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();
}

function teamAccent(team) {
  const t = THEME_FX_TOKENS.teams[team] || {};
  return {
    glow: t.glow || '#7bdf8c',
    alt: t.particleColorAlt || t.glow || '#a8e6cf',
    prism: t.prism || null,
  };
}

/** Hand-authored claymorphic hero treatments (unique per icon family). */
function fancyHeroInner(sym, team) {
  const { glow, alt, prism } = teamAccent(team);
  const gid = `g-${sym.id}-${team}`.replace(/[^a-z0-9-]/gi, '');
  const fill = prism ? `url(#${gid}-prism)` : glow;
  const defs = prism
    ? `<defs><linearGradient id="${gid}-prism" x1="0" y1="0" x2="1" y2="1">${prism.map((c, i) => `<stop offset="${(i / (prism.length - 1)) * 100}%" stop-color="${c}"/>`).join('')}</linearGradient><filter id="${gid}-soft"><feGaussianBlur stdDeviation="0.6"/></filter></defs>`
    : `<defs><radialGradient id="${gid}-blob" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="${alt}" stop-opacity="0.95"/><stop offset="100%" stop-color="${glow}" stop-opacity="0.55"/></radialGradient><filter id="${gid}-soft"><feGaussianBlur stdDeviation="0.55"/></filter></defs>`;

  const blobFill = prism ? fill : `url(#${gid}-blob)`;

  let motif = '';
  if (sym.id.includes('leaf')) {
    motif = `<ellipse cx="12" cy="13" rx="7.5" ry="9" fill="${blobFill}" opacity="0.35" filter="url(#${gid}-soft)"/><path d="M12 4c4 3 6 7 6 11-2 4-10 4-12 0 0-4 2-8 6-11z" fill="${glow}" opacity="0.45"/>`;
  } else if (sym.id.includes('zap') || sym.id.includes('thunder')) {
    motif = `<path d="M12 3c3 4 5 6 5 10a5 5 0 11-10 0c0-2 1.5-4.5 3-6.5C11 5 12 3 12 3z" fill="${blobFill}" opacity="0.5"/><circle cx="12" cy="16" r="2.2" fill="${alt}"/>`;
  } else if (sym.id.includes('heart')) {
    motif = `<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" fill="${blobFill}" opacity="0.4"/>`;
  } else if (sym.id.includes('cloud') || sym.id.includes('weather-rain') || sym.id.includes('weather-cloudy')) {
    motif = `<ellipse cx="12" cy="14" rx="8" ry="5.5" fill="${blobFill}" opacity="0.4" filter="url(#${gid}-soft)"/><circle cx="8" cy="12" r="3.5" fill="${glow}" opacity="0.35"/><circle cx="15" cy="11" r="4" fill="${alt}" opacity="0.35"/>`;
  } else if (sym.id.includes('moon') || sym.id.includes('sun') || sym.id.includes('star') || sym.id.includes('sparkle') || sym.id.includes('weather-clear')) {
    motif = `<circle cx="12" cy="12" r="7.5" fill="${blobFill}" opacity="0.32" filter="url(#${gid}-soft)"/><circle cx="12" cy="12" r="3.2" fill="${glow}" opacity="0.55"/>`;
  } else if (sym.id.includes('shield') || sym.id.includes('check')) {
    motif = `<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" fill="${blobFill}" opacity="0.38"/>`;
  } else if (sym.id.includes('home') || sym.id.includes('settings') || sym.id.includes('user') || sym.id.includes('calendar') || sym.id.includes('chart')) {
    motif = `<rect x="4.5" y="5" width="15" height="14" rx="4" fill="${blobFill}" opacity="0.32" filter="url(#${gid}-soft)"/>`;
  } else if (sym.id.includes('palette') || sym.id.includes('brain') || sym.id.includes('activity') || sym.id.includes('partly') || sym.id.includes('pill')) {
    motif = `<circle cx="12" cy="12" r="8" fill="${blobFill}" opacity="0.28" filter="url(#${gid}-soft)"/><circle cx="8" cy="9" r="1.6" fill="${glow}"/><circle cx="15" cy="8" r="1.4" fill="${alt}"/><circle cx="14" cy="15" r="1.5" fill="${glow}"/>`;
  } else {
    motif = `<circle cx="12" cy="12" r="8.5" fill="${blobFill}" opacity="0.3" filter="url(#${gid}-soft)"/>`;
  }

  // Screenshot contract: dashed outer ring + soft fill behind glyph
  const ring = `<circle cx="12" cy="12" r="10.5" fill="none" stroke="${glow}" stroke-width="1" opacity="0.55"/><circle cx="12" cy="12" r="8.6" fill="none" stroke="${glow}" stroke-width="1" stroke-dasharray="2 2" opacity="0.7"/>`;

  return `${defs}<g class="fancy-clay">${ring}${motif}<g class="fancy-glyph">${sym.inner}</g></g>`;
}

function fancyWrapRemaining(sym, team) {
  const { glow, alt } = teamAccent(team);
  const gid = `w-${sym.id}-${team}`.replace(/[^a-z0-9-]/gi, '');
  return `<defs><radialGradient id="${gid}" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="${alt}" stop-opacity="0.55"/><stop offset="100%" stop-color="${glow}" stop-opacity="0.2"/></radialGradient></defs><circle cx="12" cy="12" r="10" fill="url(#${gid})" opacity="0.85"/><g opacity="0.95">${sym.inner}</g>`;
}

function buildSprite(symbols, team) {
  const heroSet = new Set(HEROES);
  const parts = [];
  let overrideHits = 0;
  for (const sym of symbols) {
    const fancyId = `${sym.id}--fancy`;
    const override = loadFancyOverride(sym.id, team);
    let inner;
    if (override) {
      inner = override;
      overrideHits += 1;
    } else {
      const isHero = heroSet.has(sym.id);
      inner = isHero ? fancyHeroInner(sym, team) : fancyWrapRemaining(sym, team);
    }
    parts.push(`<symbol id="${fancyId}" viewBox="0 0 24 24">${inner}</symbol>`);
  }
  if (overrideHits) {
    console.log(`[theme-icons] ${team}: using ${overrideHits} Ollama fancy overrides`);
  }
  return parts;
}

function wrapFancySprite(parts, team) {
  return minifySvg(
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true" data-theme-sprite="fancy-${team}">${parts.join('')}</svg>`
  );
}

function buildPlainSprite(symbols) {
  const clean = symbols.map((s) => {
    const vb = /\bviewBox=["']([^"']+)["']/.exec(s.attrs);
    const viewBox = vb ? vb[1] : '0 0 24 24';
    return `<symbol id="${s.id}" viewBox="${viewBox}">${s.inner}</symbol>`;
  });
  return minifySvg(
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true" id="icon-sprite-plain" data-theme-sprite="plain">${clean.join('')}</svg>`
  );
}

fs.mkdirSync(assetsDir, { recursive: true });
const html = fs.readFileSync(indexPath, 'utf8');
const symbols = parseSymbols(extractDefs(html));
const navSymbols = parseNavSymbols(html);
if (!symbols.length) throw new Error('No symbols parsed');

const missingHeroes = HEROES.filter((id) => !symbols.some((s) => s.id === id));
if (missingHeroes.length) {
  console.error('[theme-icons] missing hero symbols:', missingHeroes.join(', '));
  process.exit(1);
}

const plainSvg = buildPlainSprite(symbols);
const plainBuf = Buffer.from(plainSvg, 'utf8');
const plainHash = contentHash(plainBuf);
fs.writeFileSync(path.join(assetsDir, 'icon-sprite-plain.svg'), plainSvg);

const teams = getTeamIds();
const fancyMeta = {};
let failedBudget = false;
const maxFancy = THEME_FX_TOKENS.budgets.fancySpriteGzipMaxKb;
const maxPlain = THEME_FX_TOKENS.budgets.plainSpriteGzipMaxKb;

const plainKb = await gzipKb(plainBuf);
if (plainKb > maxPlain) {
  console.error(`[theme-icons] plain sprite ${plainKb.toFixed(1)}KB gzip > ${maxPlain}KB`);
  failedBudget = true;
}

const fancyPaths = [];
for (const team of teams) {
  const parts = buildSprite(symbols, team);
  for (const nav of navSymbols) {
    const fancyId = `${nav.id}--fancy`;
    const override = loadNavFancyOverride(nav.id, team);
    const inner = override || fancyWrapRemaining(nav, team);
    parts.push(`<symbol id="${fancyId}" viewBox="0 0 24 24">${inner}</symbol>`);
  }
  const fancy = wrapFancySprite(parts, team);
  const buf = Buffer.from(fancy, 'utf8');
  const hash = contentHash(buf);
  const name = `icon-sprite-fancy-${team}.svg`;
  fs.writeFileSync(path.join(assetsDir, name), fancy);
  fancyPaths.push(`assets/${name}`);
  const kb = await gzipKb(buf);
  fancyMeta[team] = {
    gzipKb: Number(kb.toFixed(2)),
    bytes: buf.length,
    hash,
    symbolCount: (fancy.match(/<symbol/g) || []).length,
  };
  if (kb > maxFancy) {
    console.error(`[theme-icons] ${team} fancy ${kb.toFixed(1)}KB gzip > ${maxFancy}KB`);
    failedBudget = true;
  } else {
    console.log(`[theme-icons] ${team}: ${kb.toFixed(1)}KB gzip, ${fancyMeta[team].symbolCount} symbols`);
  }
}

const budget = {
  plainSpriteGzipKb: Number(plainKb.toFixed(2)),
  plainMaxKb: maxPlain,
  fancyMaxKb: maxFancy,
  plainHash,
  plainBytes: plainBuf.length,
  plainSymbolCount: symbols.length,
  heroes: HEROES,
  teams: fancyMeta,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(assetsDir, 'icon-sprite-budget.json'), JSON.stringify(budget, null, 2) + '\n');

const manifestPath = path.join(pwa, 'asset-manifest.json');
let manifest = {};
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    manifest = {};
  }
}
manifest.plainIconSprite = 'assets/icon-sprite-plain.svg';
manifest.plainIconSpriteHash = plainHash;
manifest.fancyIconSprites = fancyPaths;
manifest.fancyIconSpriteHashes = Object.fromEntries(teams.map((t) => [t, fancyMeta[t].hash]));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

if (failedBudget) {
  console.error('[theme-icons] budget failed');
  process.exit(1);
}
console.log(`[theme-icons] OK plain=${plainKb.toFixed(1)}KB gzip heroes=${HEROES.length} symbols=${symbols.length}`);
