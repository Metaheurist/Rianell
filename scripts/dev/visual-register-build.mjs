#!/usr/bin/env node
/**
 * Build apps/pwa-webapp/assets/visual-register.json — one atomic entry per SVG/anim unit.
 * Usage: node scripts/dev/visual-register-build.mjs [--check]
 */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { THEME_FX_TOKENS, getTeamIds } from '@rianell/tokens';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const pwa = path.join(root, 'apps/pwa-webapp');
const outPath = path.join(pwa, 'assets/visual-register.json');
const checkOnly = process.argv.includes('--check');

const AVATAR_IDS = [
  'voidorb', 'tidewarden', 'leafcircuit', 'prismcore', 'moonthread',
  'emberveil', 'riftecho', 'stonebloom', 'glasswave', 'ashspiral',
  'coralnode', 'starlace', 'mistveil', 'thornloop', 'sunwarden',
  'duskmantle', 'ironbloom', 'vortexseed', 'lumenshard', 'driftmoss',
];
const METRIC_ENTITY_IDS = [
  'mood', 'sleep', 'fatigue', 'pain', 'mobility', 'stiffness',
  'swelling', 'steps', 'hydration', 'bpm', 'flare', 'dailyFunction',
  'irritability', 'weatherSensitivity',
];
const BADGE_FRAME_IDS = [
  'food_logging', 'exercise_logging', 'medication_logging',
  'milestone_3', 'milestone_30', 'milestone_60', 'milestone_90', 'milestone_180',
  'sleep_pioneer', 'cycle_tracker', 'full_logger',
];
const BADGE_TIERS = ['bronze', 'silver', 'gold', 'platinum'];
const CYCLE_PHASE_IDS = ['menstrual', 'follicular', 'ovulation', 'luteal'];
const ACCESSORIES = [
  'glasses', 'sunglasses', 'cap', 'beanie', 'crown', 'halo',
  'bow', 'scarf', 'headphones', 'sparkleOrbit',
];
const AVATAR_PARTS = [
  'glow', 'eyes-default', 'eyes-arc', 'eyes-dot', 'eyes-ellipse',
  'mouth-smile', 'mouth-dot', 'mouth-line',
  'body-round', 'body-tall', 'body-wide',
];

function sha10(s) {
  return createHash('sha256').update(String(s)).digest('hex').slice(0, 10);
}

function extractSpriteSymbols(html) {
  const m = html.match(/<svg[^>]*class="rianell-icon-sprite"[^>]*>([\s\S]*?)<\/svg>/i)
    || html.match(/<svg[^>]*id="icon-defs"[^>]*>([\s\S]*?)<\/svg>/i);
  if (!m) throw new Error('icon sprite host not found in index.html');
  const out = [];
  const re = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi;
  let match;
  while ((match = re.exec(m[1])) !== null) {
    const attrs = match[1];
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/);
    if (!idMatch) continue;
    const vb = attrs.match(/\bviewBox=["']([^"']+)["']/);
    out.push({
      id: idMatch[1],
      viewBox: vb ? vb[1] : '0 0 24 24',
      inner: match[2].trim(),
    });
  }
  return out;
}

function extractNavSymbols(html) {
  const out = [];
  const re = /<symbol\b([^>]*)\bid=["'](rianell-nav-[^"']+)["']([^>]*)>([\s\S]*?)<\/symbol>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const attrs = `${match[1]} id="${match[2]}" ${match[3]}`;
    const vb = attrs.match(/\bviewBox=["']([^"']+)["']/);
    out.push({
      id: match[2],
      viewBox: vb ? vb[1] : '0 0 24 24',
      inner: match[4].trim(),
    });
  }
  // fallback simpler scan
  if (!out.length) {
    const simple = /<symbol[^>]*id=["'](rianell-nav-[^"']+)["'][^>]*>([\s\S]*?)<\/symbol>/gi;
    let m2;
    while ((m2 = simple.exec(html)) !== null) {
      out.push({ id: m2[1], viewBox: '0 0 24 24', inner: m2[2].trim() });
    }
  }
  return out;
}

function extractKeyframes(css, sourcePath) {
  const out = [];
  const re = /@keyframes\s+([A-Za-z0-9_-]+)\s*\{/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') depth -= 1;
      i += 1;
    }
    const body = css.slice(m.index, i);
    out.push({ name, body, sourcePath });
  }
  return out;
}

function extractFaClasses(text) {
  const set = new Set();
  const re = /\b(fa-(?:solid|brands|regular))\s+(fa-[a-z0-9-]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    set.add(`${m[1]} ${m[2]}`);
  }
  return [...set].sort();
}

function settingsUsageFromHtml(html) {
  const sites = [];
  const re = /settings-icon-svg[^>]*>[\s\S]*?<use[^>]*href=["']#([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    sites.push({ file: 'apps/pwa-webapp/index.html', ref: `settings-icon-svg → #${m[1]}` });
  }
  return sites;
}

function entry(partial) {
  const id = partial.id;
  const kind = partial.kind;
  const themes = partial.themes || ['plain'];
  const payload = partial.currentPayload || '';
  return {
    id,
    kind,
    atomicUnit: true,
    viewBox: partial.viewBox || '0 0 24 24',
    sourcePath: partial.sourcePath,
    currentPayload: payload,
    usageSites: partial.usageSites || [],
    themes,
    states: partial.states || ['default'],
    context: partial.context || '',
    promptMode: partial.promptMode || (kind === 'animation' || kind === 'fx' ? 'single-anim' : 'single-svg'),
    genStatus: partial.genStatus || (kind === 'raster-catalog' ? 'skip' : 'pending'),
    promptHash: sha10(`${id}|${kind}|${payload.slice(0, 400)}`),
    outputPath: partial.outputPath
      || `artifacts/visual-gen/${kind === 'animation' || kind === 'fx' ? 'anims' : 'icons'}/${id.replace(/[^a-zA-Z0-9._-]+/g, '_')}.txt`,
    team: partial.team || null,
  };
}

function build() {
  const html = fs.readFileSync(path.join(pwa, 'index.html'), 'utf8');
  const portfolioSrc = fs.readFileSync(path.join(pwa, 'modules/graphics-portfolio.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(pwa, 'app.js'), 'utf8');
  const themeFx = fs.readFileSync(path.join(pwa, 'modules/theme-fx.js'), 'utf8');
  const oasisJs = fs.readFileSync(path.join(pwa, 'modules/oasis-canvas.js'), 'utf8');

  const cssFiles = [
    ['apps/pwa-webapp/styles.css', path.join(pwa, 'styles.css')],
    ['apps/pwa-webapp/css/oasis.css', path.join(pwa, 'css/oasis.css')],
    ['apps/pwa-webapp/css/theme-icons.css', path.join(pwa, 'css/theme-icons.css')],
    ['apps/pwa-webapp/css/graphics-portfolio.css', path.join(pwa, 'css/graphics-portfolio.css')],
  ];

  const entries = [];
  const settingsSites = settingsUsageFromHtml(html);
  const settingsByIcon = new Map();
  for (const s of settingsSites) {
    const id = s.ref.split('#').pop();
    if (!settingsByIcon.has(id)) settingsByIcon.set(id, []);
    settingsByIcon.get(id).push(s);
  }

  const symbols = extractSpriteSymbols(html);
  const teams = getTeamIds();

  for (const sym of symbols) {
    const usage = settingsByIcon.get(sym.id) || [];
    entries.push(entry({
      id: `sprite:${sym.id}`,
      kind: 'sprite',
      viewBox: sym.viewBox,
      sourcePath: 'apps/pwa-webapp/index.html',
      currentPayload: sym.inner,
      usageSites: [
        { file: 'apps/pwa-webapp/index.html', ref: `#${sym.id}` },
        ...usage,
      ],
      themes: ['plain'],
      states: ['default', 'active'],
      context: `Rianell PWA UI icon symbol ${sym.id}. Used via <use href="#${sym.id}"> across home/logs/charts/mood/ai/settings. Stroke/fill currentColor. Keep 24×24 geometry.`,
      outputPath: `artifacts/visual-gen/icons/sprite_${sym.id}.plain.txt`,
    }));

    for (const team of teams) {
      const tok = THEME_FX_TOKENS.teams[team] || {};
      entries.push(entry({
        id: `fancy:${sym.id}:${team}`,
        kind: 'sprite',
        viewBox: '0 0 24 24',
        sourcePath: 'apps/pwa-webapp/index.html',
        currentPayload: sym.inner,
        usageSites: [{ file: 'apps/pwa-webapp/assets', ref: `icon-sprite-fancy-${team}.svg#${sym.id}--fancy` }],
        themes: [team],
        team,
        states: ['fancy', 'bold'],
        context: `Fancy claymorphic treatment for ${sym.id} on team ${team}. glow=${tok.glow || ''} alt=${tok.particleColorAlt || ''} particle=${tok.particleType || ''}. Output ONLY the inner markup for symbol id="${sym.id}--fancy" viewBox 0 0 24 24. Keep original glyph recognizable; add soft blob/ring using team colors.`,
        outputPath: `artifacts/visual-gen/icons/fancy_${sym.id}_${team}.txt`,
      }));
    }
  }

  for (const nav of extractNavSymbols(html)) {
    entries.push(entry({
      id: `nav:${nav.id}`,
      kind: 'nav',
      viewBox: nav.viewBox,
      sourcePath: 'apps/pwa-webapp/index.html',
      currentPayload: nav.inner,
      usageSites: [{ file: 'apps/pwa-webapp/index.html', ref: `#${nav.id}` }],
      context: `Bottom/top nav emblem ${nav.id}. Active tab micro-bounce. currentColor strokes.`,
      outputPath: `artifacts/visual-gen/icons/nav_${nav.id}.txt`,
    }));
    for (const team of teams) {
      const tok = THEME_FX_TOKENS.teams[team] || {};
      entries.push(entry({
        id: `fancy-nav:${nav.id}:${team}`,
        kind: 'nav',
        viewBox: nav.viewBox,
        sourcePath: 'apps/pwa-webapp/index.html',
        currentPayload: nav.inner,
        themes: [team],
        team,
        states: ['fancy', 'bold'],
        context: `Fancy nav emblem for ${nav.id} team ${team} glow=${tok.glow || ''}.`,
        outputPath: `artifacts/visual-gen/icons/fancy_nav_${nav.id}_${team}.txt`,
      }));
    }
  }

  for (const id of AVATAR_IDS) {
    entries.push(entry({
      id: `avatar:${id}`,
      kind: 'avatar',
      viewBox: '0 0 64 64',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `avatarSymbolPathsForId('${id}')`,
      usageSites: [{ file: 'apps/pwa-webapp/modules/graphics-portfolio.js', ref: `#icon-${id}` }],
      context: `Profile companion avatar ${id}. Abstract creature, friendly, uses CSS vars --avatar-primary/secondary/glow/eye. viewBox 0 0 64 64. Settings carousel + header.`,
      outputPath: `artifacts/visual-gen/icons/avatar_${id}.txt`,
    }));
  }

  for (const part of AVATAR_PARTS) {
    entries.push(entry({
      id: `avatar-part:${part}`,
      kind: 'avatar-part',
      viewBox: '0 0 64 64',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: part,
      context: `Composable avatar generation fragment '${part}' for icon-gen-* companions. Preserve CSS var fills. Output a single <g> fragment.`,
      outputPath: `artifacts/visual-gen/icons/avatar_part_${part}.txt`,
    }));
  }
  for (const acc of ACCESSORIES) {
    entries.push(entry({
      id: `avatar-part:accessory-${acc}`,
      kind: 'avatar-part',
      viewBox: '0 0 64 64',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `avatarAccessoryMarkup case '${acc}'`,
      context: `Avatar accessory '${acc}' for generated companions. Single <g class="avatar-accessory avatar-accessory--${acc}"> fragment.`,
      outputPath: `artifacts/visual-gen/icons/avatar_acc_${acc}.txt`,
    }));
  }

  for (const id of METRIC_ENTITY_IDS) {
    entries.push(entry({
      id: `metric:${id}`,
      kind: 'metric',
      viewBox: '0 0 32 32',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `metricEntityPaths('${id}')`,
      usageSites: [{ file: 'apps/pwa-webapp/modules/graphics-portfolio.js', ref: `#icon-metric-${id}` }],
      context: `Metric companion glyph for wellness slider ${id}. Compact, readable at 24px.`,
      outputPath: `artifacts/visual-gen/icons/metric_${id}.txt`,
    }));
  }

  for (const id of BADGE_FRAME_IDS) {
    entries.push(entry({
      id: `emblem-badge:${id}`,
      kind: 'emblem-badge',
      viewBox: '0 0 64 64',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `badgeFramePaths('${id}')`,
      context: `Achievement badge frame emblem for ${id}. Frame only, not the rich scene.`,
      outputPath: `artifacts/visual-gen/icons/emblem_badge_${id}.txt`,
    }));
    entries.push(entry({
      id: `achievement:${id}`,
      kind: 'achievement',
      viewBox: '0 0 64 64',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `achievementIconSvgMarkup('${id}')`,
      context: `Rich animated achievement scene SVG for ${id}. Keep CSS class hooks (ach-icon, ach-*) for existing animations.`,
      outputPath: `artifacts/visual-gen/icons/achievement_${id}.txt`,
    }));
  }

  for (const id of BADGE_TIERS) {
    entries.push(entry({
      id: `emblem-tier:${id}`,
      kind: 'emblem-tier',
      viewBox: '0 0 64 64',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `tierRingPaths('${id}')`,
      context: `Tier ring emblem ${id} for achievement badges.`,
      outputPath: `artifacts/visual-gen/icons/emblem_tier_${id}.txt`,
    }));
  }
  for (const id of CYCLE_PHASE_IDS) {
    entries.push(entry({
      id: `emblem-cycle:${id}`,
      kind: 'emblem-cycle',
      viewBox: '0 0 32 32',
      sourcePath: 'apps/pwa-webapp/modules/graphics-portfolio.js',
      currentPayload: `cyclePhasePaths('${id}')`,
      context: `Cycle phase emblem ${id}. Theme icon, not emoji.`,
      outputPath: `artifacts/visual-gen/icons/emblem_cycle_${id}.txt`,
    }));
  }

  const faPairs = extractFaClasses(`${appJs}\n${html}`);
  for (const pair of faPairs) {
    const glyph = pair.split(/\s+/)[1] || pair;
    const stem = glyph.replace(/^fa-/, '');
    entries.push(entry({
      id: `fa-replace:${pair.replace(/\s+/g, '_')}`,
      kind: 'fa-replace',
      viewBox: '0 0 24 24',
      sourcePath: 'apps/pwa-webapp/app.js',
      currentPayload: pair,
      context: `Replace Font Awesome ${pair} with a native Rianell SVG symbol suitable for food/energy/install UI. Output symbol-inner for icon-fa-${stem}.`,
      outputPath: `artifacts/visual-gen/icons/fa_${stem}.txt`,
    }));
  }

  for (const [rel, abs] of cssFiles) {
    if (!fs.existsSync(abs)) continue;
    const css = fs.readFileSync(abs, 'utf8');
    for (const kf of extractKeyframes(css, rel)) {
      entries.push(entry({
        id: `animation:${kf.name}`,
        kind: 'animation',
        viewBox: '',
        sourcePath: rel,
        currentPayload: kf.body,
        promptMode: 'single-anim',
        context: `Regenerate CSS @keyframes ${kf.name} from ${rel}. Keep the name exactly. Respect prefers-reduced-motion consumers. Output ONLY the @keyframes block.`,
        outputPath: `artifacts/visual-gen/anims/kf_${kf.name}.txt`,
      }));
    }
  }

  const particleTypes = ['leaves', 'embers', 'smoke', 'rain'];
  for (const pt of particleTypes) {
    entries.push(entry({
      id: `fx:theme-fx-${pt}`,
      kind: 'fx',
      sourcePath: 'apps/pwa-webapp/modules/theme-fx.js',
      currentPayload: themeFx.includes(pt) ? `particleType:${pt}` : pt,
      promptMode: 'single-anim',
      context: `Theme FX canvas particle drawer for type ${pt}. Preserve intensity gates off/subtle/bold and reduce-motion. Output a JS function body snippet for drawing one particle frame.`,
      outputPath: `artifacts/visual-gen/anims/fx_theme_${pt}.txt`,
    }));
  }
  for (const name of ['ambientBlobs', 'neuralVeins', 'charMorph', 'streamDots', 'holoShimmer', 'confetti']) {
    entries.push(entry({
      id: `fx:oasis-${name}`,
      kind: 'fx',
      sourcePath: 'apps/pwa-webapp/modules/oasis-canvas.js',
      currentPayload: oasisJs.includes(name) ? name : `oasis:${name}`,
      promptMode: 'single-anim',
      context: `Oasis canvas/DOM FX unit ${name}. Preserve reduce-motion gates. Output focused JS/CSS snippet only.`,
      outputPath: `artifacts/visual-gen/anims/fx_oasis_${name}.txt`,
    }));
  }

  // Raster catalog (skip)
  const iconsDir = path.join(pwa, 'Icons');
  if (fs.existsSync(iconsDir)) {
    for (const name of fs.readdirSync(iconsDir)) {
      if (!/\.png$/i.test(name)) continue;
      entries.push(entry({
        id: `raster:${name}`,
        kind: 'raster-catalog',
        sourcePath: `apps/pwa-webapp/Icons/${name}`,
        currentPayload: name,
        genStatus: 'skip',
        context: 'PWA raster app icon — catalog only, no Ollama regen.',
        outputPath: `artifacts/visual-gen/skip/${name}.txt`,
      }));
    }
  }

  // Deduplicate by id
  const byId = new Map();
  for (const e of entries) {
    if (!byId.has(e.id)) byId.set(e.id, e);
  }
  const list = [...byId.values()];

  const counts = {};
  for (const e of list) {
    counts[e.kind] = (counts[e.kind] || 0) + 1;
  }

  const register = {
    version: 1,
    generatedAt: new Date().toISOString(),
    teams,
    symbolCounts: {
      spritePlain: symbols.length,
      teams: teams.length,
      totalEntries: list.length,
      byKind: counts,
      pending: list.filter((e) => e.genStatus === 'pending').length,
      skip: list.filter((e) => e.genStatus === 'skip').length,
    },
    budgets: THEME_FX_TOKENS.budgets,
    entries: list,
  };

  if (checkOnly) {
    if (!fs.existsSync(outPath)) {
      console.error('[visual-register] missing register file');
      process.exit(1);
    }
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const prevIds = new Set((prev.entries || []).map((e) => e.id));
    const nextIds = new Set(list.map((e) => e.id));
    const missing = [...nextIds].filter((id) => !prevIds.has(id));
    const extra = [...prevIds].filter((id) => !nextIds.has(id));
    if (missing.length || extra.length) {
      console.error('[visual-register] drift', { missing: missing.slice(0, 20), extra: extra.slice(0, 20) });
      process.exit(1);
    }
    console.log(`[visual-register] check OK entries=${list.length}`);
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(register, null, 2) + '\n');
  console.log(`[visual-register] wrote ${outPath}`);
  console.log(`[visual-register] total=${list.length} pending=${register.symbolCounts.pending} byKind=${JSON.stringify(counts)}`);
}

build();
