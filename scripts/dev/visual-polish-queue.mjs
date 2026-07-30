#!/usr/bin/env node
/**
 * Polish Qwen-generated visual artifacts with Gemma (Brand Guardian / doc-grounded).
 *
 * Pre-flight: scans DESIGN.md + docs/style-and-design/ + docs keyword matches
 * into PROJECT_STYLING_CONTRACT and prepends it (via Ollama `system`) on every polish request.
 *
 * Per-item multi-pass (mandatory) — ONE Ollama chat per item:
 *   1) subject-lock vs ORIGINAL (A)
 *   2) polish Qwen (B) → draft C
 *   3) comparative A/B/C review
 *   4) final polish + drift check-in (reel back to A geometry if drifted)
 *   Then the next item starts a fresh chat (no cross-item history).
 *
 * Usage:
 *   node scripts/dev/visual-polish-queue.mjs
 *   node scripts/dev/visual-polish-queue.mjs --status
 *   node scripts/dev/visual-polish-queue.mjs --qa-stems
 *   node scripts/dev/visual-polish-queue.mjs --force-failed
 *   node scripts/dev/visual-polish-queue.mjs --reset-polished
 *   node scripts/dev/visual-polish-queue.mjs --limit=20
 *   node scripts/dev/visual-polish-queue.mjs --ids=sprite:icon-user,fancy:icon-user:mint
 *   node scripts/dev/visual-polish-queue.mjs --repolish-from-qa
 *
 * Env: OLLAMA_HOST, VISUAL_POLISH_MODEL, VISUAL_POLISH_CONCURRENCY (default 1),
 *      VISUAL_POLISH_NUM_CTX (default 32768), VISUAL_POLISH_CONTRACT_MAX_CHARS
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Agent, setGlobalDispatcher } from 'undici';
import { THEME_FX_TOKENS } from '@rianell/tokens';
import { writeQaProgress, QA_PROGRESS_PATH } from './visual-polish-qa-status.mjs';

setGlobalDispatcher(new Agent({
  headersTimeout: 30 * 60 * 1000,
  bodyTimeout: 30 * 60 * 1000,
  connectTimeout: 60 * 1000,
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
const artRoot = path.join(root, 'artifacts/visual-gen');
const genCpPath = path.join(artRoot, 'checkpoint.json');
const polishCpPath = path.join(artRoot, 'polish-checkpoint.json');
const polishedRoot = path.join(artRoot, 'polished');
const qaBrokenPath = path.join(artRoot, 'qa', 'broken.json');

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const MODEL = process.env.VISUAL_POLISH_MODEL || process.env.OLLAMA_MODEL || 'gemma4:31b-it-qat';
const CONCURRENCY = Math.max(1, Number(process.env.VISUAL_POLISH_CONCURRENCY || 1));
const NUM_CTX = Number(process.env.VISUAL_POLISH_NUM_CTX || 32768);
const CONTRACT_MAX = Number(process.env.VISUAL_POLISH_CONTRACT_MAX_CHARS || 8_000);
const ICON_CONTRACT_ALLOWLIST = [
  'docs/style-and-design/icon-grid.md',
  'docs/style-and-design/icon-stroke-and-fill.md',
  'docs/style-and-design/icon-size-ladder.md',
  'docs/style-and-design/icon-optical-alignment.md',
  'docs/style-and-design/motion-catalogue.md',
  'docs/style-and-design/theme-variants.md',
  'docs/style-and-design/icon-taxonomy.md',
];
const SUBJECT_CONTRACTS_PATH = path.join(root, 'docs/style-and-design/subject-contracts.json');

function loadSubjectContracts() {
  try {
    return JSON.parse(fs.readFileSync(SUBJECT_CONTRACTS_PATH, 'utf8'));
  } catch {
    return { subjects: {} };
  }
}

function subjectRuleCard(entry) {
  const contracts = loadSubjectContracts();
  const hay = `${entry?.id || ''} ${entry?.context || ''}`;
  const lines = [];
  for (const [name, spec] of Object.entries(contracts.subjects || {})) {
    const matchers = Array.isArray(spec.match) ? spec.match : [];
    const hit = matchers.some((m) => {
      try { return new RegExp(m, 'i').test(hay); } catch { return String(hay).toLowerCase().includes(String(m).toLowerCase()); }
    });
    if (!hit) continue;
    lines.push(`SUBJECT_CONTRACT ${name}:`);
    if (spec.required?.length) lines.push(`  required: ${spec.required.join('; ')}`);
    if (spec.forbid?.length) lines.push(`  forbid: ${spec.forbid.join('; ')}`);
  }
  return lines.length ? lines.join('\n') : '';
}

const args = process.argv.slice(2);
const statusOnly = args.includes('--status');
const forceFailed = args.includes('--force-failed');
const qaStems = args.includes('--qa-stems');
const resetPolished = args.includes('--reset-polished');
const repolishFromQa = args.includes('--repolish-from-qa');
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const idsArg = args.find((a) => a.startsWith('--ids='));
const idsFileArg = args.find((a) => a.startsWith('--ids-file='));
function loadIdsSet() {
  if (idsFileArg) {
    const fp = idsFileArg.slice('--ids-file='.length).trim();
    const abs = path.isAbsolute(fp) ? fp : path.join(root, fp);
    try {
      const raw = fs.readFileSync(abs, 'utf8').trim();
      if (raw.startsWith('{') || raw.startsWith('[')) {
        const j = JSON.parse(raw);
        const list = Array.isArray(j) ? j : (j.ids || []);
        return new Set(list.map((s) => String(s).trim()).filter(Boolean));
      }
      return new Set(raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean));
    } catch (err) {
      console.error(`[visual-polish] --ids-file read failed: ${err.message}`);
      return new Set();
    }
  }
  if (idsArg) {
    return new Set(idsArg.slice('--ids='.length).split(',').map((s) => s.trim()).filter(Boolean));
  }
  return null;
}
const IDS = loadIdsSet();

/** Binding Brand Guardian hint list (Stage 2). */
const POLISH_HINT_LIST = `SYSTEM PROMPT FOR VISUAL POLISHER (Gemma 4 31B IT QAT)

You are an expert SVG optimizer and Brand Guardian. Your job is to polish raw Stage 1 SVGs into production-ready UI assets.

You have been provided with ICON_CONTRACT (allowlisted icon/motion design specs). Treat it as the absolute SOURCE OF TRUTH for grid, stroke, size ladder, optical alignment, theme variants, and loop classes.

1. CORE SUBJECT PRESERVATION (NON-NEGOTIABLE)
- THE ORIGINAL SUBJECT IS SACROSANCT. You are strictly forbidden from changing the core geometric identity of the icon.
- If the original input is a "close" icon (an X), the output MUST remain an X.
- If the input is a "medal," it must remain a medal.
- NEVER replace a requested icon with a generic circle, loader, ring, blob, or different shape just because a theme (like "rainbow") is requested.
- If a theme requires styling (e.g., "rainbow", "mint"), apply that theme through color gradients, strokes, glows, or stylistic accents ONTO the existing shape. Do not morph the base geometry.
- Pipeline is B→C (polish Qwen into Gemma). A (ORIGINAL) is the drift safeguard: if C drifts, reel it back to A's geometry while keeping polish quality.
- Do NOT pick a "winner" among A/B/C as a contest. C is always derived from B, constrained by A.
- Every unit includes SITUATIONAL CONTEXT: where it lives in the app (location), surrounding UI/themes/states, its function, and the original A description. Polish must remain appropriate for that placement and job.
- COHESION RULE: Copy A's primary glyph shapes into C verbatim (same path d=, same circle/ellipse cx/cy/r/rx/ry). Theme polish is ONLY additive layers (glow/blob/gradient/classes) behind or around that glyph — never a redesigned silhouette.
- If Stage 1 (B) is chatty or drifted, discard B's geometry and rebuild C from A + theme accents.

1b. THEME COLOR LOCK (FANCY / TEAM VARIANTS — NON-NEGOTIABLE)
- Shape comes from A. Color comes from TEAM — never from A's mint/currentColor appearance.
- When TEAM is set (mint | red-black | mono | rainbow), the glyph fill/stroke MUST use that team's documented tokens (glow / particleColor / particleColorAlt / prism). Do NOT leave the glyph as fill="currentColor" or stroke="currentColor" — that inherits the mint UI chrome and produces "mint logo + hint of team glow".
- red-black: glyph paints with ember reds (#ff8d98 / #ff4d5a) and optional near-black accents — NOT mint green with a pink halo.
- mint: glyph paints with mint tokens (#7bdf8c / #a8e6cf).
- mono: glyph paints with greys (#d0d0d0 / #a0a0a0), not mint.
- rainbow: glyph may use prism gradient stops; accents may use prism colors — not mint-only.
- Plain / non-team sprites may keep currentColor.
- Glow/blob layers use team tokens; the glyph itself must also be team-colored when TEAM is set.

1c. STEM STYLE CONSISTENCY (NON-NEGOTIABLE)
- Variants of the SAME icon stem must share identical core geometry.
- Example: sprite:icon-target and fancy:icon-target:mint|red-black|mono|rainbow are one STEM (icon-target).
- The plain sprite/nav ORIGINAL is the STEM CANONICAL GLYPH. Every fancy/team iteration must copy that exact glyph (same path d=, same circle/ellipse/rect geometry).
- Only style may change across iterations: team colors, glow/blob/rim, claymorphic accents, classes — NEVER a different silhouette, ring count, torso shape, or chart structure.
- If fancy Qwen (B) redesigned the subject, discard B geometry and rebuild from the STEM CANONICAL GLYPH + team polish.

2. DOCS COMPLIANCE & CONFLICT RESOLUTION
- Plain sprites: prefer currentColor / documented CSS variables.
- Fancy/team variants: hardcoded team token hex/gradients from PROJECT_STYLING_CONTRACT / THEME_FX_TOKENS are REQUIRED on the glyph (exception to "strip hex").
- If Stage 1 SVGs violate documented naming/class conventions, refactor them to align with the repository taxonomy.

3. GEOMETRIC SYMMETRY & GRID NORMALIZATION
- Recalculate paths to ensure absolute symmetry from the center.
- Fix lopsided coordinates.
- Enforce padding (2px for 24x24, 4px for 64x64).
- Standardize strokes (stroke-width="1.5" or "2" for 24x24; stroke-width="4" for 64x64 achievements/emblems).
- Use stroke-linecap="round" and stroke-linejoin="round" unless docs require sharp edges.
- Round coordinates to max 2 decimal places.

4. SEMANTIC CLASS INJECTION
- Inject BEM/namespaced classes (e.g., .ach-*, .rianell-*, .theme-fx-target, .icon-fill) so runtime CSS can animate the icon.
- Do not output naked SVG markup.
- Remove empty <g></g>, redundant defaults, and colliding inline ids.

4b. SEAMLESS ANIMATION LOOPS (NON-NEGOTIABLE for kind=animation / single-anim)
- Polished @keyframes MUST loop fluidly under animation: … infinite — no visible hard restart, jump, or pop at the loop seam.
- Closed cycle: 0% and 100% (or from/to) must match for opacity/scale/filter/color/box-shadow, OR use continuous cyclic motion (e.g. translateX by exactly one repeating tile period for waves) with linear timing.
- Forbidden: one-shot from→to fades/scales that snap back; mismatched 0% vs 100%; stepped easings that make the seam pop when infinite.
- Keep the exact @keyframes name. For animations, output ONLY the @keyframes block.
- COHESION: one motion intent only (no competing rotates / double-spin metaphors).
- NO FRAME CLIPPING: every intermediate frame must keep subject ink inside the viewBox/stage (no hard cut-offs mid-loop unless an intentional waterline/mask that still reads clearly).

4c. HUMAN FIGURE ANATOMY (NON-NEGOTIABLE when subject is a person/body/swimmer/user/figure)
- Anatomically plausible: one head, one torso, exactly TWO arms (bilateral), legs only when depicted.
- FAIL / rewrite: extra limbs (e.g. four stick-arms under a head), missing torso, scrambled proportions, or limb soup.
- Stylized icons OK; illegible anatomy is not. Prefer simple bilateral silhouette over chaotic multi-limb gestures.

4d. USER-FLAGGED SUBJECT REPAIR (NON-NEGOTIABLE when id matches)
- pizza-slice: MUST read as a pizza wedge — crust arc + cheese triangle + ≥2 topping dots. Never a shark-fin / single blob.
- cycle_tracker (achievement/emblem): MUST read as menstrual/cycle tracking — phase ring, crescent+droplet, or calendar cycle — NEVER a lone point-on-line / tee marker.
- ashspiral avatar: MUST be a readable spiral companion silhouette (multi-turn curl + face optional) — not an abstract comma blob.
- FA object replaces (lightbulb, moon, mug-hot, mug-saucer, person-swimming, person-walking, plane, plate-wheat, potato, utensils): output VALID complete SVG with clear multi-element composition. Never truncated markup or unrecognizable fragments.
- If C is unrecognizable for these subjects, rebuild from A/stem with correct composition — polish accents only after the subject reads.

OUTPUT FORMAT (unless a pass explicitly asks for SUBJECT_LOCK text):
Return ONLY the raw, polished <svg>...</svg> (or inner SVG unit / CSS keyframes for anim). No conversational filler. No markdown.`;

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function savePolishCp(cp) {
  fs.mkdirSync(artRoot, { recursive: true });
  cp.updatedAt = new Date().toISOString();
  cp.model = MODEL;
  fs.writeFileSync(polishCpPath, JSON.stringify(cp, null, 2) + '\n');
}

function walkMdFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkMdFiles(abs, out);
    else if (st.isFile() && name.toLowerCase().endsWith('.md')) out.push(abs);
  }
  return out;
}

function keywordMatchesDoc(relPosix) {
  // Legacy keyword matcher kept for tests/tools that still call it; ICON_CONTRACT uses allowlist.
  const base = path.posix.basename(relPosix).toLowerCase();
  const full = relPosix.toLowerCase();
  return /(^|\/|-)(style|styl|design|token|visual|accessib|ux|ui-|motion|component|screen|wizard|layout)/.test(full)
    || /(style|styl|design|token|visual|accessib|ux|ui-|motion|component|screen|wizard|layout)/.test(base);
}

/**
 * ICON_CONTRACT — allowlisted icon/motion specs only (budget ~6–8k chars).
 * @param {'static'|'motion'|'all'} track
 */
export function scanProjectStylingContract(repoRoot = root, track = 'all') {
  const seen = new Set();
  const files = [];

  function addAbs(abs) {
    const resolved = path.resolve(abs);
    if (seen.has(resolved)) return;
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return;
    seen.add(resolved);
    const rel = path.relative(repoRoot, resolved).replace(/\\/g, '/');
    const text = fs.readFileSync(resolved, 'utf8');
    files.push({ path: rel, bytes: Buffer.byteLength(text, 'utf8'), text });
  }

  const staticDocs = [
    'docs/style-and-design/icon-grid.md',
    'docs/style-and-design/icon-stroke-and-fill.md',
    'docs/style-and-design/icon-size-ladder.md',
    'docs/style-and-design/icon-optical-alignment.md',
    'docs/style-and-design/theme-variants.md',
    'docs/style-and-design/icon-taxonomy.md',
  ];
  const motionDocs = [
    'docs/style-and-design/motion-catalogue.md',
  ];
  const pick = track === 'motion'
    ? motionDocs
    : track === 'static'
      ? staticDocs
      : [...staticDocs, ...motionDocs];

  for (const rel of pick) addAbs(path.join(repoRoot, rel));
  // Always include subject contracts as JSON appendix when present
  addAbs(path.join(repoRoot, 'docs/style-and-design/subject-contracts.json'));

  files.sort((a, b) => a.path.localeCompare(b.path));

  const parts = [
    '# ICON_CONTRACT',
    'Allowlisted icon + motion design specs. Absolute SOURCE OF TRUTH for polish.',
    'Do not invent grid, stroke, or loop rules outside these docs.',
    '',
  ];
  for (const f of files) {
    const fence = f.path.endsWith('.json') ? 'json' : 'markdown';
    parts.push(`## ${f.path}`);
    parts.push('```' + fence);
    parts.push(f.text.trimEnd());
    parts.push('```');
    parts.push('');
  }

  let contract = parts.join('\n');
  let truncated = false;
  if (contract.length > CONTRACT_MAX) {
    truncated = true;
    contract = `${contract.slice(0, CONTRACT_MAX)}\n\n<!-- CONTRACT TRUNCATED at ${CONTRACT_MAX} chars -->\n`;
  }

  return {
    contract,
    files: files.map(({ path: p, bytes }) => ({ path: p, bytes })),
    chars: contract.length,
    truncated,
    track,
    allowlist: ICON_CONTRACT_ALLOWLIST,
  };
}

export function buildPolishSystemPrompt(contractText) {
  return [
    POLISH_HINT_LIST,
    '',
    '--- BEGIN ICON_CONTRACT ---',
    String(contractText || ''),
    '--- END ICON_CONTRACT ---',
  ].join('\n');
}

function logContractIngestion(meta, { quietJson = false } = {}) {
  const paths = (meta.files || []).map((f) => f.path);
  console.error(
    `[visual-polish] ICON_CONTRACT ingested ${meta.files.length} files`
    + ` (${meta.chars} chars${meta.truncated ? ', truncated' : ''}`
    + `${meta.track ? `, track=${meta.track}` : ''})`,
  );
  if (!quietJson) {
    for (const p of paths) console.error(`[visual-polish]   + ${p}`);
  }
}

function stripFences(text) {
  let t = String(text || '').trim();
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '');
  t = t.replace(/^```(?:svg|xml|html|css|javascript|js|json)?\s*/i, '');
  t = t.replace(/\s*```$/i, '');
  return t.trim();
}

function extractFirstUnit(text, mode) {
  let t = String(text || '').trim();
  if (mode === 'anim') {
    const m = t.match(/@keyframes\s+[^{\s]+[\s\S]*?(?=@keyframes\s+|$)/i);
    return (m ? m[0] : t).trim();
  }
  const svg = t.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/i);
  if (svg) return svg[0].trim();
  const symbol = t.match(/<symbol\b[^>]*>[\s\S]*?<\/symbol>/i);
  if (symbol) return symbol[0].trim();
  const shape = t.search(/<(?:g|path|circle|rect|ellipse|polygon|line|polyline)\b/i);
  if (shape > 0) t = t.slice(shape);
  return t.trim();
}

function validatePolish(entry, raw) {
  let text = stripFences(raw);
  if (!text || text.length < 8) return { ok: false, reason: 'empty' };
  if (/<script[\s>]/i.test(text) || /\bon\w+\s*=/i.test(text)) {
    return { ok: false, reason: 'script/handler forbidden' };
  }
  const isAnim = entry.promptMode === 'single-anim' || entry.kind === 'animation' || entry.kind === 'fx';
  text = extractFirstUnit(text, isAnim ? 'anim' : 'svg');
  if (isAnim) {
    if (entry.kind === 'animation' && !/@keyframes\s+/.test(text) && !text.includes('{')) {
      return { ok: false, reason: 'missing keyframes/css' };
    }
    if (text.length > 24_000) return { ok: false, reason: 'anim too large' };
    const kf = extractCssKeyframes(text);
    if (kf) text = kf.css;
    const seam = analyzeSeamlessLoop(text, entry);
    if (seam.length) {
      return { ok: false, reason: `non-seamless loop: ${seam[0]}` };
    }
    return { ok: true, text };
  }
  if (!/<(?:svg|symbol|g|path|circle|rect|ellipse|polygon|line|polyline)\b/i.test(text)) {
    return { ok: false, reason: 'no svg shapes' };
  }
  if (text.length > 16_000) return { ok: false, reason: 'svg too large' };
  return { ok: true, text };
}

function polishedPathFor(entry) {
  const rel = String(entry.outputPath || '').replace(/^artifacts\/visual-gen\//, '');
  return path.join(polishedRoot, rel);
}

function extractModelText(data) {
  const msg = data?.message || {};
  return String(msg.content || '').trim()
    || String(msg.thinking || '').trim()
    || String(data?.response || '').trim()
    || String(data?.thinking || '').trim();
}

/** One-shot generate (used by stem QA). */
async function ollamaGenerate(prompt, numPredict, systemPrompt) {
  const body = {
    model: MODEL,
    prompt,
    stream: false,
    keep_alive: '60m',
    think: false,
    options: {
      temperature: 0.2,
      num_predict: numPredict,
      num_ctx: NUM_CTX,
    },
  };
  if (systemPrompt) body.system = systemPrompt;
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Ollama HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await res.json();
  return extractModelText(data);
}

/**
 * Fresh chat session for one visual unit. All multi-pass turns share history;
 * discard and create a new chat when moving to the next item.
 */
export function createItemChat(systemPrompt) {
  const messages = [{ role: 'system', content: String(systemPrompt || '') }];
  return {
    messages,
    async say(userContent, numPredict) {
      messages.push({ role: 'user', content: String(userContent || '') });
      const res = await fetch(`${HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,
          keep_alive: '60m',
          think: false,
          options: {
            temperature: 0.2,
            num_predict: numPredict,
            num_ctx: NUM_CTX,
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        messages.pop();
        throw new Error(`Ollama chat HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = extractModelText(data);
      messages.push({ role: 'assistant', content: text || '(empty)' });
      return text;
    },
  };
}

function clipArtifact(text, max = 3500) {
  return String(text || '').slice(0, max);
}

const PORTFOLIO_PATH = path.join(root, 'apps/pwa-webapp/modules/graphics-portfolio.js');
let _portfolioSrcCache = null;
function portfolioSrc() {
  if (_portfolioSrcCache == null) {
    _portfolioSrcCache = fs.existsSync(PORTFOLIO_PATH)
      ? fs.readFileSync(PORTFOLIO_PATH, 'utf8')
      : '';
  }
  return _portfolioSrcCache;
}

/**
 * Register currentPayload is often a JS stub like achievementIconSvgMarkup('food_logging'),
 * not SVG. Resolve those to real markup from graphics-portfolio.js for polish + preview.
 * @returns {{ text: string, kind: 'svg'|'svg-resolved'|'css-anim'|'js-stub'|'empty'|'unknown' }}
 */
export function resolveRegisterPayload(entry) {
  const raw = String(entry?.currentPayload || '').trim();
  if (!raw) return { text: '', kind: 'empty' };
  if (/@keyframes\s+/.test(raw)) return { text: raw, kind: 'css-anim' };
  if (/<(?:svg|symbol|path|circle|ellipse|rect|g|line|polyline|polygon)\b/i.test(raw)) {
    return { text: extractSvgUnit(raw) || raw, kind: 'svg' };
  }
  const stub = raw.match(
    /^(achievementIconSvgMarkup|avatarSymbolPathsForId|metricEntityPaths|badgeFramePaths|tierRingPaths|cyclePhasePaths)\(\s*['"]([^'"]+)['"]\s*\)$/,
  );
  if (stub) {
    const resolved = evalPortfolioSwitchCase(stub[1], stub[2]);
    if (resolved && /<(?:path|circle|ellipse|rect|g|line|polyline|polygon|text)\b/i.test(resolved)) {
      return { text: resolved, kind: 'svg-resolved' };
    }
    return { text: raw, kind: 'js-stub' };
  }
  return { text: raw, kind: 'unknown' };
}

function evalPortfolioSwitchCase(fnName, id) {
  const src = portfolioSrc();
  if (!src) return '';
  const fnStart = src.indexOf(`function ${fnName}(`);
  if (fnStart < 0) return '';
  const fnBody = src.slice(fnStart, fnStart + 12000);
  const idEsc = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const caseRe = new RegExp(
    `case\\s+['"]${idEsc}['"]\\s*:([\\s\\S]*?)(?=\\n\\s*case\\s+|\\n\\s*default\\s*:)`,
  );
  const block = (fnBody.match(caseRe) || [])[1];
  if (!block) return '';
  const retM = block.match(/return\s+([\s\S]*?);/);
  if (!retM) return '';
  const fill = 'fill="currentColor"';
  const stroke = 'stroke="currentColor" stroke-width="1.5" fill="none"';
  const eyes = '<circle cx="28" cy="28" r="1.5" fill="#fff"/><circle cx="36" cy="28" r="1.5" fill="#fff"/>';
  try {
    return Function(
      'fill',
      'stroke',
      'f',
      's',
      'cx',
      'cy',
      'glow',
      'eyes',
      'achCalGridMarkup',
      `return (${retM[1]});`,
    )(fill, stroke, fill, stroke, 32, 30, '', eyes, () => '');
  } catch {
    return '';
  }
}

/**
 * Pull clean SVG/CSS unit out of chatty model dumps.
 * Ignores bare tags mentioned in prose (e.g. "`<g>`") — requires attrs on shapes.
 */
export function extractSvgUnit(raw) {
  let t = String(raw || '').trim();
  if (!t) return '';
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Prefer fenced blocks (final answer often last)
  const fences = [...t.matchAll(/```(?:svg|xml|html)?\s*\n?([\s\S]*?)```/gi)];
  for (let i = fences.length - 1; i >= 0; i -= 1) {
    const body = String(fences[i][1] || '').trim();
    const fromFence = extractSvgUnitStrict(body);
    if (fromFence) return fromFence;
  }

  const strict = extractSvgUnitStrict(t);
  if (strict) return strict;

  if (/@keyframes\s+/.test(t)) {
    const m = t.match(/@keyframes\s+[^{\s]+[\s\S]*?(?=@keyframes\s+|$)/i);
    return (m ? m[0] : t).trim();
  }
  return '';
}

function extractSvgUnitStrict(t) {
  // Require attributes on svg/symbol (skip prose like `<symbol>\``)
  const fullSvg = t.match(/<svg\b\s[^>]+>[\s\S]*?<\/svg>/i);
  if (fullSvg && !looksLikeSvgProse(fullSvg[0])) return fullSvg[0].trim();
  const sym = t.match(/<symbol\b\s[^>]+>[\s\S]*?<\/symbol>/i);
  if (sym && !looksLikeSvgProse(sym[0])) return sym[0].trim();

  // Real shape tags must have attributes (space after tag name) — skip prose `<g>`
  const shapeRe =
    /<(?:path|circle|ellipse|rect|line|polyline|polygon)\b\s[^>]*>/gi;
  const matches = [...t.matchAll(shapeRe)].map((m) => m[0]);
  if (!matches.length) {
    // attributed <g>...</g> only when closed and not prose
    const gBlocks = [...t.matchAll(/<g\b\s[^>]*>[\s\S]*?<\/g>/gi)].map((m) => m[0]);
    const goodG = gBlocks.reverse().find((g) => !looksLikeSvgProse(g) && /<(?:path|circle|ellipse|rect|line)\b\s/i.test(g));
    return goodG ? goodG.trim() : '';
  }

  // Take the longest trailing run of consecutive shape tags (final answer cluster)
  const positions = matches.map((m) => ({ m, i: t.lastIndexOf(m) }));
  // rebuild from last match backward while gaps are small
  let startIdx = positions[positions.length - 1].i;
  let endIdx = startIdx + positions[positions.length - 1].m.length;
  for (let k = positions.length - 2; k >= 0; k -= 1) {
    const gap = startIdx - (positions[k].i + positions[k].m.length);
    if (gap >= 0 && gap <= 80) {
      startIdx = positions[k].i;
    } else break;
  }
  let chunk = t.slice(startIdx, endIdx);
  // Include a wrapping <g ...> if immediately before
  const before = t.slice(Math.max(0, startIdx - 200), startIdx);
  const gOpen = before.match(/<g\b\s[^>]*>\s*$/i);
  if (gOpen) {
    chunk = `${gOpen[0]}${chunk}`;
    const closeG = t.slice(endIdx, endIdx + 20).match(/^\s*<\/g>/i);
    if (closeG) chunk += closeG[0];
  }
  chunk = chunk.replace(/`[\s\S]*$/m, '').trim();
  if (looksLikeSvgProse(chunk)) return '';
  return trimToClosedSvgUnit(chunk);
}

function looksLikeSvgProse(s) {
  const t = String(s || '');
  if (!t) return true;
  if (/^<(?:svg|symbol|g)\b>`/i.test(t)) return true;
  if (/`\s*element with|The prompt says|I should wrap|Thinking Process|Analyze User/i.test(t)) return true;
  if (/<(?:svg|symbol|g|path|circle)\b[^>]*>\s*`/i.test(t)) return true;
  // Unclosed symbol/svg that is mostly words
  if (/^<(?:svg|symbol)\b/i.test(t) && !/<\/(?:svg|symbol)>/i.test(t) && (t.match(/\b(?:the|with|should|include)\b/gi) || []).length >= 3) {
    return true;
  }
  return false;
}

/** Keep only a closed outer svg/symbol/g or a run of self-closing shapes. */
function trimToClosedSvgUnit(chunk) {
  const t = String(chunk || '').trim();
  if (!t) return '';
  if (looksLikeSvgProse(t)) return '';
  const open = t.match(/^<(svg|symbol|g)\b[^>]*>/i);
  if (open) {
    const tag = open[1].toLowerCase();
    const close = `</${tag}>`;
    const lower = t.toLowerCase();
    const end = lower.indexOf(close);
    if (end >= 0) return t.slice(0, end + close.length).trim();
    // Unclosed wrapper — keep only inner shape run
    const inner = t.slice(open[0].length);
    const run = inner.match(/^(?:\s*<(?:path|circle|ellipse|rect|line|polyline|polygon)\b[^>]*\/?\s*>)+/i);
    return run ? run[0].trim() : '';
  }
  const run = t.match(/^(?:\s*<(?:path|circle|ellipse|rect|line|polyline|polygon)\b[^>]*\/?\s*>)+/i);
  if (run) return run[0].trim();
  return '';
}

/** True when text has real drawable SVG shapes (not chat prose). */
export function hasUsableSvg(text) {
  const u = extractSvgUnit(text);
  return Boolean(u && /<(?:path|circle|ellipse|rect|line|polyline|polygon)\b\s/i.test(u));
}

/**
 * Stage B for polish/preview: extract Qwen SVG, or fall back to A when Stage 1 is chat-only.
 */
export function resolveStageB(rawB, originalText) {
  const extracted = extractSvgUnit(rawB);
  const candidate = hasUsableSvg(extracted) ? extracted : (hasUsableSvg(rawB) ? extractSvgUnit(rawB) : '');
  if (candidate && !looksLikeSvgProse(candidate)) {
    // Incomplete Stage 1 (e.g. one axis path when A has a full chart) → fall back to A
    if (
      originalText
      && missingOriginalGlyph(originalText, candidate)
      && shapeFingerprint(originalText).paths + shapeFingerprint(originalText).rects
        > shapeFingerprint(candidate).paths + shapeFingerprint(candidate).rects
    ) {
      const a = extractSvgUnit(originalText) || String(originalText || '').trim();
      return { text: a, source: 'original-fallback', note: 'Stage 1 incomplete vs A' };
    }
    return { text: candidate, source: 'qwen' };
  }
  const a = extractSvgUnit(originalText) || String(originalText || '').trim();
  return {
    text: a,
    source: 'original-fallback',
    note: 'Stage 1 had no extractable SVG (chat/thinking dump)',
  };
}

/** Per-team paint for fancy glyph (shape from A; color from theme). */
export function themePaintForTeam(team) {
  const tok = team && THEME_FX_TOKENS.teams?.[team] ? THEME_FX_TOKENS.teams[team] : null;
  if (!tok) {
    return { fill: 'currentColor', stroke: 'currentColor', glow: null, alt: null, team: null };
  }
  if (team === 'red-black') {
    return {
      team,
      fill: tok.particleColorAlt || '#ff4d5a',
      stroke: tok.particleColor || '#ff8d98',
      glow: tok.glow,
      alt: '#1a1a1a',
    };
  }
  if (team === 'mono') {
    return {
      team,
      fill: '#e8e8e8',
      stroke: tok.glow || '#d0d0d0',
      glow: tok.glow,
      alt: 'rgba(120,120,120,0.45)',
    };
  }
  if (team === 'rainbow') {
    const prism = Array.isArray(tok.prism) ? tok.prism : ['#ff4fa0', '#7bdf8c', '#2196f3'];
    return {
      team,
      fill: prism[0],
      stroke: prism[4] || prism[1] || tok.glow,
      glow: tok.glow,
      alt: prism[1],
      prism,
    };
  }
  // mint
  return {
    team,
    fill: tok.glow || '#7bdf8c',
    stroke: tok.particleColorAlt || '#a8e6cf',
    glow: tok.glow,
    alt: tok.particleColorAlt,
  };
}

/**
 * Enforce team colors on fancy polished SVG: shape stays; currentColor → team paint.
 * Prevents "mint glyph + team glow halo" failures.
 */
export function enforceTeamColors(svgText, entry = {}) {
  const team = entry.team || null;
  if (!team) return String(svgText || '');
  const paint = themePaintForTeam(team);
  let t = String(svgText || '');
  if (!t.trim()) return t;

  // Rewrite currentColor on fills/strokes to team tokens
  t = t.replace(/\bfill="currentColor"/gi, `fill="${paint.fill}"`);
  t = t.replace(/\bstroke="currentColor"/gi, `stroke="${paint.stroke}"`);
  // Bare stroke/fill inheritance on glyph groups that only set stroke=currentColor already handled

  // If glyph group has no explicit fill and uses stroke-only charts, leave geometry;
  // if filled shapes have neither fill nor stroke hex, wrap glyph layer.
  const hasTeamHex = new RegExp(
    (paint.fill || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'i',
  ).test(t);
  if (!hasTeamHex && /<(?:circle|ellipse|path|rect)\b/i.test(t)) {
    // Inject fill on first icon-fill / glyph group if still colorless
    t = t.replace(
      /(<g\b[^>]*class="[^"]*(?:icon-fill|rianell-icon-glyph|ach-icon-glyph)[^"]*"[^>]*)(>)/i,
      (_m, open, close) => {
        let o = open;
        if (!/\bfill=/i.test(o)) o += ` fill="${paint.fill}"`;
        if (!/\bstroke=/i.test(o)) o += ` stroke="${paint.stroke}"`;
        return `${o}${close}`;
      },
    );
  }
  return t;
}

/** True when glyph is stroke-line art (open paths / fill=none) — must not strip stroke. */
export function isStrokeLineGlyph(svgText) {
  const t = String(svgText || '');
  if (!t.trim()) return false;
  if (/\bfill\s*=\s*["']none["']/i.test(t) && /\bstroke\s*=/i.test(t)) return true;
  const paths = [...t.matchAll(/<path\b([^>]*)\sd=(["'])([^"']+)\2/gi)];
  if (!paths.length) return false;
  let openNoFill = 0;
  for (const m of paths) {
    const attrs = m[1] || '';
    const d = m[3] || '';
    const hasFill = /\bfill\s*=\s*["'](?!none)[^"']+["']/i.test(attrs);
    const closed = /\bZ\b/i.test(d);
    if (!closed && !hasFill) openNoFill += 1;
  }
  return openNoFill >= 2;
}

/** Hard fallback that still adds theme accents on top of A (not a bare clone). */
export function buildAdditivePolishFallback(originalText, entry = {}) {
  let glyph = extractSvgUnit(originalText) || String(originalText || '').trim();
  // Never wrap a JS stub — resolve from register / portfolio first.
  if (looksLikeJsStub(glyph) || !/<(?:path|circle|ellipse|rect|g|line|polyline|polygon|text)\b/i.test(glyph)) {
    const resolved = resolveRegisterPayload(entry);
    if (resolved.kind === 'svg' || resolved.kind === 'svg-resolved') {
      glyph = resolved.text;
    }
  }
  if (looksLikeJsStub(glyph) || !/<(?:path|circle|ellipse|rect|g|line|polyline|polygon|text)\b/i.test(glyph)) {
    return glyph; // leave non-SVG (css-anim etc.) untouched rather than fake empty <g>
  }
  const team = entry.team || null;
  const paint = themePaintForTeam(team);
  const strokeGlyph = isStrokeLineGlyph(glyph) || /stethoscope/i.test(String(entry.id || ''));
  if (!paint.team) {
    if (strokeGlyph) {
      // Keep open-path icons (stethoscope etc.) as strokes — fill+stroke=none makes broken blobs
      return [
        `<g class="rianell-polish theme-fx-target" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-polish="wrap-stroke">`,
        `  ${glyph}`,
        `</g>`,
      ].join('\n');
    }
    return [
      `<g class="rianell-polish theme-fx-target icon-fill" fill="currentColor" stroke="none" data-polish="wrap">`,
      `  ${glyph}`,
      `</g>`,
    ].join('\n');
  }
  const rim = paint.stroke || paint.glow;
  const glyphPainted = glyph
    .replace(/\bfill="currentColor"/gi, `fill="${paint.fill}"`)
    .replace(/\bstroke="currentColor"/gi, `stroke="${paint.stroke}"`);
  if (strokeGlyph) {
    return [
      `<g class="rianell-fancy theme-fx-target" data-polish="additive-stroke" data-team="${team}">`,
      `  <circle class="theme-glow" cx="12" cy="12" r="10.5" fill="${paint.glow}" opacity="0.22"/>`,
      `  <g class="icon-stroke" fill="none" stroke="${paint.stroke || paint.fill}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${glyphPainted}</g>`,
      `  <circle class="theme-rim" cx="12" cy="12" r="11" fill="none" stroke="${rim}" stroke-width="0.75" opacity="0.55"/>`,
      `</g>`,
    ].join('\n');
  }
  return [
    `<g class="rianell-fancy theme-fx-target" data-polish="additive" data-team="${team}">`,
    `  <circle class="theme-glow" cx="12" cy="12" r="10.5" fill="${paint.glow}" opacity="0.22"/>`,
    `  <g class="icon-fill" fill="${paint.fill}" stroke="none">${glyphPainted}</g>`,
    `  <circle class="theme-rim" cx="12" cy="12" r="11" fill="none" stroke="${rim}" stroke-width="0.75" opacity="0.55"/>`,
    `</g>`,
  ].join('\n');
}

function looksLikeJsStub(text) {
  return /(?:achievementIconSvgMarkup|avatarSymbolPathsForId|metricEntityPaths|badgeFramePaths|tierRingPaths|cyclePhasePaths)\s*\(/i.test(
    String(text || ''),
  );
}

/**
 * Pull a clean @keyframes block out of model dumps / accidental <g> wraps.
 * @returns {{ name: string, css: string } | null}
 */
export function extractCssKeyframes(raw) {
  const t = String(raw || '');
  const start = t.search(/@keyframes\s+[A-Za-z0-9_-]+/i);
  if (start < 0) return null;
  const name = (t.slice(start).match(/@keyframes\s+([A-Za-z0-9_-]+)/i) || [])[1];
  if (!name) return null;
  const brace = t.indexOf('{', start);
  if (brace < 0) return null;
  let depth = 0;
  let end = -1;
  for (let i = brace; i < t.length; i += 1) {
    if (t[i] === '{') depth += 1;
    else if (t[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return null;
  const css = t.slice(start, end + 1).trim();
  return { name, css };
}

/**
 * Detect hard loop seams in @keyframes (visible restart when infinite).
 * Cyclic scrolls (translate by a tile period) and closed 0%===100% cycles PASS.
 */
export function analyzeSeamlessLoop(cssText, entry = {}) {
  const reasons = [];
  const kf = extractCssKeyframes(cssText);
  if (!kf) {
    if (entry?.kind === 'animation' || entry?.promptMode === 'single-anim') {
      reasons.push('missing @keyframes (cannot verify seamless loop)');
    }
    return reasons;
  }
  const body = kf.css.replace(/^@keyframes[^{]+\{/i, '').replace(/\}$/, '');
  const stops = [];
  // Match "0%, 100% {…}" as well as from/to / single %
  const stopRe = /((?:(?:from|to|\d+(?:\.\d+)?)%)|(?:from|to))(?:\s*,\s*((?:(?:from|to|\d+(?:\.\d+)?)%)|(?:from|to)))*\s*\{([^{}]*)\}/gi;
  let m;
  while ((m = stopRe.exec(body))) {
    const full = m[0];
    const brace = full.indexOf('{');
    const sel = full.slice(0, brace);
    const block = full.slice(brace + 1, full.lastIndexOf('}'));
    const decls = normalizeCssDecls(block);
    for (const part of sel.split(',')) {
      const key = part.trim().toLowerCase();
      if (!key) continue;
      const pct = key === 'from' ? 0 : key === 'to' ? 100 : Number.parseFloat(key);
      if (Number.isNaN(pct)) continue;
      stops.push({ key, pct, decls, raw: block.trim() });
    }
  }
  if (!stops.length) {
    reasons.push(`@keyframes ${kf.name}: empty/unparseable stops`);
    return reasons;
  }

  const at0 = stops.find((s) => s.pct === 0) || stops.find((s) => s.key === 'from');
  const at100 = stops.find((s) => s.pct === 100) || stops.find((s) => s.key === 'to');
  if (!at0 || !at100) {
    reasons.push(`@keyframes ${kf.name}: need both start (from/0%) and end (to/100%) for a closed loop`);
    return reasons;
  }

  const cyclic = isCyclicMotionPair(at0.decls, at100.decls);
  if (cyclic) return reasons;

  if (!declsEqual(at0.decls, at100.decls)) {
    // Hard jump properties
    const jumpProps = [...new Set([...Object.keys(at0.decls), ...Object.keys(at100.decls)])]
      .filter((p) => at0.decls[p] !== at100.decls[p]);
    const snapProps = jumpProps.filter((p) => !/^transform$/i.test(p) || !isCyclicTransform(at0.decls.transform, at100.decls.transform));
    if (snapProps.length) {
      reasons.push(
        `@keyframes ${kf.name}: loop seam jump on ${snapProps.slice(0, 4).join(', ')} `
        + `(0%≠100% — will visibly restart when infinite)`,
      );
    }
  }
  return reasons;
}

function normalizeCssDecls(block) {
  const out = {};
  for (const part of String(block || '').split(';')) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const prop = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim().toLowerCase().replace(/\s+/g, ' ');
    if (prop) out[prop] = val;
  }
  return out;
}

function declsEqual(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    if ((a[k] || '') !== (b[k] || '')) return false;
  }
  return true;
}

function isCyclicTransform(a, b) {
  return isCyclicMotionPair({ transform: a || '' }, { transform: b || '' });
}

/** translate/rotate continuous cycles that tile when infinite + linear. */
function isCyclicMotionPair(a, b) {
  const ta = String(a?.transform || '');
  const tb = String(b?.transform || '');
  if (!ta && !tb) return false;
  const ax = ta.match(/translatex\(\s*([-.\d]+)(px|%)?\s*\)/i);
  const bx = tb.match(/translatex\(\s*([-.\d]+)(px|%)?\s*\)/i);
  const ay = ta.match(/translatey\(\s*([-.\d]+)(px|%)?\s*\)/i);
  const by = tb.match(/translatey\(\s*([-.\d]+)(px|%)?\s*\)/i);
  const ar = ta.match(/rotate\(\s*([-.\d]+)(deg)?\s*\)/i);
  const br = tb.match(/rotate\(\s*([-.\d]+)(deg)?\s*\)/i);
  // Wave/scroll: pure translate delta = one tile period (seamless when graphic tiles)
  if (ax && bx && (ax[2] || 'px') === (bx[2] || 'px') && !ay && !by && !ar && !br) {
    if (Number(ax[1]) !== Number(bx[1])) return true;
  }
  if (ay && by && (ay[2] || 'px') === (by[2] || 'px') && !ax && !bx && !ar && !br) {
    if (Number(ay[1]) !== Number(by[1])) return true;
  }
  if (ar && br && !ax && !bx && !ay && !by) {
    const av = Number(ar[1]);
    const bv = Number(br[1]);
    if (Math.abs(Math.abs(bv - av) - 360) < 0.01) return true;
    if ((av === 0 && Math.abs(bv) === 360) || (bv === 0 && Math.abs(av) === 360)) return true;
  }
  return false;
}

export function hydratePolishedPayload(cRaw, entry = {}) {
  const raw = String(cRaw || '');
  if (!raw.trim()) return { text: '', kind: 'empty' };
  const kf = extractCssKeyframes(raw);
  if (kf) {
    return { text: kf.css, kind: 'css-anim', keyframesName: kf.name };
  }
  if (looksLikeJsStub(raw) || !hasUsableSvg(raw)) {
    const resolved = resolveRegisterPayload(entry);
    if (resolved.kind === 'svg' || resolved.kind === 'svg-resolved') {
      const classMatch = raw.match(/<g\b([^>]*class="[^"]*rianell[^"]*"[^>]*)>/i);
      if (classMatch) {
        return {
          text: `<g${classMatch[1]}>\n  ${resolved.text}\n</g>`,
          kind: 'svg-hydrated',
        };
      }
      return { text: buildAdditivePolishFallback(resolved.text, entry), kind: 'svg-hydrated' };
    }
    if (resolved.kind === 'js-stub') return { text: '', kind: 'js-stub' };
    if (resolved.kind === 'css-anim') {
      const rKf = extractCssKeyframes(resolved.text);
      return { text: rKf?.css || resolved.text, kind: 'css-anim', keyframesName: rKf?.name };
    }
  }
  return { text: raw, kind: 'svg' };
}

/** True when C no longer contains A's core glyph fingerprints. */
export function missingOriginalGlyph(originalText, candidateText) {
  const a = extractSvgUnit(originalText) || String(originalText || '');
  const c = String(candidateText || '');
  if (!a || a.length < 12 || !c) return false;
  const dAttrs = [...a.matchAll(/\bd="([^"]{6,120})"/gi)].map((m) => m[1]);
  for (const d of dAttrs.slice(0, 3)) {
    const head = d.slice(0, Math.min(24, d.length));
    if (head && !c.includes(head)) return true;
  }
  const circles = [...a.matchAll(/<circle\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of circles.slice(0, 2)) {
    const cx = (tag.match(/\bcx="([^"]+)"/i) || [])[1];
    const cy = (tag.match(/\bcy="([^"]+)"/i) || [])[1];
    const r = (tag.match(/\br="([^"]+)"/i) || [])[1];
    if (cx && cy && r && !(c.includes(`cx="${cx}"`) && c.includes(`cy="${cy}"`) && c.includes(`r="${r}"`))) {
      return true;
    }
  }
  const ellipses = [...a.matchAll(/<ellipse\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of ellipses.slice(0, 2)) {
    const cx = (tag.match(/\bcx="([^"]+)"/i) || [])[1];
    const cy = (tag.match(/\bcy="([^"]+)"/i) || [])[1];
    if (cx && cy && !(c.includes(`cx="${cx}"`) && c.includes(`cy="${cy}"`))) return true;
  }
  return false;
}

/** Cheap shape fingerprint for deterministic drift suspicion. */
export function shapeFingerprint(svg) {
  const t = String(svg || '');
  const count = (re) => (t.match(re) || []).length;
  return {
    paths: count(/<path\b/gi),
    circles: count(/<circle\b/gi),
    lines: count(/<line\b/gi),
    ellipses: count(/<ellipse\b/gi),
    rects: count(/<rect\b/gi),
    polys: count(/<(?:polygon|polyline)\b/gi),
    hasStrokePath: /<path\b[^>]*stroke=/i.test(t) || /stroke="[^"]+"/i.test(t),
    dPreview: (t.match(/\bd="([^"]{0,120})/i) || [])[1] || '',
  };
}

/**
 * Heuristic: C replaced A's path/line identity with circle-heavy geometry (classic close→ring drift).
 */
export function driftSuspect(originalText, candidateText, entryId = '') {
  const a = String(originalText || '').trim();
  const c = String(candidateText || '').trim();
  if (!a || a.length < 12 || !c) return false;
  if (!/<(?:path|circle|ellipse|rect|g|line|polyline|polygon)\b/i.test(a)) return false;
  if (missingOriginalGlyph(a, c)) return true;
  const fa = shapeFingerprint(a);
  const fc = shapeFingerprint(c);
  const aStrokeGeom = fa.paths + fa.lines + fa.polys;
  const aFilledGeom = fa.circles + fa.ellipses + fa.rects;
  if (aStrokeGeom > 0 && aFilledGeom === 0 && fc.circles >= 1 && fc.paths === 0 && fc.lines === 0) {
    return true;
  }
  if (fa.paths >= 1 && fc.paths === 0 && fc.circles >= 2) return true;
  const idHint = String(entryId || '');
  if ((/icon-close/i.test(idHint) || /M6 6|l12 12|M18 6/i.test(a))
    && fc.circles >= 1
    && !/M6 6|l12 12|M18 6/i.test(c)) {
    return true;
  }
  return false;
}

/**
 * Rich situational brief for Gemma: location, surrounding, function, original A description.
 */
export function buildSituationalContext(entry, originalText = '', stemInfo = null) {
  const team = entry.team;
  const tok = team && THEME_FX_TOKENS.teams[team] ? THEME_FX_TOKENS.teams[team] : null;
  const sites = Array.isArray(entry.usageSites) ? entry.usageSites : [];
  const siteLines = sites.slice(0, 8).map((s) => {
    if (!s || typeof s !== 'object') return `  - ${String(s)}`;
    return `  - ${s.file || '?'}${s.ref ? ` → ${s.ref}` : ''}`;
  });
  const themes = Array.isArray(entry.themes) ? entry.themes.join(', ') : '';
  const states = Array.isArray(entry.states) ? entry.states.join(', ') : '';
  const functionHint = String(entry.context || '').trim()
    || `UI graphic ${entry.id} (${entry.kind || 'unknown'})`;
  const aDesc = String(originalText || entry.currentPayload || '').trim();
  const aSummary = aDesc
    ? (aDesc.length > 400 ? `${aDesc.slice(0, 400)}…` : aDesc)
    : '(no original markup — treat context description as the subject brief)';

  const stem = stemInfo || null;
  const stemBlock = stem
    ? [
      `STEM=${stem.stem} CANONICAL_PLAIN=${stem.plainId}`,
      `STEM SIBLINGS: ${(stem.siblingIds || []).join(', ')}`,
      'STEM CONSISTENCY: all siblings must share the STEM CANONICAL GLYPH geometry below. Only team color/glow/classes may differ.',
      `STEM CANONICAL GLYPH:\n${clipArtifact(stem.canonicalGlyph, 1200)}`,
    ].join('\n')
    : '';

  const id = String(entry.id || '');
  const subjectRepair = [];
  if (/pizza/i.test(id)) {
    subjectRepair.push('SUBJECT REPAIR: pizza-slice = crust arc + cheese wedge + topping dots (≥2). Not a fin blob.');
  }
  if (/cycle_tracker/i.test(id)) {
    subjectRepair.push('SUBJECT REPAIR: cycle_tracker = menstrual/cycle metaphor (phase ring / droplet / calendar cycle). Not a point-on-line.');
  }
  if (/ashspiral/i.test(id)) {
    subjectRepair.push('SUBJECT REPAIR: ashspiral = readable multi-turn spiral companion silhouette.');
  }
  if (/fa-solid_fa-(lightbulb|moon|mug-hot|mug-saucer|person-swimming|person-walking|plane|plate-wheat|potato|utensils)/i.test(id)) {
    subjectRepair.push('SUBJECT REPAIR: rebuild as clear valid SVG composition for this object — no truncated/non-SVG markup.');
  }

  return [
    '=== SITUATIONAL CONTEXT (use for polish decisions) ===',
    `ID=${entry.id} KIND=${entry.kind || '?'}${entry.viewBox ? ` VB=${entry.viewBox}` : ''} MODE=${entry.promptMode || '?'}`,
    tok
      ? `TEAM=${team} glow=${tok.glow} particle=${tok.particleColor || ''} alt=${tok.particleColorAlt || ''} prism=${JSON.stringify(tok.prism || null)}`
      : 'STYLE=plain currentColor',
    tok
      ? `THEME COLOR LOCK: paint glyph with team tokens (NOT currentColor/mint). fill≈${themePaintForTeam(team).fill} stroke≈${themePaintForTeam(team).stroke}. Shape from STEM CANONICAL only.`
      : 'THEME COLOR: plain currentColor OK',
    stemBlock,
    subjectRepair.length ? subjectRepair.join('\n') : '',
    `LOCATION (source): ${entry.sourcePath || '(unknown)'}`,
    siteLines.length
      ? `LOCATION (usage sites):\n${siteLines.join('\n')}`
      : 'LOCATION (usage sites): (none listed — infer from sourcePath + function)',
    `SURROUNDING: themes=[${themes || 'n/a'}]; states=[${states || 'n/a'}]; team=${team || 'plain'}`,
    `FUNCTION: ${functionHint.slice(0, 700)}`,
    `ORIGINAL A DESCRIPTION (subject + geometry brief):\n${aSummary}`,
    'Polish must fit this location/function. Do not invent a different UI job or glyph.',
  ].filter(Boolean).join('\n');
}

/** @deprecated use buildSituationalContext */
function entryMetaLine(entry, originalText = '') {
  return buildSituationalContext(entry, originalText);
}

/**
 * Track-specific Stage-2 user prompts.
 * Modes: construct | critique | apply | verify
 * Legacy aliases: subject-lock→construct, polish→construct, comparative→critique,
 * final-drift→apply, forced-reelback→verify
 */
export function buildPolishUserPrompt(entry, {
  originalText,
  qwenText,
  gemmaDraft = '',
  comparativeDraft = '',
  subjectLock = '',
  mode = 'construct',
  stemInfo = null,
  critiqueJson = '',
} = {}) {
  const isAnim = entry.promptMode === 'single-anim' || entry.kind === 'animation' || entry.kind === 'fx';
  const unit = isAnim ? 'CSS animation/FX unit' : 'SVG graphic';
  const geometryText = stemInfo?.canonicalGlyph || originalText;
  const meta = buildSituationalContext(entry, geometryText, stemInfo);
  const rules = subjectRuleCard(entry);
  const aBlock = [
    '=== A — ORIGINAL / STEM CANONICAL (subject lock / drift safeguard) ===',
    clipArtifact(geometryText, 2500) || '(none)',
  ].join('\n');
  const bBlock = [
    '=== B — QWEN (Stage 1 — polish this) ===',
    clipArtifact(qwenText, 4000),
  ].join('\n');

  const normalized = ({
    'subject-lock': 'construct',
    polish: 'construct',
    comparative: 'critique',
    'final-drift': 'apply',
    'forced-reelback': 'verify',
  })[mode] || mode;

  if (normalized === 'construct' && mode === 'subject-lock') {
    return [
      `CONSTRUCT prep (subject-lock) for one ${unit}.`,
      meta,
      rules,
      'Read STEM CANONICAL + ICON_CONTRACT. Reply with EXACTLY one line (no SVG):',
      'SUBJECT_LOCK: subject=<name>; stem=<stem>; core_shapes=<path|circle|...>; keyline=<circle|square|rect>; must_keep=<short>; forbidden=<drift shapes>; function=<one-line job>',
      aBlock,
    ].filter(Boolean).join('\n');
  }

  if (normalized === 'construct') {
    return [
      isAnim
        ? `CONSTRUCT pass: pick one loop class from motion-catalogue (pulse|cyclic-translate|rotate-360|breathe) and emit seamless @keyframes for one ${unit}.`
        : `CONSTRUCT pass: build polished C geometry for one ${unit} from STEM CANONICAL + ICON_CONTRACT grid/stroke rules.`,
      meta,
      rules,
      subjectLock ? `LOCKED: ${subjectLock}` : '',
      'CORE SUBJECT PRESERVATION is non-negotiable. Theme accents only — do not morph STEM CANONICAL geometry.',
      'STEM CONSISTENCY: C glyph must match STEM CANONICAL exactly. Fancy siblings differ only by derived team paint.',
      'THEME COLOR LOCK: if TEAM is set, glyph fill/stroke MUST use team token colors — never leave glyph as currentColor.',
      'C MUST visibly polish A: inject rianell-/theme-fx/icon-fill classes, normalize strokes (prefer cascade stroke, authoritative width 2 on 24 canvas).',
      'HARD RULE: polished C must NEVER be identical to original A.',
      isAnim
        ? 'SEAMLESS BY CONSTRUCTION: use a catalogue loop class; comment /* loop: <class> */; 0%/100% matched OR cyclic translate/rotate.'
        : 'ANATOMY: human figures — bilateral ≤2 arms, one torso, one head.',
      'If B is chatty/broken/drifted, discard B geometry and rebuild from STEM CANONICAL + theme polish.',
      'Output polished SVG/CSS only.',
      aBlock,
      '',
      bBlock,
    ].filter(Boolean).join('\n');
  }

  if (normalized === 'critique') {
    return [
      `CRITIQUE pass for one ${unit}: compare STEM CANONICAL, B, and draft C against ICON_CONTRACT + subject contract.`,
      meta,
      rules,
      subjectLock ? `LOCKED: ${subjectLock}` : '',
      'Return ONLY JSON (no markdown): { "deltas": [ { "rule": "<spec rule id>", "severity": "error|warn", "fix": "<short>" } ], "verdict": "ok"|"needs-fix" }.',
      'If verdict is needs-fix and a geometry rewrite is simpler than deltas, ALSO append a second fence with corrected SVG/CSS after the JSON.',
      'Prefer named rules: grid.live-area, stroke.width, family.geometry, subject.*, loop.seamless, anatomy.*, theme.paint.',
      aBlock,
      '',
      bBlock,
      '',
      '=== C — GEMMA DRAFT ===',
      clipArtifact(gemmaDraft, 4000),
    ].filter(Boolean).join('\n');
  }

  if (normalized === 'apply') {
    return [
      `APPLY pass for one ${unit}: apply accepted critique deltas; emit final polished SVG/CSS only.`,
      meta,
      rules,
      subjectLock ? `LOCKED: ${subjectLock}` : '',
      critiqueJson ? `CRITIQUE:\n${clipArtifact(critiqueJson, 1500)}` : '',
      'Theme accents ok; geometry identity must match STEM CANONICAL. Output final polished SVG/CSS only.',
      aBlock,
      '',
      '=== C — AFTER CRITIQUE / COMPARATIVE ===',
      clipArtifact(comparativeDraft || gemmaDraft, 4000),
    ].filter(Boolean).join('\n');
  }

  if (normalized === 'verify') {
    return [
      `VERIFY / REELBACK for one ${unit}: deterministic drift was detected or final check failed.`,
      meta,
      rules,
      subjectLock ? `LOCKED: ${subjectLock}` : '',
      'Rebuild C from STEM CANONICAL + polish chrome. Output corrected SVG/CSS only.',
      aBlock,
      '',
      '=== REJECTED C ===',
      clipArtifact(comparativeDraft || gemmaDraft, 4000),
    ].filter(Boolean).join('\n');
  }

  // Fallback: treat unknown as construct
  return buildPolishUserPrompt(entry, {
    originalText, qwenText, gemmaDraft, comparativeDraft, subjectLock, mode: 'construct', stemInfo,
  });
}

async function runSvgPass(entry, prompt, numPredict, chat, label) {
  const raw = await chat.say(prompt, numPredict);
  const validated = validatePolish(entry, raw);
  if (!validated.ok) {
    return { ok: false, reason: `${label}:${validated.reason}`, text: '' };
  }
  return { ok: true, text: validated.text, reason: '' };
}

async function processPolish(entry, cp, systemPrompt, stemIndex = null) {
  const rawAbs = path.join(root, entry.outputPath);
  if (!fs.existsSync(rawAbs)) {
    cp.failed[entry.id] = { at: new Date().toISOString(), reason: 'missing raw' };
    savePolishCp(cp);
    return { ok: false, reason: 'missing raw' };
  }
  const stemInfo = resolveStemCanonical(entry, stemIndex || buildStemIndex([entry]));
  const resolvedOrig = resolveRegisterPayload(entry);
  const originalText = (resolvedOrig.kind === 'svg' || resolvedOrig.kind === 'svg-resolved')
    ? resolvedOrig.text
    : (entry.currentPayload || '');
  // Geometry lock = plain sprite ORIGINAL for the stem (shared by fancy styles)
  const geometryLock = stemInfo.canonicalGlyph || originalText;
  const qwenRaw = fs.readFileSync(rawAbs, 'utf8');
  const stageB = resolveStageB(qwenRaw, geometryLock);
  const qwenText = stageB.source === 'qwen'
    ? stageB.text
    : [
      '(Stage 1 unusable — chat/thinking dump with no extractable SVG.',
      'Polish FROM STEM CANONICAL + theme accents; do not invent a new subject.)',
      '',
      stageB.text,
    ].join('\n');
  const outAbs = polishedPathFor(entry);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  const numPredict = entry.promptMode === 'single-anim' ? 1600 : 1200;
  let lastErr = '';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      // Fresh chat for this item attempt — history discarded when we leave / retry.
      const chat = createItemChat(systemPrompt);
      let subjectLock = '';
      try {
        const lockPrompt = buildPolishUserPrompt(entry, {
          originalText: geometryLock,
          qwenText,
          mode: 'subject-lock',
          stemInfo,
        });
        const lockRaw = await chat.say(lockPrompt, 180);
        const lockLine = String(lockRaw || '').split('\n').map((l) => l.trim()).find((l) => /SUBJECT_LOCK:/i.test(l))
          || String(lockRaw || '').trim().slice(0, 280);
        subjectLock = lockLine || `SUBJECT_LOCK: subject=${entry.id}; stem=${stemInfo.stem}; must_keep=stem canonical geometry`;
      } catch {
        subjectLock = `SUBJECT_LOCK: subject=${entry.id}; stem=${stemInfo.stem}; must_keep=stem canonical geometry`;
      }

      const polishRes = await runSvgPass(
        entry,
        buildPolishUserPrompt(entry, {
          originalText: geometryLock,
          qwenText,
          subjectLock,
          mode: 'construct',
          stemInfo,
        }),
        numPredict,
        chat,
        'construct',
      );
      if (!polishRes.ok) {
        lastErr = polishRes.reason;
        continue;
      }

      let working = polishRes.text;
      let critiqueJson = '';
      try {
        const critiquePrompt = buildPolishUserPrompt(entry, {
          originalText: geometryLock,
          qwenText,
          gemmaDraft: working,
          subjectLock,
          mode: 'critique',
          stemInfo,
        });
        const critiqueRaw = await chat.say(critiquePrompt, Math.min(numPredict, 900));
        critiqueJson = String(critiqueRaw || '').trim();
        // Prefer an SVG/CSS unit if the model appended a rewrite after JSON.
        const maybeSvg = validatePolish(entry, critiqueRaw);
        if (maybeSvg.ok) working = maybeSvg.text;
      } catch {
        /* keep working */
      }

      const finalRes = await runSvgPass(
        entry,
        buildPolishUserPrompt(entry, {
          originalText: geometryLock,
          qwenText,
          gemmaDraft: working,
          comparativeDraft: working,
          subjectLock,
          mode: 'apply',
          stemInfo,
          critiqueJson,
        }),
        numPredict,
        chat,
        'apply',
      );
      if (finalRes.ok) working = finalRes.text;

      let forcedReelback = false;
      if (driftSuspect(geometryLock, working, entry.id) || missingOriginalGlyph(geometryLock, working)) {
        const reel = await runSvgPass(
          entry,
          buildPolishUserPrompt(entry, {
            originalText: geometryLock,
            qwenText,
            gemmaDraft: working,
            comparativeDraft: working,
            subjectLock,
            mode: 'verify',
            stemInfo,
          }),
          numPredict,
          chat,
          'verify',
        );
        if (reel.ok && !missingOriginalGlyph(geometryLock, reel.text) && hasUsableSvg(reel.text)) {
          working = reel.text;
          forcedReelback = true;
        } else if (/<(?:path|circle|ellipse|rect|g|line)\b/i.test(geometryLock)) {
          working = buildAdditivePolishFallback(geometryLock, entry);
          forcedReelback = true;
        }
      }

      // Stem consistency + team colors, then hard rule: C must never equal A
      working = enforceStemConsistency(working, geometryLock, entry);
      let forcedDiff = false;
      const beforeDiff = working;
      working = ensurePolishedDiffers(working, geometryLock, entry);
      if (working !== beforeDiff) forcedDiff = true;

      fs.writeFileSync(outAbs, `${working}\n`, 'utf8');
      cp.completed[entry.id] = {
        at: new Date().toISOString(),
        outputPath: path.relative(root, outAbs).replace(/\\/g, '/'),
        bytes: Buffer.byteLength(working, 'utf8'),
        attempt,
        pipeline: 'subject-lock→construct→critique→apply→verify',
        chatMode: 'per-item',
        stageBSource: stageB.source,
        stem: stemInfo.stem,
        stemPlainId: stemInfo.plainId,
        chatTurns: chat.messages.filter((m) => m.role !== 'system').length,
        subjectLock: subjectLock.slice(0, 400),
        constructOk: polishRes.ok,
        critiqueChars: critiqueJson.length,
        applyOk: finalRes.ok,
        comparativeOk: Boolean(critiqueJson),
        finalOk: finalRes.ok,
        forcedReelback,
        forcedDiffFromOriginal: forcedDiff || polishedEqualsOriginal(geometryLock, beforeDiff),
        equalsOriginal: polishedEqualsOriginal(geometryLock, working),
        driftSuspectAfter: driftSuspect(geometryLock, working, entry.id),
      };
      delete cp.failed[entry.id];
      savePolishCp(cp);
      return { ok: true };
    } catch (err) {
      lastErr = err.message || String(err);
    }
  }
  cp.failed[entry.id] = { at: new Date().toISOString(), reason: lastErr };
  savePolishCp(cp);
  return { ok: false, reason: lastErr };
}

function stemKey(entry) {
  const id = entry?.id || entry || '';
  if (id.startsWith('fancy:')) {
    const parts = id.split(':');
    return parts.slice(1, -1).join(':') || parts[1];
  }
  if (id.startsWith('fancy-nav:')) {
    const parts = id.split(':');
    return parts.slice(1, -1).join(':') || parts[1];
  }
  if (id.startsWith('sprite:')) return id.slice('sprite:'.length);
  if (id.startsWith('nav:')) return id.slice('nav:'.length);
  return id;
}

export { stemKey };

/** Group register entries by stem (icon-target, icon-user, …). */
export function buildStemIndex(entries = []) {
  const map = new Map();
  for (const e of entries) {
    if (!e?.id) continue;
    const stem = stemKey(e);
    if (!map.has(stem)) map.set(stem, []);
    map.get(stem).push(e);
  }
  return map;
}

/**
 * Canonical glyph for a stem = plain sprite/nav ORIGINAL (shared by all fancy styles).
 */
export function resolveStemCanonical(entry, stemIndex) {
  const stem = stemKey(entry);
  const siblings = (stemIndex && stemIndex.get(stem)) || [entry];
  const plain = siblings.find((e) => /^(sprite|nav):/.test(e.id) && !e.team)
    || siblings.find((e) => !e.team)
    || siblings.find((e) => e.id.startsWith('sprite:') || e.id.startsWith('nav:'))
    || siblings[0]
    || entry;
  const canonicalGlyph = (() => {
    const resolved = resolveRegisterPayload(plain || entry);
    if (resolved.kind === 'svg' || resolved.kind === 'svg-resolved') return resolved.text;
    return extractSvgUnit(plain?.currentPayload) || String(plain?.currentPayload || entry.currentPayload || '').trim();
  })();
  return {
    stem,
    siblings,
    plainId: plain?.id || entry.id,
    siblingIds: siblings.map((e) => e.id),
    canonicalGlyph,
    canonicalKind: resolveRegisterPayload(plain || entry).kind,
  };
}

/**
 * Force stem consistency: C must contain the canonical glyph; fancy gets team paint.
 * If drifted, rebuild from canonical + additive theme (same silhouette across styles).
 */
export function enforceStemConsistency(svgText, canonicalGlyph, entry = {}) {
  const draft = String(svgText || '');
  const canon = extractSvgUnit(canonicalGlyph) || String(canonicalGlyph || '').trim();
  if (!canon) return enforceTeamColors(draft, entry);

  if (missingOriginalGlyph(canon, draft) || driftSuspect(canon, draft, entry.id)) {
    return enforceTeamColors(buildAdditivePolishFallback(canon, entry), entry);
  }
  return enforceTeamColors(draft, entry);
}

/** Normalize SVG markup for equality checks (ignore comments/whitespace/case). */
export function normalizeForCompare(text) {
  return String(text || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * True when polished C is the same graphic as original A (not allowed).
 * Polished output must always add polish chrome / theme layers — never a bare clone.
 */
export function polishedEqualsOriginal(originalText, polishedText) {
  const aUnit = extractSvgUnit(originalText) || String(originalText || '').trim();
  const cUnit = extractSvgUnit(polishedText) || String(polishedText || '').trim();
  if (!aUnit || !cUnit) return false;
  if (normalizeForCompare(aUnit) === normalizeForCompare(cUnit)) return true;
  // Unwrap a single trivial <g>…</g> and compare again
  const unwrapped = cUnit
    .replace(/^<g\b[^>]*>/i, '')
    .replace(/<\/g>\s*$/i, '')
    .trim();
  if (unwrapped && normalizeForCompare(unwrapped) === normalizeForCompare(aUnit)) {
    // Only count as identical if there is no real polish chrome
    if (!/theme-glow|rianell-fancy|data-polish|data-team=/i.test(cUnit)) return true;
  }
  return false;
}

/**
 * Guarantee C ≠ A: if still identical (or missing polish markers), rebuild additive polish.
 */
export function ensurePolishedDiffers(working, geometryLock, entry = {}) {
  let out = String(working || '');
  let canon = extractSvgUnit(geometryLock) || String(geometryLock || '').trim();
  if (looksLikeJsStub(canon) || !/<(?:path|circle|ellipse|rect|g|line|polyline|polygon|text)\b/i.test(canon)) {
    const resolved = resolveRegisterPayload(entry);
    if (resolved.kind === 'svg' || resolved.kind === 'svg-resolved') canon = resolved.text;
  }
  if (!canon || looksLikeJsStub(canon)) return out;
  // Strip accidental stub wraps before comparing / rebuilding
  if (looksLikeJsStub(out)) {
    out = buildAdditivePolishFallback(canon, entry);
  }
  if (polishedEqualsOriginal(canon, out) || polishedEqualsOriginal(entry.currentPayload || '', out)) {
    out = buildAdditivePolishFallback(canon, entry);
  }
  if (!/rianell-|theme-fx|theme-glow|data-polish|icon-fill/i.test(out)) {
    out = buildAdditivePolishFallback(canon, entry);
  }
  // Final guard after team color pass
  out = enforceTeamColors(out, entry);
  if (polishedEqualsOriginal(canon, out)) {
    out = enforceTeamColors(buildAdditivePolishFallback(canon, entry), entry);
  }
  return out;
}

/** Prefer plain sprite before fancy team variants within a stem. */
export function stemQueueRank(entry) {
  const id = entry.id || '';
  if (/^(sprite|nav):/.test(id) && !entry.team) return 0;
  if (!entry.team) return 1;
  return 2;
}

export function sortQueueByStem(queue) {
  return [...queue].sort((a, b) => {
    const sa = stemKey(a);
    const sb = stemKey(b);
    if (sa !== sb) return sa.localeCompare(sb);
    const ra = stemQueueRank(a);
    const rb = stemQueueRank(b);
    if (ra !== rb) return ra - rb;
    return String(a.id).localeCompare(String(b.id));
  });
}

async function runStemQa(register, genCp, polishCp, systemPrompt) {
  const byStem = new Map();
  for (const e of register.entries) {
    if (e.genStatus === 'skip') continue;
    if (!genCp.completed[e.id]) continue;
    if (!(e.id.startsWith('fancy:') || e.id.startsWith('sprite:') || e.id.startsWith('fancy-nav:') || e.id.startsWith('nav:'))) {
      continue;
    }
    const stem = stemKey(e);
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push(e);
  }

  let done = 0;
  let patched = 0;
  const stems = [...byStem.entries()].filter(([, list]) => list.length >= 2);
  for (const [stem, list] of stems.slice(0, Number.isFinite(LIMIT) ? LIMIT : stems.length)) {
    const payloads = [];
    for (const e of list) {
      const pAbs = polishedPathFor(e);
      const rawAbs = path.join(root, e.outputPath);
      const src = fs.existsSync(pAbs) ? pAbs : rawAbs;
      if (!fs.existsSync(src)) continue;
      payloads.push({
        id: e.id,
        team: e.team || 'plain',
        original: String(e.currentPayload || '').slice(0, 400),
        text: fs.readFileSync(src, 'utf8').slice(0, 1500),
      });
    }
    if (payloads.length < 2) continue;
    const prompt = [
      'Rianell theme-unify QA. Each variant used multi-pass polish with CORE SUBJECT PRESERVATION vs ORIGINAL A.',
      `STEM=${stem}`,
      'If each variant still matches its original subject (no X→ring drift etc.) and teams align, reply exactly: PASS',
      'Otherwise return a JSON object { "patches": { "<id>": "<svg or fragment>" } } with only ids that need fixes.',
      'No markdown fences. No extra keys.',
      JSON.stringify(payloads),
    ].join('\n');
    try {
      const raw = await ollamaGenerate(prompt, 2000, systemPrompt);
      const text = stripFences(raw);
      done += 1;
      if (/^\s*PASS\s*$/i.test(text)) {
        console.log(`[visual-polish-qa] ${stem} PASS`);
        continue;
      }
      let obj = null;
      try {
        obj = JSON.parse(text);
      } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
          try { obj = JSON.parse(m[0]); } catch { /* ignore */ }
        }
      }
      if (!obj || !obj.patches) {
        console.log(`[visual-polish-qa] ${stem} no-patches`);
        continue;
      }
      for (const [id, frag] of Object.entries(obj.patches)) {
        const entry = list.find((e) => e.id === id);
        if (!entry) continue;
        const validated = validatePolish(entry, frag);
        if (!validated.ok) continue;
        const outAbs = polishedPathFor(entry);
        fs.mkdirSync(path.dirname(outAbs), { recursive: true });
        fs.writeFileSync(outAbs, validated.text + '\n', 'utf8');
        polishCp.completed[id] = {
          at: new Date().toISOString(),
          outputPath: path.relative(root, outAbs).replace(/\\/g, '/'),
          bytes: Buffer.byteLength(validated.text, 'utf8'),
          qaPatched: true,
        };
        patched += 1;
      }
      savePolishCp(polishCp);
      console.log(`[visual-polish-qa] ${stem} patched`);
    } catch (err) {
      console.log(`[visual-polish-qa] ${stem} FAIL ${err.message}`);
    }
  }
  console.log(`[visual-polish-qa] finished stems=${done} patchedIds=${patched}`);
}

async function poolMap(items, concurrency, worker) {
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
}

async function main() {
  const register = loadJson(registerPath, null);
  if (!register) throw new Error('visual-register.json missing');
  const genCp = loadJson(genCpPath, { completed: {} });
  const polishCp = loadJson(polishCpPath, { completed: {}, failed: {} });

  const contractMeta = scanProjectStylingContract(root);
  const systemPrompt = buildPolishSystemPrompt(contractMeta.contract);

  if (statusOnly) {
    logContractIngestion(contractMeta, { quietJson: true });
    const eligible = (register.entries || []).filter((e) => e.genStatus !== 'skip' && genCp.completed[e.id]);
    const pending = eligible.filter((e) => !polishCp.completed[e.id] && !polishCp.failed[e.id]);
    console.log(JSON.stringify({
      eligible: eligible.length,
      polished: Object.keys(polishCp.completed || {}).length,
      failed: Object.keys(polishCp.failed || {}).length,
      pending: pending.length,
      concurrency: CONCURRENCY,
      model: MODEL,
      numCtx: NUM_CTX,
      contractFiles: contractMeta.files.length,
      contractChars: contractMeta.chars,
      contractTruncated: contractMeta.truncated,
      contractPaths: contractMeta.files.map((f) => f.path),
      updatedAt: polishCp.updatedAt || null,
    }, null, 2));
    return;
  }

  logContractIngestion(contractMeta);

  if (resetPolished) {
    const n = Object.keys(polishCp.completed || {}).length;
    polishCp.completed = {};
    polishCp.failed = {};
    polishCp.resetAt = new Date().toISOString();
    polishCp.pipeline = 'construct→critique→apply→verify';
    savePolishCp(polishCp);
    console.log(`[visual-polish] --reset-polished cleared ${n} completed entries`);
  }

  let runtimeIds = IDS ? new Set(IDS) : null;

  if (repolishFromQa) {
    const broken = loadJson(qaBrokenPath, null);
    const ids = Array.isArray(broken?.ids) ? broken.ids : [];
    if (!ids.length) {
      console.log('[visual-polish] --repolish-from-qa: no broken ids in artifacts/visual-gen/qa/broken.json');
      return;
    }
    const brokenAt = broken?.at ? Date.parse(broken.at) : 0;
    let cleared = 0;
    let preserved = 0;
    for (const id of ids) {
      const done = polishCp.completed?.[id];
      if (done) {
        const doneAt = done.at ? Date.parse(done.at) : 0;
        // Guard: never wipe work completed after the broken snapshot (or qaPatched).
        if (done.qaPatched || (brokenAt && doneAt && doneAt > brokenAt)) {
          preserved += 1;
          continue;
        }
        delete polishCp.completed[id];
        cleared += 1;
      }
      if (polishCp.failed?.[id]) delete polishCp.failed[id];
    }
    savePolishCp(polishCp);
    console.log(`[visual-polish] --repolish-from-qa cleared ${cleared}/${ids.length} ids for Gemma re-polish`
      + (preserved ? ` · preserved ${preserved} already-fixed` : ''));
    if (!runtimeIds) runtimeIds = new Set(ids);
    else for (const id of ids) runtimeIds.add(id);
    // Drop preserved ids from the runtime queue so we do not re-process them.
    for (const id of [...runtimeIds]) {
      if (polishCp.completed?.[id]) runtimeIds.delete(id);
    }
    const prevProg = loadJson(QA_PROGRESS_PATH, {});
    writeQaProgress({
      active: true,
      stage: 'repolish',
      phase: 'repolish',
      round: prevProg.round ?? 1,
      maxRounds: prevProg.maxRounds ?? 8,
      current: 0,
      total: runtimeIds.size,
      unit: 'broken',
      detail: `Re-polish ${runtimeIds.size} broken · Pass ${prevProg.round ?? 1} (max ${prevProg.maxRounds ?? 8})`,
      brokenSoFar: ids.length,
    });
  }

  if (qaStems) {
    await runStemQa(register, genCp, polishCp, systemPrompt);
    return;
  }

  let queue = (register.entries || []).filter((e) => e.genStatus !== 'skip' && genCp.completed[e.id]);
  queue = queue.filter((e) => {
    if (runtimeIds && !runtimeIds.has(e.id)) return false;
    if (polishCp.completed[e.id]) return false;
    if (polishCp.failed[e.id] && !forceFailed) return false;
    // Phase 4: team variants are derived via generate-theme-icons — do not LLM-polish them
    // unless explicitly forced via --ids= / --repolish-from-qa / --force-failed.
    if (e.team && !runtimeIds && !forceFailed) return false;
    if (/^fancy:|^fancy-nav:/.test(e.id) && !runtimeIds && !forceFailed) return false;
    return true;
  });
  queue = sortQueueByStem(queue);
  if (Number.isFinite(LIMIT)) queue = queue.slice(0, LIMIT);

  const stemIndex = buildStemIndex(register.entries || []);

  console.log(`[visual-polish] host=${HOST} model=${MODEL} concurrency=${CONCURRENCY} num_ctx=${NUM_CTX} queue=${queue.length} stemOrder=1`);
  if (!queue.length) {
    console.log('[visual-polish] nothing to do');
    return;
  }

  let done = 0;
  let failed = 0;
  const t0 = Date.now();
  const qaProg = loadJson(QA_PROGRESS_PATH, {});
  const heartbeatQa = !!(repolishFromQa || Number(qaProg.round) > 0);
  await poolMap(queue, CONCURRENCY, async (entry) => {
    const res = await processPolish(entry, polishCp, systemPrompt, stemIndex);
    done += 1;
    if (!res.ok) failed += 1;
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`[visual-polish] ${done}/${queue.length} ${res.ok ? 'OK' : 'FAIL'} ${entry.id}${res.ok ? '' : ` (${res.reason})`} ${elapsed}s`);
    if (heartbeatQa && (done === 1 || done % 5 === 0 || done === queue.length)) {
      const prog = loadJson(QA_PROGRESS_PATH, {});
      writeQaProgress({
        active: done < queue.length,
        stage: 'repolish',
        phase: 'repolish',
        round: prog.round ?? qaProg.round ?? 1,
        maxRounds: prog.maxRounds ?? qaProg.maxRounds ?? 8,
        current: done,
        total: queue.length,
        unit: 'broken',
        detail: `${entry.id} · ${done}/${queue.length}`,
      });
    }
  });
  console.log(`[visual-polish] finished ok=${done - failed} failed=${failed}`);
  if (heartbeatQa) {
    const prog = loadJson(QA_PROGRESS_PATH, {});
    writeQaProgress({
      active: false,
      stage: failed ? 'needs-fix' : 'repolish',
      phase: 'repolish',
      round: prog.round ?? 1,
      maxRounds: prog.maxRounds ?? 8,
      current: done,
      total: queue.length,
      unit: 'broken',
      detail: `Re-polish finished ok=${done - failed} failed=${failed} · Pass ${prog.round ?? 1} (max ${prog.maxRounds ?? 8})`,
      exitCode: failed ? 1 : 0,
    });
  }
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
  const flushOnSignal = async (sig) => {
    try {
      const { buildState } = await import('./visual-pipeline-state.mjs');
      const state = await buildState();
      state.reason = `signal ${sig}`;
      fs.mkdirSync(artRoot, { recursive: true });
      fs.writeFileSync(path.join(artRoot, 'pipeline-state.json'), JSON.stringify(state, null, 2) + '\n');
      console.log(`[visual-polish] ${sig} — banked pipeline-state.json`);
    } catch (err) {
      console.error('[visual-polish] signal flush failed', err.message);
    }
    process.exit(130);
  };
  process.on('SIGINT', () => { flushOnSignal('SIGINT'); });
  process.on('SIGTERM', () => { flushOnSignal('SIGTERM'); });
  main().catch((err) => {
    console.error('[visual-polish] fatal', err);
    process.exit(1);
  });
}
