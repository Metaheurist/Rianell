#!/usr/bin/env node
/**
 * Current visual gallery — app-runtime icons & animations (no A/B/C pipeline).
 *
 * Prefer applied visual-overrides.generated.js markup, else resolveRegisterPayload.
 *
 * Usage:
 *   node scripts/dev/visual-current-gallery.mjs --json --limit=0
 *   node scripts/dev/visual-current-gallery.mjs --json --limit=10 --offset=0
 *   node scripts/dev/visual-current-gallery.mjs --serve --port=8767
 *
 * Served permanently by the Python debug server at:
 *   GET /dev/visual-gallery
 *   GET /api/visual-gallery
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveRegisterPayload } from './visual-polish-queue.mjs';
import {
  stemFromId,
  teamRank,
  wrapSvg,
  uniqueIds,
  buildAnimStageHtml,
  designatedAnimIcon,
  keyframesFromSources,
} from './visual-gallery-shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
const overridesPath = path.join(root, 'apps/pwa-webapp/modules/visual-overrides.generated.js');

const args = process.argv.slice(2);
const portArg = args.find((a) => a.startsWith('--port='));
const limitArg = args.find((a) => a.startsWith('--limit='));
const offsetArg = args.find((a) => a.startsWith('--offset='));
const idArg = args.find((a) => a.startsWith('--id='));
const wantJson = args.includes('--json');
const wantServe = args.includes('--serve');
const PORT = Number(portArg?.split('=')[1] || process.env.VISUAL_GALLERY_PORT || 8767);
const DEFAULT_LIMIT = Math.max(0, Number(limitArg?.split('=')[1] ?? 10));

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

/**
 * Parse `var OVERRIDES = {…}` from visual-overrides.generated.js without eval of the full file.
 * @returns {Record<string, { kind?: string, viewBox?: string, markup?: string }>}
 */
export function loadVisualOverridesMap(filePath = overridesPath) {
  if (!fs.existsSync(filePath)) return {};
  let src;
  try {
    src = fs.readFileSync(filePath, 'utf8');
  } catch {
    return {};
  }
  const marker = 'var OVERRIDES = ';
  const start = src.indexOf(marker);
  if (start < 0) return {};
  let i = start + marker.length;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (src[i] !== '{') return {};
  let depth = 0;
  let inStr = false;
  let strQ = '';
  let escaped = false;
  const from = i;
  for (; i < src.length; i += 1) {
    const ch = src[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === strQ) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      strQ = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const jsonText = src.slice(from, i + 1);
        try {
          return JSON.parse(jsonText);
        } catch {
          return {};
        }
      }
    }
  }
  return {};
}

/**
 * @param {{ limit?: number|string, offset?: number|string, id?: string|null, overridesMap?: Record<string, unknown>, register?: object }} opts
 */
export function buildCurrentGallery(opts = {}) {
  const reg = opts.register || loadJson(registerPath, { entries: [] });
  const overrides = opts.overridesMap || loadVisualOverridesMap();
  let entries = (reg.entries || []).filter((e) => e && e.genStatus !== 'skip');

  entries.sort((a, b) => {
    const sa = stemFromId(a.id);
    const sb = stemFromId(b.id);
    if (sa !== sb) return sa.localeCompare(sb);
    const tr = teamRank(a.team) - teamRank(b.team);
    if (tr !== 0) return tr;
    return String(a.id).localeCompare(String(b.id));
  });

  const idFilter = opts.id ? String(opts.id) : null;
  if (idFilter) entries = entries.filter((e) => e.id === idFilter);

  const overrideCount = entries.filter((e) => overrides[e.id]?.markup).length;

  const limitRaw = opts.limit;
  const limit = limitRaw === 0 || limitRaw === '0'
    ? entries.length
    : Math.max(1, Number(limitRaw ?? DEFAULT_LIMIT) || DEFAULT_LIMIT);
  const offset = Math.max(0, Number(opts.offset || 0) || 0);
  const page = entries.slice(offset, offset + limit);

  const items = [];
  for (const entry of page) {
    const vb = entry.viewBox || '0 0 24 24';
    const ov = overrides[entry.id];
    const ovMarkup = ov && typeof ov.markup === 'string' ? ov.markup.trim() : '';
    let source = 'empty';
    let raw = '';
    let payloadKind = 'empty';

    if (ovMarkup) {
      source = 'override';
      raw = ovMarkup;
      payloadKind = 'override';
    } else {
      const resolved = resolveRegisterPayload(entry);
      payloadKind = resolved.kind;
      if (resolved.kind === 'svg' || resolved.kind === 'svg-resolved') {
        raw = resolved.text;
        source = 'register';
      } else if (resolved.kind === 'css-anim') {
        raw = resolved.text;
        source = 'register';
      } else if (entry.currentPayload) {
        raw = String(entry.currentPayload);
        source = 'register';
      }
    }

    const idx = items.length;
    const kf = keyframesFromSources(raw, entry.currentPayload);
    const isAnimPreview = !!kf
      || entry.kind === 'animation'
      || payloadKind === 'css-anim'
      || /@keyframes\s+/i.test(raw || '');

    let current = '';
    let currentAnim = '';
    if (kf || payloadKind === 'css-anim' || entry.kind === 'animation') {
      const useKf = kf || keyframesFromSources(raw);
      if (useKf) {
        currentAnim = buildAnimStageHtml(useKf, `c${idx}`, entry.id);
        // Static designated glyph for Tk / sharp thumbs (CSS motion only in Browser).
        const demo = designatedAnimIcon(entry.id || useKf.name);
        current = uniqueIds(wrapSvg(demo.svg, '0 0 48 48'), `c${idx}`);
      }
    }
    if (!currentAnim && !current) {
      current = uniqueIds(wrapSvg(raw, ov?.viewBox || vb), `c${idx}`);
    }

    const missing = !current && !currentAnim;
    let missingReason = null;
    if (missing) {
      if (entry.kind === 'fx' || String(entry.id || '').startsWith('fx:')) {
        missingReason = 'fx';
      } else if (payloadKind === 'js-stub') {
        missingReason = 'js-stub';
      } else if (payloadKind === 'css-anim' || entry.kind === 'animation') {
        missingReason = 'css-anim';
      } else {
        missingReason = 'empty';
      }
      if (source === 'empty') source = 'empty';
    }

    items.push({
      id: entry.id,
      stem: stemFromId(entry.id),
      team: entry.team || null,
      kind: entry.kind || null,
      source,
      payloadKind,
      current,
      currentAnim,
      isAnimPreview,
      animName: kf?.name || null,
      missing,
      missingReason,
    });
  }

  return {
    updatedAt: new Date().toISOString(),
    mode: 'current',
    counts: {
      totalMatching: entries.length,
      showing: items.length,
      overrideCount,
      offset,
      limit,
      registerTotal: (reg.entries || []).length,
      skipped: (reg.entries || []).filter((e) => e?.genStatus === 'skip').length,
    },
    items,
  };
}

function parseGalleryOpts(url) {
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  const idParam = url.searchParams.get('id');
  return {
    limit: limitParam == null ? DEFAULT_LIMIT : Number(limitParam),
    offset: offsetParam == null ? 0 : Number(offsetParam),
    id: idParam || null,
  };
}

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();
  } catch {
    return false;
  }
}

if (isMainModule()) {
  if (wantJson) {
    const data = buildCurrentGallery({
      limit: limitArg ? limitArg.split('=')[1] : DEFAULT_LIMIT,
      offset: offsetArg ? offsetArg.split('=')[1] : 0,
      id: idArg ? idArg.split('=').slice(1).join('=') : null,
    });
    process.stdout.write(JSON.stringify(data));
  } else if (wantServe) {
    const PAGE = fs.readFileSync(path.join(__dirname, 'visual-current-gallery.html'), 'utf8');
    const CSS_PATH = path.join(__dirname, 'visual-gallery-skin.css');
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${PORT}`);
      if (url.pathname === '/api/visual-gallery' || url.pathname === '/api/gallery') {
        const body = JSON.stringify(buildCurrentGallery(parseGalleryOpts(url)));
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(body);
        return;
      }
      if (url.pathname === '/visual-gallery-skin.css') {
        if (!fs.existsSync(CSS_PATH)) {
          res.writeHead(404).end('not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/css; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(fs.readFileSync(CSS_PATH, 'utf8'));
        return;
      }
      if (
        url.pathname === '/'
        || url.pathname === '/index.html'
        || url.pathname === '/dev/visual-gallery'
        || url.pathname === '/live'
      ) {
        const htmlPath = path.join(__dirname, 'visual-current-gallery.html');
        let page = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : PAGE;
        if (fs.existsSync(CSS_PATH)) {
          const css = fs.readFileSync(CSS_PATH, 'utf8');
          const style = `<style id="visual-gallery-skin">\n${css}\n</style>`;
          page = page.replace(
            /<link\s+rel=["']stylesheet["']\s+href=["']\/visual-gallery-skin\.css["']\s*\/?>/i,
            style,
          );
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(page);
        return;
      }
      res.writeHead(404).end('not found');
    });
    server.listen(PORT, () => {
      console.log(`[visual-current-gallery] http://localhost:${PORT}/dev/visual-gallery  (current · defaultLimit=${DEFAULT_LIMIT})`);
    });
  } else {
    console.error('Usage: --json [--limit=N] [--offset=N] [--id=…]  |  --serve [--port=8767]');
    process.exit(1);
  }
}
