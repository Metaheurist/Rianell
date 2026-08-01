#!/usr/bin/env node
/**
 * Live A / B / C preview while Gemma polish runs.
 *
 *   A = ORIGINAL (register currentPayload)
 *   B = QWEN (Stage 1 artifact)
 *   C = GEMMA (polished artifact)
 *
 * Usage:
 *   node scripts/dev/visual-polish-live-preview.mjs
 *   node scripts/dev/visual-polish-live-preview.mjs --port=8766 --limit=10
 *
 * Query params (override CLI defaults):
 *   /?limit=10&offset=0         (batch size; UI lazy-loads next 10 on scroll)
 *   /?limit=0&offset=0          (0 = all — avoid unless debugging)
 *   /?id=sprite:icon-user
 *   /?qa=1&limit=6&offset=0     (screenshot QA page — no infinite scroll)
 *   /api/gallery?limit=10&offset=0
 *
 * Layout: each ROW is one register id (theme variants = separate rows).
 * Columns A/B/C are pipeline stages for THAT id — not themes.
 * Browser UI loads 10 at a time and fetches more as you scroll.
 * Floating HUD (top-right): animation/GPU toggles, compact stats, load/unload.
 * Markup lives in scripts/dev/visual-polish-live-preview.html
 *
 * Open http://localhost:8766/ — auto-polls every 4s as polish checkpoint updates.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  resolveStageB,
  resolveRegisterPayload,
  hydratePolishedPayload,
} from './visual-polish-queue.mjs';
import {
  stemFromId,
  teamRank,
  wrapSvg,
  uniqueIds,
  buildAnimStageHtml,
  keyframesFromSources,
} from './visual-gallery-shared.mjs';
import { deriveQaStatus } from './visual-polish-qa-status.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const artRoot = path.join(root, 'artifacts/visual-gen');
const polishCpPath = path.join(artRoot, 'polish-checkpoint.json');
const genCpPath = path.join(artRoot, 'checkpoint.json');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');

const OLLAMA_HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const POLISH_MODEL_ENV = process.env.VISUAL_POLISH_MODEL || process.env.OLLAMA_MODEL || null;
const POLISH_NUM_CTX = Number(process.env.VISUAL_POLISH_NUM_CTX || 32768);
const MODEL_PREF_PATH = path.join(artRoot, 'polish-model-preference.json');
const CATALOG_PATH = path.join(root, 'scripts/dev/agentic-pipeline/model-catalog.json');
const DEFAULT_POLISH_ALLOWED = ['gemma4:31b-it-qat'];
const DEFAULT_POLISH_RECOMMENDED = 'gemma4:31b-it-qat';

function loadPolishModelCatalog() {
  try {
    const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const polish = cat?.packs?.visual?.stages?.polish || {};
    const allowed = Array.isArray(polish.allowed) && polish.allowed.length
      ? polish.allowed
      : (cat?.packs?.visual?.allowed || DEFAULT_POLISH_ALLOWED);
    return {
      recommended: polish.recommended || cat?.packs?.visual?.recommended || DEFAULT_POLISH_RECOMMENDED,
      allowed: [...new Set(allowed)],
    };
  } catch {
    return { recommended: DEFAULT_POLISH_RECOMMENDED, allowed: DEFAULT_POLISH_ALLOWED };
  }
}

function readModelPreference() {
  try {
    if (!fs.existsSync(MODEL_PREF_PATH)) return null;
    const j = JSON.parse(fs.readFileSync(MODEL_PREF_PATH, 'utf8'));
    return j?.polishModel || null;
  } catch {
    return null;
  }
}

function writeModelPreference(polishModel) {
  fs.mkdirSync(artRoot, { recursive: true });
  fs.writeFileSync(
    MODEL_PREF_PATH,
    JSON.stringify({ polishModel, updatedAt: new Date().toISOString() }, null, 2) + '\n',
    'utf8',
  );
}

const args = process.argv.slice(2);
const portArg = args.find((a) => a.startsWith('--port='));
const limitArg = args.find((a) => a.startsWith('--limit='));
const PORT = Number(portArg?.split('=')[1] || process.env.VISUAL_PREVIEW_PORT || 8766);
/** Default API/page batch size (0 = all). UI lazy-loads in batches of 10. */
const DEFAULT_LIMIT = Math.max(0, Number(limitArg?.split('=')[1] ?? 10));

let ollamaCache = { at: 0, data: null };

async function probeOllama(modelName) {
  const now = Date.now();
  if (ollamaCache.data && now - ollamaCache.at < 8000) return ollamaCache.data;
  const out = {
    host: OLLAMA_HOST,
    reachable: false,
    loaded: [],
    activeForPolish: null,
    details: null,
  };
  try {
    const psRes = await fetch(`${OLLAMA_HOST}/api/ps`, { signal: AbortSignal.timeout(1500) });
    if (psRes.ok) {
      const ps = await psRes.json();
      out.reachable = true;
      out.loaded = (ps.models || []).map((m) => ({
        name: m.name || m.model,
        size: m.size,
        sizeVram: m.size_vram,
        expiresAt: m.expires_at,
        details: m.details || null,
      }));
      out.activeForPolish = out.loaded.find((m) => m.name === modelName) || out.loaded[0] || null;
    }
  } catch {
    /* offline */
  }
  if (modelName && out.reachable) {
    try {
      const showRes = await fetch(`${OLLAMA_HOST}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(2000),
      });
      if (showRes.ok) {
        const show = await showRes.json();
        out.details = {
          family: show.details?.family || null,
          parameterSize: show.details?.parameter_size || null,
          quantization: show.details?.quantization_level || null,
          format: show.details?.format || null,
          parentModel: show.details?.parent_model || null,
        };
      }
    } catch {
      /* ignore show failures */
    }
  }
  ollamaCache = { at: now, data: out };
  return out;
}

function fmtBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} GB`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} MB`;
  return `${v} B`;
}

function describeModelTag(name) {
  const n = String(name || '');
  const bits = [];
  if (/gemma/i.test(n)) bits.push('Gemma family');
  if (/qwen/i.test(n)) bits.push('Qwen family');
  const params = n.match(/(\d+(?:\.\d+)?)b/i);
  if (params) bits.push(`~${params[1]}B params`);
  if (/\bit\b|-it-/i.test(n)) bits.push('instruction-tuned');
  if (/qat/i.test(n)) bits.push('QAT quant');
  else if (/q[48]/i.test(n)) bits.push('quantized');
  return bits;
}

async function buildModelInfo(polishCp, genCp) {
  const catalog = loadPolishModelCatalog();
  const preferred = readModelPreference();
  const polishModel = POLISH_MODEL_ENV
    || preferred
    || polishCp.model
    || catalog.recommended
    || DEFAULT_POLISH_RECOMMENDED;
  const genModel = genCp.model || null;
  const ollama = await probeOllama(polishModel);
  const active = ollama.activeForPolish;
  return {
    role: 'Stage 2 polish (column C)',
    polishModel,
    polishModelHints: describeModelTag(polishModel),
    polishEnvOverride: POLISH_MODEL_ENV || null,
    polishPreferred: preferred,
    polishAllowed: catalog.allowed,
    polishRecommended: catalog.recommended,
    polishSelectable: !POLISH_MODEL_ENV,
    polishNumCtx: POLISH_NUM_CTX,
    polishPipeline: polishCp.pipeline || 'subject-lock→polish→comparative→final-drift',
    polishUpdatedAt: polishCp.updatedAt || null,
    genRole: 'Stage 1 gen (column B)',
    genModel,
    genModelHints: describeModelTag(genModel),
    genUpdatedAt: genCp.updatedAt || null,
    stages: {
      A: 'Original register glyph / @keyframes',
      B: genModel ? `Qwen gen · ${genModel}` : 'Qwen gen artifact',
      C: `Gemma polish · ${polishModel}`,
    },
    ollama: {
      host: ollama.host,
      reachable: ollama.reachable,
      loadedNow: ollama.loaded.map((m) => m.name),
      polishLoaded: !!(active && active.name === polishModel),
      vram: fmtBytes(active?.sizeVram || active?.size),
      details: ollama.details,
    },
  };
}
function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function readMaybe(relOrAbs) {
  if (!relOrAbs) return '';
  const abs = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(root, relOrAbs);
  if (!fs.existsSync(abs)) return '';
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return '';
  }
}

/**
 * @param {{ limit?: number, offset?: number, id?: string|null }} opts
 */
export async function buildGallery(opts = {}) {
  const reg = loadJson(registerPath, { entries: [] });
  const polishCp = loadJson(polishCpPath, { completed: {}, failed: {} });
  const genCp = loadJson(genCpPath, { completed: {} });
  const byId = new Map((reg.entries || []).map((e) => [e.id, e]));

  let completed = Object.entries(polishCp.completed || {})
    .map(([id, meta]) => ({ id, ...meta }));

  // Stem → theme order so mint/mono/rainbow of the same icon sit together
  // (not newest-first, which mixes unrelated glyphs).
  completed.sort((a, b) => {
    const sa = stemFromId(a.id);
    const sb = stemFromId(b.id);
    if (sa !== sb) return sa.localeCompare(sb);
    const ea = byId.get(a.id) || {};
    const eb = byId.get(b.id) || {};
    const tr = teamRank(ea.team) - teamRank(eb.team);
    if (tr !== 0) return tr;
    return String(a.id).localeCompare(String(b.id));
  });

  const idFilter = opts.id ? String(opts.id) : null;
  if (idFilter) completed = completed.filter((row) => row.id === idFilter);

  const eligible = (reg.entries || []).filter((e) => e.genStatus !== 'skip' && genCp.completed?.[e.id]).length;
  const polished = Object.keys(polishCp.completed || {}).length;
  const failedMap = polishCp.failed || {};
  const failedItems = Object.entries(failedMap).map(([id, meta]) => {
    const reason = String(meta?.reason || 'unknown');
    const lower = reason.toLowerCase();
    let kind = 'unknown';
    if (/allocate memory|resource limitations|model runner has unexpectedly stopped|http 500/i.test(lower)) {
      kind = 'ollama-oom';
    } else if (/missing raw|non-svg|empty/i.test(lower)) {
      kind = 'input';
    } else if (/timeout|abort/i.test(lower)) {
      kind = 'timeout';
    }
    return {
      id,
      at: meta?.at || null,
      reason,
      kind,
      remediation: kind === 'ollama-oom'
        ? 'Free VRAM (close other GPU apps / unload extra models), then: node scripts/dev/visual-polish-queue.mjs --force-failed'
        : 'Inspect reason; then --force-failed to retry',
    };
  }).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const failed = failedItems.length;
  const pending = Math.max(0, eligible - polished - failed);

  const limitRaw = opts.limit;
  const limit = limitRaw === 0 || limitRaw === '0'
    ? completed.length
    : Math.max(1, Number(limitRaw ?? DEFAULT_LIMIT) || DEFAULT_LIMIT);
  const offset = Math.max(0, Number(opts.offset || 0) || 0);
  const page = completed.slice(offset, offset + limit);

  const items = [];
  for (const row of page) {
    const entry = byId.get(row.id) || {};
    const vb = entry.viewBox || '0 0 24 24';
    const resolvedA = resolveRegisterPayload(entry);
    const aRaw = (resolvedA.kind === 'svg' || resolvedA.kind === 'svg-resolved')
      ? resolvedA.text
      : (entry.currentPayload || '');
    const bRaw = readMaybe(entry.outputPath);
    const cRawFile = readMaybe(row.outputPath);
    const hydratedC = hydratePolishedPayload(cRawFile, entry);
    const cRaw = (hydratedC.kind === 'svg' || hydratedC.kind === 'svg-hydrated')
      ? hydratedC.text
      : '';
    const stageB = resolveStageB(bRaw, aRaw);
    const aSvg = uniqueIds(wrapSvg(aRaw, vb), `a${items.length}`);
    const bSvg = uniqueIds(
      wrapSvg(stageB.source === 'qwen' ? stageB.text : aRaw, vb),
      `b${items.length}`,
    );
    const cSvg = uniqueIds(wrapSvg(cRaw, vb), `c${items.length}`);

    const aKf = keyframesFromSources(entry.currentPayload, aRaw, resolvedA.text);
    const bKf = keyframesFromSources(
      stageB.source === 'qwen' ? stageB.text : '',
      bRaw,
      stageB.source !== 'qwen' ? entry.currentPayload : '',
    ) || (stageB.source !== 'qwen' ? aKf : null);
    const cKf = keyframesFromSources(
      hydratedC.kind === 'css-anim' ? hydratedC.text : '',
      cRawFile,
      entry.currentPayload,
    );
    const isAnimPreview = !!(aKf || bKf || cKf)
      || entry.kind === 'animation'
      || resolvedA.kind === 'css-anim'
      || hydratedC.kind === 'css-anim';

    const idx = items.length;
    const aAnim = aKf ? buildAnimStageHtml(aKf, `a${idx}`, entry.id) : '';
    const bAnim = bKf ? buildAnimStageHtml(bKf, `b${idx}`, entry.id) : '';
    const cAnim = cKf ? buildAnimStageHtml(cKf, `c${idx}`, entry.id) : '';

    const looksCss = !!(aKf || bKf || cKf)
      || resolvedA.kind === 'css-anim'
      || hydratedC.kind === 'css-anim'
      || /@keyframes\s+/i.test(cRawFile || entry.currentPayload || '');

    const cMissingReason = !cSvg && !cAnim
      ? (looksCss ? 'css-anim'
        : hydratedC.kind === 'js-stub' ? 'js-stub'
          : (cRawFile ? 'non-svg' : 'missing'))
      : null;
    items.push({
      id: row.id,
      stem: stemFromId(row.id),
      team: entry.team || null,
      kind: entry.kind || null,
      at: row.at || null,
      bytes: row.bytes || 0,
      pipeline: row.pipeline || null,
      forcedReelback: !!row.forcedReelback,
      driftSuspectAfter: !!row.driftSuspectAfter,
      stageBSource: row.stageBSource || stageB.source,
      bChatty: stageB.source !== 'qwen',
      aPayloadKind: resolvedA.kind,
      a: aSvg,
      b: bSvg,
      c: cSvg,
      aAnim,
      bAnim,
      cAnim,
      isAnimPreview,
      animName: aKf?.name || bKf?.name || cKf?.name || null,
      aMissing: !aSvg && !aAnim,
      aMissingReason: !aSvg && !aAnim
        ? (resolvedA.kind === 'js-stub' ? 'js-stub'
          : resolvedA.kind === 'css-anim' ? 'css-anim' : 'missing')
        : null,
      bMissing: !bSvg && !bAnim,
      cMissing: !cSvg && !cAnim,
      cMissingReason,
      cHydrated: hydratedC.kind === 'svg-hydrated',
    });
  }

  const modelInfo = await buildModelInfo(polishCp, genCp);
  const counts = {
    eligible,
    polished,
    failed,
    pending,
    showing: items.length,
    offset,
    limit,
    totalMatching: completed.length,
  };

  return {
    updatedAt: polishCp.updatedAt || null,
    model: polishCp.model || modelInfo.polishModel,
    pipeline: polishCp.pipeline || modelInfo.polishPipeline,
    modelInfo,
    counts,
    qa: deriveQaStatus(counts),
    failedItems,
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  if (url.pathname === '/api/model' && req.method === 'POST') {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      const catalog = loadPolishModelCatalog();
      const polishModel = String(body.polishModel || '').trim();
      if (!polishModel || !catalog.allowed.includes(polishModel)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          error: 'model not allowed',
          allowed: catalog.allowed,
          recommended: catalog.recommended,
        }));
        return;
      }
      if (POLISH_MODEL_ENV) {
        res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          error: 'VISUAL_POLISH_MODEL env overrides UI selection',
          polishEnvOverride: POLISH_MODEL_ENV,
        }));
        return;
      }
      writeModelPreference(polishModel);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({
        ok: true,
        polishModel,
        note: 'Preference saved. Restart visual:polish queue to use the new model.',
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
    }
    return;
  }
  if (url.pathname === '/api/gallery') {
    try {
      const body = JSON.stringify(await buildGallery(parseGalleryOpts(url)));
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: String(err?.message || err) }));
    }
    return;
  }
  if (url.pathname === '/visual-gallery-skin.css') {
    const cssPath = path.join(__dirname, 'visual-gallery-skin.css');
    if (!fs.existsSync(cssPath)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(fs.readFileSync(cssPath, 'utf8'));
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/live') {
    // Inject shared skin inline so styles never depend on a second request
    // (avoids unstyled white/serif fallback if CSS 404s or an old process is up).
    const htmlPath = path.join(__dirname, 'visual-polish-live-preview.html');
    const cssPath = path.join(__dirname, 'visual-gallery-skin.css');
    let page = fs.readFileSync(htmlPath, 'utf8');
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      const style = `<style id="visual-gallery-skin">\n${css}\n</style>`;
      if (/<style\s+id=["']visual-gallery-skin["'][\s\S]*?<\/style>/i.test(page)) {
        page = page.replace(
          /<style\s+id=["']visual-gallery-skin["'][\s\S]*?<\/style>/i,
          style,
        );
      } else {
        page = page.replace(
          /<link\s+rel=["']stylesheet["']\s+href=["']\/visual-gallery-skin\.css["']\s*\/?>/i,
          style,
        );
      }
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(page);
    return;
  }
  res.writeHead(404).end('not found');
});

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
  server.listen(PORT, () => {
    console.log(`[visual-polish-live] http://localhost:${PORT}/  (A/B/C · poll 4s · defaultLimit=${DEFAULT_LIMIT})`);
  });
}
