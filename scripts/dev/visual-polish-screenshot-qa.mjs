#!/usr/bin/env node
/**
 * Full post-polish visual QA gate.
 *
 * For EVERY polished icon:
 *   1) Screenshot the A/B/C preview card
 *   2) Heuristic + DOM checks: broken ink, glyph drift, C≠A, theme colors
 *   3) Description / subject fit vs register context + id
 *   4) Location / surrounding fitment (sourcePath, usageSites, themes, states, kind)
 *   5) Offset / viewBox shift vs original A
 *   6) Theme-pack cohesion across fancy:* siblings of the same stem
 *   7) Stem contact-sheet screenshots (plain + all teams) for pack review
 *   8) Human-figure anatomy (≤2 arms, readable torso/head; no extra limbs)
 *   9) Animation cohesion + mid-frame clipping (sample keyframes via DOM)
 *  10) With --gemma-review: vision-pass every icon screenshot + every stem sheet
 *      (subject, anatomy, broken/clip graphics, offset, location, theme, motion)
 *
 * Does NOT apply/wire/push icons.
 *
 * Usage:
 *   node scripts/dev/visual-polish-screenshot-qa.mjs
 *   node scripts/dev/visual-polish-screenshot-qa.mjs --now
 *   node scripts/dev/visual-polish-screenshot-qa.mjs --page-size=6
 *   node scripts/dev/visual-polish-screenshot-qa.mjs --base=http://localhost:8766
 *   node scripts/dev/visual-polish-screenshot-qa.mjs --gemma-review   # optional LLM pass on broken/borderline
 *
 * Outputs:
 *   artifacts/visual-gen/qa/report.json
 *   artifacts/visual-gen/qa/screenshots/*.png
 *   artifacts/visual-gen/qa/stem-sheets/*.png
 *   artifacts/visual-gen/qa/broken.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  extractSvgUnit,
  hasUsableSvg,
  missingOriginalGlyph,
  driftSuspect,
  polishedEqualsOriginal,
  resolveRegisterPayload,
  themePaintForTeam,
  buildStemIndex,
  resolveStemCanonical,
  stemKey,
  analyzeSeamlessLoop,
  extractCssKeyframes,
} from './visual-polish-queue.mjs';
import { writeQaProgress } from './visual-polish-qa-status.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const artRoot = path.join(root, 'artifacts/visual-gen');
const qaRoot = path.join(artRoot, 'qa');
const shotRoot = path.join(qaRoot, 'screenshots');
const stemSheetRoot = path.join(qaRoot, 'stem-sheets');
const polishCpPath = path.join(artRoot, 'polish-checkpoint.json');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
const userFocusPath = path.join(root, 'scripts/dev/visual-polish-qa-user-focus.json');

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
const MODEL = process.env.VISUAL_POLISH_MODEL || 'gemma4:31b-it-qat';

const args = process.argv.slice(2);
const now = args.includes('--now');
const gemmaReview = args.includes('--gemma-review');
const baseArg = args.find((a) => a.startsWith('--base='));
const pageArg = args.find((a) => a.startsWith('--page-size='));
const BASE = (baseArg?.split('=')[1] || process.env.VISUAL_PREVIEW_BASE || 'http://localhost:8766').replace(/\/$/, '');
const PAGE_SIZE = Math.max(1, Number(pageArg?.split('=')[1] || 6));

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function safeFile(id) {
  return String(id).replace(/[^a-zA-Z0-9._-]+/g, '__').slice(0, 120);
}

function invisibleInk(svgMarkup) {
  const t = String(svgMarkup || '');
  if (!t) return true;
  if (!hasUsableSvg(t) && !/<(?:path|circle|ellipse|rect|line|polyline|polygon)\b/i.test(t)) return true;
  const hasStroke = /\bstroke\s*=\s*["'](?!none)[^"']+/i.test(t) || /\bstroke=["']currentColor/i.test(t);
  const onlyNoneFill = /\bfill=["']none["']/i.test(t) && !/\bfill=["'](?!none)[^"']+/i.test(t);
  if (onlyNoneFill && !hasStroke) return true;
  return false;
}

/** Broken paths / NaN coords / off-canvas geometry. */
export function analyzeBrokenGraphics(svgText, viewBox = '0 0 24 24') {
  const reasons = [];
  const t = String(svgText || '');
  if (!t.trim()) {
    reasons.push('empty SVG');
    return reasons;
  }
  if (/NaN|Infinity/i.test(t)) reasons.push('NaN/Infinity coordinates');
  if (/\bd="\s*"/i.test(t) || /\bd=""/.test(t)) reasons.push('empty path d=');
  // Truncated mid-attribute (breaks HTML galleries / swallows scroll sentinel)
  if ((t.match(/"/g) || []).length % 2 === 1) {
    reasons.push('truncated SVG attribute quotes');
  }
  const gOpen = [...t.matchAll(/<g\b([^>]*)>/gi)].filter((m) => !String(m[1] || '').trim().endsWith('/')).length;
  const gClose = (t.match(/<\/g>/gi) || []).length;
  if (gOpen > gClose) reasons.push('unclosed <g> in polished SVG');
  // truncated / broken attribute quotes
  if ((t.match(/="/g) || []).length !== (t.match(/"/g) || []).length / 1 && /="[^"]*$/m.test(t)) {
    reasons.push('possibly truncated attribute quotes');
  }
  const vb = String(viewBox || '0 0 24 24').split(/[\s,]+/).map(Number);
  const [, , vw, vh] = vb.length >= 4 ? vb : [0, 0, 24, 24];
  const maxDim = Math.max(vw || 24, vh || 24);
  const nums = [...t.matchAll(/\b(?:cx|cy|x|y|x1|y1|x2|y2|r|rx|ry|width|height)="(-?[\d.]+)"/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n));
  for (const n of nums) {
    if (Math.abs(n) > maxDim * 4) {
      reasons.push(`extreme coordinate ${n} vs viewBox ${viewBox}`);
      break;
    }
  }
  // unclosed tags (rough)
  const opens = (t.match(/<(?:g|svg|symbol|defs)\b[^>]*(?<!\/)\s*>/gi) || []).length;
  const closes = (t.match(/<\/(?:g|svg|symbol|defs)>/gi) || []).length;
  if (opens > closes + 1) reasons.push('unbalanced group/svg tags');
  return reasons;
}

/** Compare A vs C bbox centers — flag large offset shift. */
export function analyzeOffsetShift(aSvg, cSvg, viewBox = '0 0 24 24') {
  const reasons = [];
  const vb = String(viewBox || '0 0 24 24').split(/[\s,]+/).map(Number);
  const vw = vb[2] || 24;
  const vh = vb[3] || 24;
  const centerOf = (svg) => {
    const t = String(svg || '');
    const xs = [];
    const ys = [];
    for (const m of t.matchAll(/\bcx="(-?[\d.]+)"/gi)) xs.push(Number(m[1]));
    for (const m of t.matchAll(/\bcy="(-?[\d.]+)"/gi)) ys.push(Number(m[1]));
    for (const m of t.matchAll(/\bx="(-?[\d.]+)"/gi)) xs.push(Number(m[1]));
    for (const m of t.matchAll(/\by="(-?[\d.]+)"/gi)) ys.push(Number(m[1]));
    // path M x y starts
    for (const m of t.matchAll(/\b[Mm]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/g)) {
      xs.push(Number(m[1]));
      ys.push(Number(m[2]));
    }
    if (!xs.length || !ys.length) return null;
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return { x: avg(xs), y: avg(ys) };
  };
  const ca = centerOf(aSvg);
  const cc = centerOf(cSvg);
  if (!ca || !cc) return reasons;
  const dx = Math.abs(ca.x - cc.x);
  const dy = Math.abs(ca.y - cc.y);
  const thresh = Math.max(vw, vh) * 0.18; // >18% of canvas = offset shift
  if (dx > thresh || dy > thresh) {
    reasons.push(`offset shift vs A (dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}, thresh=${thresh.toFixed(1)})`);
  }
  return reasons;
}

/** Subject / description fit: id + context keywords should appear in geometry/classes. */
export function analyzeDescriptionFit(entry, cSvg) {
  const reasons = [];
  const id = String(entry?.id || '');
  const ctx = `${entry?.context || ''} ${id}`.toLowerCase();
  const svg = String(cSvg || '').toLowerCase();
  if (!svg.trim()) {
    reasons.push('description fit: empty C');
    return reasons;
  }

  // Extract subject tokens from id (icon-user → user, chart-up → chart)
  const stem = id
    .replace(/^(sprite|fancy|fancy-nav|nav|achievement|avatar|metric|emblem-badge|emblem-tier|fa):/i, '')
    .replace(/:(mint|red-black|mono|rainbow)$/i, '')
    .replace(/[_-]+/g, ' ');
  const tokens = [...new Set(
    `${stem} ${ctx}`
      .split(/[^a-z0-9]+/i)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 4 && !['icon', 'fancy', 'sprite', 'rianell', 'theme', 'polish', 'with', 'from', 'that', 'this', 'keep', 'must'].includes(t)),
  )].slice(0, 12);

  // Soft signal: class names / comments / path presence — not every token must appear
  const hit = tokens.filter((tok) => svg.includes(tok) || id.toLowerCase().includes(tok));
  // Subject-specific shape expectations
  const expectations = [
    { re: /\b(close|xmark|dismiss)\b/i, need: /path|line|polyline/i, label: 'close/X should be stroke paths not only circles' },
    { re: /\b(user|person|profile)\b/i, need: /circle|ellipse|path/i, label: 'user/person needs head/body shapes' },
    { re: /\b(chart|graph|trend)\b/i, need: /path|polyline|line|rect/i, label: 'chart needs axis/series geometry' },
    { re: /\btarget\b/i, need: /circle/i, label: 'target needs concentric circles' },
    { re: /\b(cloud)\b/i, need: /path|ellipse|circle/i, label: 'cloud needs blob/path geometry' },
    { re: /\b(brain)\b/i, need: /path|ellipse/i, label: 'brain needs organic path geometry' },
    { re: /\bstethoscope\b/i, need: /path/i, label: 'stethoscope needs headset+tube path geometry' },
    { re: /\bqr\b/i, need: /rect/i, label: 'QR needs finder-eye rect geometry' },
    { re: /\bpizza/i, need: /path|polygon|circle/i, label: 'pizza slice needs wedge + topping geometry' },
    { re: /\bcycle_tracker|menstrual|follicular|luteal|ovulation/i, need: /circle|ellipse|path/i, label: 'cycle tracker needs circular/phase/droplet geometry' },
    { re: /\b(lightbulb|moon|mug|plane|potato|utensils|plate.?wheat)/i, need: /path|circle|ellipse|rect/i, label: 'object icon needs readable silhouette paths' },
  ];
  for (const exp of expectations) {
    if (exp.re.test(ctx) || exp.re.test(id)) {
      if (!exp.need.test(svg)) reasons.push(`description mismatch: ${exp.label}`);
    }
  }

  // If we have several distinctive tokens and none appear in SVG classes/markup, soft-fail
  if (tokens.length >= 3 && hit.length === 0 && !/rianell-|icon-fill|theme-fx/i.test(svg)) {
    reasons.push(`description fit weak: no subject tokens [${tokens.slice(0, 5).join(', ')}] in C`);
  }
  return reasons;
}

/**
 * Load live-review primary focus list (appendable while user still reviews).
 * @param {string} [filePath]
 */
export function loadUserFocusList(filePath = userFocusPath) {
  const raw = loadJson(filePath, { items: [] });
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    updatedAt: raw.updatedAt || null,
    note: raw.note || '',
    items: items.filter((it) => it && (it.id || it.idPrefix)),
  };
}

/**
 * Match an icon id against user-focus exact id or idPrefix rules.
 * @returns {{ matched: boolean, reasons: string[], tags: string[] }}
 */
export function matchUserFocus(id, focusList = null) {
  const list = focusList || loadUserFocusList();
  const reasons = [];
  const tags = [];
  const sid = String(id || '');
  for (const it of list.items || []) {
    const hit = it.id
      ? sid === it.id
      : (it.idPrefix && sid.startsWith(String(it.idPrefix)));
    if (!hit) continue;
    const why = String(it.reason || 'user QA focus').trim();
    reasons.push(`user-qa-focus: ${why}`);
    for (const t of (it.severity || [])) tags.push(String(t));
  }
  return { matched: reasons.length > 0, reasons: [...new Set(reasons)], tags: [...new Set(tags)] };
}

/**
 * Subject-specific readability for pizza / menstrual cycle / ashspiral companions.
 * User-flagged as unrecognizable or wrong metaphor — force FAIL until geometry reads.
 */
export function analyzeFlaggedSubjectIntegrity(entry, cSvg) {
  const reasons = [];
  const id = String(entry?.id || '');
  const t = String(cSvg || '');
  if (!t.trim()) return reasons;

  const shapeCount = (t.match(/<(?:path|circle|ellipse|rect|polygon|polyline|line)\b/gi) || []).length;
  const circleCount = (t.match(/<circle\b/gi) || []).length;
  const pathD = [...t.matchAll(/\bd="([^"]*)"/gi)].map((m) => m[1] || '').join(' ');
  const curveOps = (pathD.match(/[CcSsQqTtAa]/g) || []).length;

  // Pizza: wedge + toppings (not a shark-fin blob)
  if (/pizza/i.test(id)) {
    if (shapeCount < 2) {
      reasons.push('pizza-weak: need wedge + crust/toppings (≥2 shapes) — not a single fin blob');
    }
    if (circleCount < 2 && curveOps < 2) {
      reasons.push('pizza-weak: missing topping dots / crust arc — must read as pizza slice');
    }
  }

  // Cycle tracker achievement: menstrual/cycle symbolism, not a T-junction point-on-line
  if (/cycle_tracker/i.test(id) || (/achievement:cycle/i.test(id) && /cycle/i.test(entry?.context || ''))) {
    const hasRing = /<circle\b/i.test(t) || /<ellipse\b/i.test(t)
      || /A\s*[\d.-]+\s*[\d.-]+\s*[\d.-]+\s*[\d.-]+\s*[\d.-]+\s*[\d.-]+\s*[\d.-]+/i.test(pathD);
    const looksLikeTee = shapeCount <= 3 && /<line\b/i.test(t) && circleCount <= 1 && curveOps < 2;
    if (!hasRing || looksLikeTee) {
      reasons.push('cycle-tracker-mismatch: must read as menstrual/cycle tracking (ring/phases/droplet/calendar) — not a point-on-line');
    }
  }

  // Ashspiral avatar: readable spiral companion silhouette (not a comma blob)
  if (/ashspiral/i.test(id)) {
    if (curveOps < 3 && shapeCount < 2) {
      reasons.push('ashspiral-unreadable: spiral companion needs multi-turn curve / clear silhouette — not an abstract comma');
    }
  }

  // Common FA replace objects user flagged as broken vectors
  if (/fa-solid_fa-(lightbulb|moon|mug-hot|mug-saucer|person-swimming|person-walking|plane|plate-wheat|potato|utensils)/i.test(id)) {
    if (!hasUsableSvg(t)) {
      reasons.push('broken-vector: polished file is not usable SVG — redo design/composition');
    } else if (shapeCount < 2 && pathD.length < 40) {
      reasons.push('broken-vector: silhouette too sparse / fragmented — redo composition of elements');
    }
  }

  return reasons;
}

/**
 * Stethoscope (and similar stroke-line medical icons): open arcs must stay stroked.
 * Fill + stroke=none turns headset/tube into disconnected blobs — user-flagged broken.
 */
export function analyzeStethoscopeIntegrity(entry, cSvg) {
  const reasons = [];
  const id = String(entry?.id || '');
  const ctx = String(entry?.context || '');
  if (!/stethoscope/i.test(id) && !/stethoscope/i.test(ctx)) return reasons;
  const t = String(cSvg || '');
  if (!t.trim()) {
    reasons.push('stethoscope: empty C');
    return reasons;
  }
  // Product CSS strokes these paths; polish must not force fill-only
  const stripsStroke = /stroke\s*=\s*["']none["']/i.test(t)
    && /icon-fill|data-polish="wrap"/i.test(t)
    && !/data-polish="wrap-stroke"|data-polish="additive-stroke"/i.test(t);
  if (stripsStroke) {
    reasons.push('stethoscope-broken: stroke stripped (open arcs render as disconnected fill blobs)');
  }
  if (/icon-fill/i.test(t) && /stroke\s*=\s*["']none["']/i.test(t) && !/fill\s*=\s*["']none["']/i.test(t)) {
    reasons.push('stethoscope-broken: icon-fill + stroke=none — headset/tube not connected as stroke line-art');
  }
  if (!/<circle\b/i.test(t)) {
    reasons.push('stethoscope: missing chest-piece circle');
  }
  const pathCount = (t.match(/<path\b/gi) || []).length;
  if (pathCount < 2) {
    reasons.push('stethoscope: need ≥2 paths (headset arc + tubing)');
  }
  return reasons;
}

/**
 * QR code icons must read as QR at a glance: 3 corner finder eyes + data modules.
 * Abstract 1-eye / bar fragments FAIL (user note: "look more like QR").
 */
export function analyzeQrIntegrity(entry, cSvg) {
  const reasons = [];
  const blob = `${entry?.id || ''} ${entry?.context || ''}`;
  if (!/\bqr\b|icon-qr/i.test(blob)) return reasons;
  const t = String(cSvg || '');
  if (!t.trim()) {
    reasons.push('qr: empty C');
    return reasons;
  }

  const rects = [...t.matchAll(/<rect\b[^>]*>/gi)].map((m) => {
    const tag = m[0];
    const num = (re) => {
      const hit = tag.match(re);
      return hit ? Number(hit[1]) : NaN;
    };
    return {
      x: num(/\bx="([\d.-]+)"/i),
      y: num(/\by="([\d.-]+)"/i),
      w: num(/\bwidth="([\d.-]+)"/i),
      h: num(/\bheight="([\d.-]+)"/i),
    };
  }).filter((r) => Number.isFinite(r.x) && Number.isFinite(r.y));

  if (rects.length < 3) {
    reasons.push('qr-weak: need ≥3 finder rects (classic QR corner eyes)');
  }

  const finders = rects.filter((r) => (r.w || 0) >= 4 && (r.h || 0) >= 4);
  const hasTL = finders.some((r) => r.x <= 8 && r.y <= 8);
  const hasTR = finders.some((r) => r.x >= 12 && r.y <= 8);
  const hasBL = finders.some((r) => r.x <= 8 && r.y >= 12);
  if (!(hasTL && hasTR && hasBL)) {
    reasons.push('qr-weak: missing classic finder eyes at top-left, top-right, and bottom-left');
  }

  // Bottom-right data modules (path squares or extra small rects)
  const hasModules = /<path\b/i.test(t)
    || rects.some((r) => r.x >= 12 && r.y >= 12 && (r.w || 0) <= 4);
  if (!hasModules) {
    reasons.push('qr-weak: missing bottom-right data-module pattern');
  }

  // Drift into a single blob / one big square
  if (finders.length === 1 && !hasModules) {
    reasons.push('qr-broken: reads as a single square, not a QR code');
  }

  return reasons;
}

/** True when id/context implies a human / body figure (not abstract creature avatars). */
export function looksLikeHumanFigure(entry) {
  const blob = `${entry?.id || ''} ${entry?.context || ''} ${entry?.kind || ''}`.toLowerCase();
  if (/\b(creature|monster|bot|robot|pet|critter|sprout|plant|leaf)\b/.test(blob)) return false;
  return /\b(user|person|people|human|body|torso|figure|swimmer|drown|swim|silhouette|man|woman|child|face|avatar-part:body|icon-user|profile)\b/.test(blob)
    || /\b(arm|hand|leg|limb|head)\b/.test(blob);
}

/**
 * Heuristic anatomy gate for human figures.
 * FAIL examples: four stick-arms under a head (no bilateral 2-arm structure),
 * head with only limb strokes and no torso mass.
 */
export function analyzeHumanAnatomy(entry, cSvg) {
  const reasons = [];
  if (!looksLikeHumanFigure(entry)) return reasons;
  const t = String(cSvg || '');
  if (!t.trim()) {
    reasons.push('anatomy: empty C for human-figure subject');
    return reasons;
  }

  const circles = [...t.matchAll(/<circle\b[^>]*>/gi)];
  const lines = (t.match(/<line\b/gi) || []).length;
  const polylines = (t.match(/<polyline\b/gi) || []).length;
  // Paths that are mostly open strokes (likely limbs) — count path tags with fill="none"
  const strokePaths = (t.match(/<path\b[^>]*fill=["']none["'][^>]*>/gi) || []).length
    + (t.match(/<path\b[^>]*stroke=["'](?!none)[^"']+["'][^>]*>/gi) || []).length;
  const limbish = lines + polylines + Math.min(strokePaths, 8);

  // Extra limbs: classic bad polish = head + 3–4 radiating stick arms
  if (circles.length >= 1 && limbish >= 4) {
    reasons.push('anatomy: extra limbs / over-armed stick figure (need bilateral ≤2 arms + readable torso)');
  }

  // Head present but no torso-ish path/ellipse/rect below — floating head + arms only
  const hasTorsoHint = /torso|body|trunk/i.test(t)
    || /<ellipse\b/i.test(t)
    || /<rect\b/i.test(t)
    || (t.match(/<path\b/gi) || []).length >= 2;
  if (circles.length >= 1 && limbish >= 2 && !hasTorsoHint && !/<path\b[^>]*d=["'][^"']{40,}/i.test(t)) {
    reasons.push('anatomy: missing torso mass between head and limbs');
  }

  return reasons;
}

/**
 * Static CSS signals for animation cohesion / clip risk (complements seamless-loop + DOM sampling).
 */
export function analyzeAnimationCohesion(cssText, entry = {}) {
  const reasons = [];
  const css = String(cssText || '');
  if (!css.trim() && !(entry?.kind === 'animation' || entry?.promptMode === 'single-anim')) {
    return reasons;
  }
  reasons.push(...analyzeSeamlessLoop(css, entry));

  // Competing rotate metaphors in one block
  const rotateCount = (css.match(/rotate\s*\(/gi) || []).length;
  if (rotateCount >= 3 && /spin|pill|loader|orbit/i.test(`${entry?.id || ''} ${css}`)) {
    reasons.push('animation cohesion: multiple rotate() in one keyframe set (double-spin risk)');
  }

  // Large translate that commonly clips 24/64 boxes when not clipped intentionally
  for (const m of css.matchAll(/translate(?:X|Y|3d)?\(\s*([-.\d]+)(px|%)?/gi)) {
    const n = Math.abs(Number(m[1]));
    const unit = (m[2] || 'px').toLowerCase();
    if (unit === 'px' && n > 48) {
      reasons.push(`animation clip risk: large translate ${m[0]} may push ink outside viewBox`);
      break;
    }
    if (unit === '%' && n > 120) {
      reasons.push(`animation clip risk: translate ${m[0]} exceeds tile period / may hard-clip`);
      break;
    }
  }

  // scale blow-up
  for (const m of css.matchAll(/scale\(\s*([-.\d]+)/gi)) {
    if (Math.abs(Number(m[1])) > 1.85) {
      reasons.push('animation clip risk: scale>1.85 likely clips edges mid-loop');
      break;
    }
  }
  return reasons;
}

/** Location / surrounding fitment from register metadata. */
export function analyzeLocationFit(entry, cSvg) {
  const reasons = [];
  const kind = String(entry?.kind || '');
  const svg = String(cSvg || '');
  const vb = String(entry?.viewBox || '0 0 24 24');
  const [, , vw] = vb.split(/[\s,]+/).map(Number);

  // Nav / chrome icons should stay compact stroke-friendly
  if (/nav|sprite/i.test(kind) || /nav|header|tab|toolbar/i.test(String(entry?.sourcePath || ''))) {
    if (/filter="url\(#.*blur/i.test(svg) && /opacity="0\.[89]/i.test(svg)) {
      reasons.push('location fit: heavy blur may muddy small nav/chrome placement');
    }
  }
  // Achievements / emblems are 64×64 scenes — tiny 24-style strokes alone are ok but empty scenes aren't
  if (/achievement|emblem|avatar/i.test(kind)) {
    if ((vw || 64) >= 48 && svg.length < 80) {
      reasons.push('location fit: rich surface kind but C markup is too sparse');
    }
  }
  // Surrounding themes listed — fancy team should match
  if (entry?.team && Array.isArray(entry.themes) && entry.themes.length && !entry.themes.includes(entry.team) && entry.themes[0] !== 'plain') {
    // soft — don't fail hard
  }
  // Usage sites exist but C drifted to loader-like rings for non-loader ids
  if (!/load|spinner|orbit/i.test(entry?.id || '') && /loader|spinner/i.test(svg) && !/load|spinner/i.test(entry?.context || '')) {
    reasons.push('location/function fit: loader/spinner geometry on non-loading control');
  }
  return reasons;
}

/** Per-item checks combining all review dimensions. */
export function heuristicBroken(item, entry, stemInfo = null) {
  const reasons = [];
  if (item.aMissing) reasons.push('A missing / non-SVG');
  if (item.cMissing) reasons.push('C missing / non-SVG');
  if (item.bMissing && !item.bChatty) reasons.push('B missing (not chatty fallback)');
  if (invisibleInk(item.a)) reasons.push('A invisible ink');
  if (invisibleInk(item.c)) reasons.push('C invisible ink');
  if (item.driftSuspectAfter) reasons.push('checkpoint driftSuspectAfter');

  const resolved = resolveRegisterPayload(entry || {});
  const aRaw = (resolved.kind === 'svg' || resolved.kind === 'svg-resolved')
    ? resolved.text
    : (stemInfo?.canonicalGlyph || entry?.currentPayload || '');
  const cRaw = item._cRaw || '';

  if (aRaw && cRaw && missingOriginalGlyph(aRaw, cRaw)) reasons.push('C missing original/stem glyph');
  if (aRaw && cRaw && driftSuspect(aRaw, cRaw, item.id)) reasons.push('C driftSuspect vs A/stem');
  const aUnit = extractSvgUnit(aRaw) || aRaw;
  const cUnit = extractSvgUnit(cRaw) || cRaw;
  if (aUnit && cUnit && aUnit.trim() === cUnit.trim() && !/rianell-|theme-fx|icon-fill|data-polish/i.test(cUnit)) {
    reasons.push('C is bare A clone (no polish classes)');
  }
  if (entry?.team && /\b(?:fill|stroke)="currentColor"/i.test(cRaw)) {
    reasons.push(`C still currentColor under TEAM=${entry.team} (mint chrome risk)`);
  }
  if (aRaw && cRaw && polishedEqualsOriginal(aRaw, cRaw)) {
    reasons.push('C identical to original A (polish must differ)');
  }

  // Theme paint presence for fancy
  if (entry?.team) {
    const paint = themePaintForTeam(entry.team);
    const hasTeamHex = paint.fill && cRaw.toLowerCase().includes(String(paint.fill).toLowerCase())
      || (paint.glow && cRaw.toLowerCase().includes(String(paint.glow).toLowerCase()))
      || (paint.stroke && cRaw.toLowerCase().includes(String(paint.stroke).toLowerCase()));
    if (!hasTeamHex && !/url\(#|gradient|prism/i.test(cRaw)) {
      reasons.push(`theme cohesion: TEAM=${entry.team} colors not found in C`);
    }
  }

  reasons.push(...analyzeBrokenGraphics(cRaw, entry?.viewBox));
  reasons.push(...analyzeOffsetShift(aRaw, cRaw, entry?.viewBox));
  reasons.push(...analyzeDescriptionFit(entry, cRaw));
  reasons.push(...analyzeLocationFit(entry, cRaw));
  reasons.push(...analyzeStethoscopeIntegrity(entry, cRaw));
  reasons.push(...analyzeQrIntegrity(entry, cRaw));
  reasons.push(...analyzeFlaggedSubjectIntegrity(entry, cRaw));

  // Live-review primary focus list (appendable; forces FAIL until removed)
  const focusHit = matchUserFocus(item?.id || entry?.id);
  if (focusHit.matched) reasons.push(...focusHit.reasons);

  // Human figure anatomy (static SVG subjects)
  reasons.push(...analyzeHumanAnatomy(entry, cRaw));

  // Animation seamless-loop + cohesion / clip-risk heuristics
  if (entry?.kind === 'animation' || entry?.promptMode === 'single-anim' || /@keyframes\s+/i.test(cRaw)) {
    const animSrc = extractCssKeyframes(cRaw)?.css
      || extractCssKeyframes(entry?.currentPayload)?.css
      || cRaw;
    reasons.push(...analyzeAnimationCohesion(animSrc, entry));
  }

  return [...new Set(reasons)];
}

/**
 * Theme-pack + stem cohesion: all siblings share glyph; teams differ by color only.
 */
export function analyzeStemPackCohesion(stem, siblings, polishedById) {
  const findings = [];
  if (siblings.length < 2) return findings;
  const plain = siblings.find((e) => /^(sprite|nav):/.test(e.id) && !e.team) || siblings.find((e) => !e.team);
  const plainSvg = plain ? (polishedById.get(plain.id) || '') : '';
  const canon = resolveRegisterPayload(plain || siblings[0]).text
    || plain?.currentPayload
    || '';

  for (const e of siblings) {
    const c = polishedById.get(e.id) || '';
    if (!c) {
      findings.push({ id: e.id, reasons: [`stem pack ${stem}: missing polished C`] });
      continue;
    }
    if (canon && missingOriginalGlyph(canon, c)) {
      findings.push({ id: e.id, reasons: [`stem pack ${stem}: glyph diverges from canonical plain`] });
    }
    if (plainSvg && e.team && missingOriginalGlyph(extractSvgUnit(plainSvg) || plainSvg, c)
      && missingOriginalGlyph(canon, c)) {
      findings.push({ id: e.id, reasons: [`stem pack ${stem}: fancy diverges from polished plain sprite`] });
    }
  }

  // Fancy teams should not all share the exact same hex (collapsed theme)
  const fancy = siblings.filter((e) => e.team);
  if (fancy.length >= 2) {
    const hexSets = fancy.map((e) => {
      const c = polishedById.get(e.id) || '';
      return new Set([...(c.match(/#[0-9a-fA-F]{3,8}/g) || [])].map((h) => h.toLowerCase()));
    });
    let identical = true;
    for (let i = 1; i < hexSets.length; i += 1) {
      if (hexSets[i].size !== hexSets[0].size) { identical = false; break; }
      for (const h of hexSets[0]) if (!hexSets[i].has(h)) { identical = false; break; }
      if (!identical) break;
    }
    if (identical && hexSets[0].size > 0) {
      for (const e of fancy) {
        findings.push({ id: e.id, reasons: [`stem pack ${stem}: all fancy teams share identical palette (no theme differentiation)`] });
      }
    }
  }
  return findings;
}

async function fetchGallery(limit, offset) {
  const url = `${BASE}/api/gallery?limit=${limit}&offset=${offset}&ts=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`gallery HTTP ${res.status}`);
  return res.json();
}

async function waitForPreviewReady() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const data = await fetchGallery(1, 0);
      if (data?.counts) return data;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Live preview not reachable at ${BASE}`);
}

/**
 * Vision QA: send the A/B/C card screenshot (+ optional C crop) so Gemma
 * actually reviews pixels, not only SVG source.
 */
async function runGemmaScreenshotReview(item) {
  const shotAbs = item.screenshotAbs;
  if (!shotAbs || !fs.existsSync(shotAbs)) {
    return { id: item.id, verdict: 'FAIL', reasons: ['missing screenshot for gemma review'] };
  }
  const images = [fs.readFileSync(shotAbs).toString('base64')];
  const cCrop = item.cScreenshotAbs;
  if (cCrop && fs.existsSync(cCrop)) {
    images.push(fs.readFileSync(cCrop).toString('base64'));
  }

  const prompt = [
    'You are Brand Guardian visual QA for Rianell icons and CSS animations.',
    'Image 1 = A/B/C preview card (Original / Gen / Polished). Image 2 (if present) = polished C crop only.',
    'PASS only if ALL are true:',
    '1) Polished C matches the described subject / item name (looks like what it claims).',
    '2) No broken lines, missing strokes, clipped/cut-off paths, or garbage geometry.',
    '3) No obvious offset/shift vs Original A (same center weight in the 24 box).',
    '4) Fits the UI location and surrounding use (nav/control/loader/avatar/etc).',
    '5) Theme-pack cohesion: if TEAM is set, colors match that team; glyph still matches plain sibling.',
    '6) If this is a CSS animation preview: the motion must loop SEAMLESSLY / fluidly — no visible hard restart, jump, or pop at the loop seam. Motion must feel COHESIVE (one clear intent, no competing metaphors).',
    '7) No DOUBLE SPIN: if keyframes rotate a subject (e.g. achPillSpin), only ONE rotation — do not also spin a spinner-ring metaphor. FAIL nested/competing rotates.',
    '8) Wave/droplet: if motion is a hard sliding tile translate (not natural fluid/slosh), note reason wave-is-hard-translate — FAIL when it looks like a stamp sliding with a seam rather than water.',
    '9) HUMAN FIGURE ANATOMY (when subject is a person/body/swimmer/user/figure): must be anatomically plausible — one head, one torso, exactly TWO arms (bilateral), legs only if depicted; FAIL extra limbs (e.g. four stick-arms under a head), missing torso, or scrambled proportions.',
    '10) FRAME CLIPPING: FAIL if strokes/fills are cut off by the viewBox/card edge during any animation frame (mid-loop), or static C ink is hard-clipped unintentionally. Intentional waterline masks OK only if the figure still reads clearly.',
    '11) STETHOSCOPE: must read as ONE connected medical instrument (headset arc ↔ tubing ↔ chest piece). FAIL disconnected floating arcs/blobs, stroke stripped to fill-only, or fragments that no longer look like a stethoscope (reason: stethoscope-broken).',
    '12) QR CODE: must instantly read as a QR — three corner finder eyes (top-left, top-right, bottom-left) plus bottom-right data modules. FAIL abstract 1-eye blocks, thin bar fragments, or glyphs that look like a window/grid instead of a QR (reason: qr-weak / qr-broken). Keep stem siblings the same silhouette.',
    '13) USER QA FOCUS: pizza-slice must look like pizza (wedge+toppings); cycle_tracker must read as menstrual/cycle tracking (not a point-on-line); ashspiral must be a readable spiral companion; FA replaces (lightbulb/moon/mug/person/plane/potato/utensils) must be valid SVG with clear composition — FAIL unrecognizable blobs (reasons: pizza-weak, cycle-tracker-mismatch, ashspiral-unreadable, broken-vector).',
    'FAIL with short reasons otherwise (prefer reason codes: anatomy-extra-limbs, anatomy-missing-torso, anim-frame-clip, wave-is-hard-translate, double-spin, non-seamless-loop, stethoscope-broken, qr-weak, qr-broken, pizza-weak, cycle-tracker-mismatch, ashspiral-unreadable, broken-vector, user-qa-focus).',
    'Reply ONLY JSON: { "id": "...", "verdict": "PASS"|"FAIL", "reasons": ["..."] }',
    JSON.stringify({
      id: item.id,
      team: item.team || null,
      kind: item.kind || null,
      context: item.context || null,
      userQaFocus: matchUserFocus(item.id).matched || undefined,
      sourcePath: item.sourcePath || null,
      usageSites: item.usageSites || null,
      themes: item.themes || null,
      states: item.states || null,
      description: item.description || item.context || item.id,
      seamlessLoopRequired: item.kind === 'animation' || /animation:/.test(item.id || ''),
      humanFigureLikely: looksLikeHumanFigure(item),
      stethoscopeSubject: /stethoscope/i.test(String(item.id || item.context || '')),
      qrSubject: /\bqr\b|icon-qr/i.test(String(item.id || item.context || '')),
      userQaNotes: {
        achPillSpin: 'FAIL double-spin (spinner+rotate)',
        dropletWave: 'flag/fail hard translate tile vs natural wave',
        humanAnatomy: 'FAIL extra limbs / non-anatomical human figures',
        animFrameClip: 'FAIL elements clipped mid-animation frames',
        stethoscope: 'FAIL disconnected headset/tube/chest — keep stroke line-art connected',
        qr: 'FAIL if not clearly a QR — need 3 finder eyes + modules',
        evidenceVideo: 'Desktop Recording 2026-07-22 163349.mp4',
      },
    }),
  ].join('\n');

  try {
    const res = await fetch(`${HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        images,
        stream: false,
        think: false,
        options: { num_predict: 400, temperature: 0.1 },
      }),
    });
    if (!res.ok) {
      return { id: item.id, verdict: 'FAIL', reasons: [`gemma HTTP ${res.status}`] };
    }
    const data = await res.json();
    const text = String(data.response || '');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return { id: item.id, verdict: 'FAIL', reasons: ['gemma non-JSON response'] };
    }
    const obj = JSON.parse(m[0]);
    return {
      id: obj.id || item.id,
      verdict: String(obj.verdict || 'FAIL').toUpperCase() === 'PASS' ? 'PASS' : 'FAIL',
      reasons: Array.isArray(obj.reasons) ? obj.reasons : [],
    };
  } catch (err) {
    return { id: item.id, verdict: 'FAIL', reasons: [`gemma review error: ${err?.message || err}`] };
  }
}

/** Stem contact-sheet vision check (theme pack cohesion across teams). */
async function runGemmaStemSheetReview(stem, sheetAbs, siblingIds) {
  if (!sheetAbs || !fs.existsSync(sheetAbs)) {
    return { stem, verdict: 'FAIL', reasons: ['missing stem contact sheet'] };
  }
  const prompt = [
    'You are Brand Guardian QA reviewing a Rianell icon theme pack contact sheet.',
    'PASS only if: all variants share the same glyph/shape; fancy teams differ by color only;',
    'no broken graphics; each tile still reads as the same subject; no offset/layout collapse.',
    'Reply ONLY JSON: { "stem": "...", "verdict": "PASS"|"FAIL", "reasons": ["..."], "failIds": ["optional sibling ids"] }',
    JSON.stringify({ stem, siblings: siblingIds }),
  ].join('\n');
  try {
    const res = await fetch(`${HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        images: [fs.readFileSync(sheetAbs).toString('base64')],
        stream: false,
        think: false,
        options: { num_predict: 400, temperature: 0.1 },
      }),
    });
    if (!res.ok) return { stem, verdict: 'FAIL', reasons: [`gemma HTTP ${res.status}`] };
    const data = await res.json();
    const text = String(data.response || '');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { stem, verdict: 'FAIL', reasons: ['gemma non-JSON response'] };
    const obj = JSON.parse(m[0]);
    return {
      stem: obj.stem || stem,
      verdict: String(obj.verdict || 'FAIL').toUpperCase() === 'PASS' ? 'PASS' : 'FAIL',
      reasons: Array.isArray(obj.reasons) ? obj.reasons : [],
      failIds: Array.isArray(obj.failIds) ? obj.failIds : siblingIds,
    };
  } catch (err) {
    return { stem, verdict: 'FAIL', reasons: [`gemma stem review error: ${err?.message || err}`] };
  }
}

async function main() {
  fs.mkdirSync(shotRoot, { recursive: true });
  fs.mkdirSync(stemSheetRoot, { recursive: true });
  writeQaProgress({
    active: true,
    stage: 'waiting-polish',
    phase: 'screenshot-qa',
    current: 0,
    total: 0,
    unit: '',
    detail: 'Waiting for live preview…',
  });
  const status = await waitForPreviewReady();
  const pending = Number(status.counts?.pending || 0);
  const polished = Number(status.counts?.polished || 0);

  if (!now && pending > 0) {
    writeQaProgress({
      active: false,
      stage: 'waiting-polish',
      phase: 'polish',
      current: polished,
      total: polished + pending,
      unit: 'polished',
      detail: `${pending} still pending — QA deferred`,
      exitCode: 2,
    });
    console.log(JSON.stringify({
      ok: false,
      reason: 'polish still running',
      pending,
      polished,
      hint: 'Re-run with --now for interim QA, or wait until pending=0',
    }, null, 2));
    process.exit(2);
  }

  const all = await fetchGallery(0, 0);
  const items = all.items || [];
  const polishCp = loadJson(polishCpPath, { completed: {} });
  const reg = loadJson(registerPath, { entries: [] });
  const byId = new Map((reg.entries || []).map((e) => [e.id, e]));
  const stemIndex = buildStemIndex(reg.entries || []);
  const polishedById = new Map();

  // Persist / refresh queue-fail investigation for Q&A (HUD FAILED count)
  const queueFailed = Object.entries(polishCp.failed || {}).map(([id, meta]) => {
    const reason = String(meta?.reason || 'unknown');
    const kind = /allocate memory|resource limitations|model runner has unexpectedly stopped|http 500/i.test(reason)
      ? 'ollama-oom'
      : 'unknown';
    return {
      id,
      at: meta?.at || null,
      kind,
      reason,
      remediation: kind === 'ollama-oom'
        ? 'Free VRAM then: node scripts/dev/visual-polish-queue.mjs --force-failed'
        : 'Inspect reason; then --force-failed',
    };
  });
  fs.mkdirSync(qaRoot, { recursive: true });
  fs.writeFileSync(
    path.join(qaRoot, 'failed-investigation.json'),
    `${JSON.stringify({
      updatedAt: new Date().toISOString(),
      note: 'Polish-queue FAILED entries (HUD). Usually Ollama OOM — not design QA.',
      count: queueFailed.length,
      items: queueFailed,
    }, null, 2)}\n`,
  );

  for (const it of items) {
    const meta = polishCp.completed?.[it.id];
    if (meta?.outputPath) {
      const abs = path.isAbsolute(meta.outputPath) ? meta.outputPath : path.join(root, meta.outputPath);
      it._cRaw = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    } else {
      it._cRaw = '';
    }
    polishedById.set(it.id, it._cRaw);
  }

  console.log(`[screenshot-qa] base=${BASE} items=${items.length} pageSize=${PAGE_SIZE} pending=${pending} checks=screenshot+cohesion+location+description+offset`);

  writeQaProgress({
    active: true,
    stage: 'screenshot-cards',
    phase: 'screenshot-qa',
    current: 0,
    total: items.length,
    unit: 'icons',
    detail: `page size ${PAGE_SIZE}`,
    passedSoFar: 0,
    brokenSoFar: 0,
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const brokenMap = new Map(); // id -> { reasons, screenshot, ... }
  const passed = [];
  const shotMetaById = new Map(); // id -> { screenshotAbs, cScreenshotAbs, ... }
  const stemSheetMeta = []; // { stem, sheetAbs, siblingIds }
  const pages = Math.ceil(items.length / PAGE_SIZE) || 1;
  let cardsDone = 0;

  const addBroken = (id, extra) => {
    const prev = brokenMap.get(id) || {
      id,
      team: null,
      kind: null,
      reasons: [],
      screenshot: null,
      pageScreenshot: null,
      paint: null,
    };
    brokenMap.set(id, {
      ...prev,
      ...extra,
      reasons: [...new Set([...(prev.reasons || []), ...(extra.reasons || [])])],
    });
  };

  // --- Per-card screenshots + heuristics ---
  for (let p = 0; p < pages; p += 1) {
    const offset = p * PAGE_SIZE;
    const url = `${BASE}/?qa=1&limit=${PAGE_SIZE}&offset=${offset}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForFunction(
      () => document.body.dataset.qaReady === '1' || document.querySelectorAll('[data-qa-card]').length > 0,
      null,
      { timeout: 30_000 },
    ).catch(() => {});
    await page.waitForTimeout(350);

    const pageShot = path.join(shotRoot, `page-${String(p).padStart(4, '0')}.png`);
    await page.screenshot({ path: pageShot, fullPage: true });

    const cards = page.locator('[data-qa-card]');
    const n = await cards.count();
    for (let i = 0; i < n; i += 1) {
      const card = cards.nth(i);
      const id = await card.getAttribute('data-id');
      const item = items.find((x) => x.id === id) || items[offset + i];
      if (!item) continue;

      const shotName = `${String(offset + i).padStart(4, '0')}__${safeFile(item.id)}.png`;
      const shotPath = path.join(shotRoot, shotName);
      await card.screenshot({ path: shotPath });

      // Dedicated C-column crop when present
      const cCropPath = path.join(shotRoot, `${String(offset + i).padStart(4, '0')}__${safeFile(item.id)}__C.png`);
      const cCol = card.locator('.col-c');
      let cShotOk = false;
      if (await cCol.count()) {
        cShotOk = await cCol.screenshot({ path: cCropPath }).then(() => true).catch(() => false);
      }
      shotMetaById.set(item.id, {
        screenshotAbs: shotPath,
        cScreenshotAbs: cShotOk ? cCropPath : null,
        pageScreenshot: path.relative(root, pageShot).replace(/\\/g, '/'),
      });

      const paint = await card.evaluate((el) => {
        const cols = {};
        for (const col of ['col-a', 'col-b', 'col-c']) {
          const node = el.querySelector(`.${col}`);
          const empty = !!node?.querySelector('[data-stage-empty]');
          const svgs = [...(node?.querySelectorAll('svg') || [])];
          let ink = 0;
          let geom = 0;
          let bbox = null;
          for (const svg of svgs) {
            geom += svg.querySelectorAll('path,circle,ellipse,rect,line,polyline,polygon').length;
            try {
              const bb = svg.getBBox();
              const area = (bb.width || 0) * (bb.height || 0);
              if (area >= ink) {
                ink = area;
                bbox = { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
              }
            } catch {
              /* ignore */
            }
          }
          const inkScore = ink >= 1 ? ink : (geom > 0 ? geom * 10 : 0);
          cols[col] = { empty, svgCount: svgs.length, geom, ink: inkScore, bbox };
        }
        return cols;
      });

      const entry = byId.get(item.id) || {};
      const stemInfo = resolveStemCanonical(entry, stemIndex);
      const reasons = heuristicBroken(item, entry, stemInfo);
      if (paint['col-a']?.empty || paint['col-a']?.ink < 1) reasons.push('A DOM empty/zero-ink');
      if (paint['col-c']?.empty || paint['col-c']?.ink < 1) reasons.push('C DOM empty/zero-ink');
      if (paint['col-b']?.empty || paint['col-b']?.ink < 1) reasons.push('B DOM empty/zero-ink');

      // DOM offset: C bbox center far from A
      const ba = paint['col-a']?.bbox;
      const bc = paint['col-c']?.bbox;
      if (ba && bc && ba.w > 0 && bc.w > 0) {
        const acx = ba.x + ba.w / 2;
        const acy = ba.y + ba.h / 2;
        const ccx = bc.x + bc.w / 2;
        const ccy = bc.y + bc.h / 2;
        if (Math.hypot(acx - ccx, acy - ccy) > 18) {
          reasons.push('DOM offset shift: C bbox center diverges from A');
        }
      }

      // Sample animation frames on C — catch mid-loop clipping / cohesion pops
      const isAnim = entry?.kind === 'animation' || /animation:/.test(item.id || '') || /@keyframes/i.test(item._cRaw || '');
      if (isAnim) {
        const frameHits = await card.evaluate(async (el) => {
          const col = el.querySelector('.col-c') || el;
          const host = col.querySelector('.anim-demo, [data-anim-demo], svg')?.closest('.col-c') || col;
          const svg = host.querySelector('svg');
          if (!svg) return [];
          const rootRect = () => {
            const stage = host.querySelector('.stage, .preview, .tile') || host;
            return stage.getBoundingClientRect();
          };
          const anims = typeof svg.getAnimations === 'function'
            ? svg.getAnimations({ subtree: true })
            : [];
          const allAnims = anims.length
            ? anims
            : (typeof document.getAnimations === 'function'
              ? document.getAnimations().filter((a) => host.contains(a.effect?.target || null))
              : []);
          const hits = [];
          const fractions = [0, 0.25, 0.5, 0.75, 0.98];
          const pad = 3; // px tolerance outside stage
          for (const frac of fractions) {
            for (const a of allAnims) {
              try {
                const timing = a.effect?.getTiming?.() || {};
                let dur = timing.duration;
                if (dur === 'auto' || dur == null) dur = 1000;
                if (typeof dur === 'number' && dur > 0) {
                  a.currentTime = dur * frac;
                  a.pause?.();
                }
              } catch {
                /* ignore */
              }
            }
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            const stage = rootRect();
            const nodes = host.querySelectorAll('path,circle,ellipse,rect,line,polyline,polygon,g');
            let clipped = 0;
            for (const node of nodes) {
              let r;
              try { r = node.getBoundingClientRect(); } catch { continue; }
              if (!r.width && !r.height) continue;
              if (
                r.right < stage.left - pad
                || r.left > stage.right + pad
                || r.bottom < stage.top - pad
                || r.top > stage.bottom + pad
              ) {
                clipped += 1;
              } else if (
                r.left < stage.left - pad * 2
                || r.right > stage.right + pad * 2
                || r.top < stage.top - pad * 2
                || r.bottom > stage.bottom + pad * 2
              ) {
                clipped += 1;
              }
            }
            if (clipped >= 2) {
              hits.push(`anim-frame-clip at ${Math.round(frac * 100)}%: ${clipped} elements outside stage`);
            }
          }
          for (const a of allAnims) {
            try { a.play?.(); } catch { /* ignore */ }
          }
          return [...new Set(hits)];
        });
        reasons.push(...frameHits);
      }

      const uniq = [...new Set(reasons)];
      const relShot = path.relative(root, shotPath).replace(/\\/g, '/');
      if (uniq.length) {
        addBroken(item.id, {
          team: item.team,
          kind: item.kind,
          reasons: uniq,
          screenshot: relShot,
          pageScreenshot: path.relative(root, pageShot).replace(/\\/g, '/'),
          paint,
          stem: stemInfo.stem,
          context: entry.context || null,
          sourcePath: entry.sourcePath || null,
        });
        console.log(`[screenshot-qa] BROKEN ${item.id} — ${uniq.join('; ')}`);
      } else {
        passed.push({ id: item.id, screenshot: relShot, stem: stemInfo.stem });
      }
      cardsDone += 1;
      if (cardsDone === 1 || cardsDone % 5 === 0 || cardsDone === items.length) {
        writeQaProgress({
          active: true,
          stage: 'screenshot-cards',
          phase: 'screenshot-qa',
          current: cardsDone,
          total: items.length,
          unit: 'icons',
          detail: item.id,
          passedSoFar: passed.length,
          brokenSoFar: brokenMap.size,
        });
      }
    }
  }

  // --- Stem pack cohesion + contact sheets ---
  const stemsDone = new Set();
  const stemsToSheet = [];
  for (const it of items) {
    const entry = byId.get(it.id);
    if (!entry) continue;
    const stem = stemKey(entry);
    if (stemsDone.has(stem)) continue;
    stemsDone.add(stem);
    const siblings = (stemIndex.get(stem) || []).filter((e) => polishedById.has(e.id));
    if (siblings.length >= 2) stemsToSheet.push(stem);
  }
  stemsDone.clear();
  let stemIdx = 0;
  writeQaProgress({
    active: true,
    stage: 'stem-sheets',
    phase: 'screenshot-qa',
    current: 0,
    total: stemsToSheet.length || 1,
    unit: 'stems',
    detail: 'Theme pack cohesion + contact sheets',
    passedSoFar: passed.length,
    brokenSoFar: brokenMap.size,
  });
  for (const it of items) {
    const entry = byId.get(it.id);
    if (!entry) continue;
    const stem = stemKey(entry);
    if (stemsDone.has(stem)) continue;
    stemsDone.add(stem);
    const siblings = (stemIndex.get(stem) || []).filter((e) => polishedById.has(e.id));
    if (siblings.length < 2) continue;

    for (const finding of analyzeStemPackCohesion(stem, siblings, polishedById)) {
      addBroken(finding.id, {
        reasons: finding.reasons,
        team: byId.get(finding.id)?.team || null,
        kind: byId.get(finding.id)?.kind || null,
        stem,
      });
      console.log(`[screenshot-qa] STEM ${stem} BROKEN ${finding.id} — ${finding.reasons.join('; ')}`);
    }

    // Contact sheet: open each sibling id sequentially into one tall page via query? 
    // Use gallery filtered by rendering multiple ?id= isn't multi. Build a data-URL page.
    const sheetHtml = `<!DOCTYPE html><html><body style="margin:0;background:#0f1412;color:#e8f5ee;font-family:Segoe UI,sans-serif;padding:16px">
      <h2 style="margin:0 0 12px">STEM ${stem}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
      ${siblings.map((e) => {
        const raw = polishedById.get(e.id) || '';
        const inner = /<svg[\s>]/i.test(raw)
          ? raw
          : `<svg viewBox="${e.viewBox || '0 0 24 24'}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${raw}</svg>`;
        return `<div style="background:#1a2420;border-radius:12px;padding:10px;text-align:center">
          <div style="font-size:11px;margin-bottom:8px">${e.id}</div>
          <div style="width:96px;height:96px;margin:0 auto;color:${e.team === 'red-black' ? '#ff4d5a' : e.team === 'mono' ? '#d0d0d0' : e.team === 'rainbow' ? '#ff4fa0' : '#7bdf8c'}">${inner}</div>
        </div>`;
      }).join('')}
      </div></body></html>`;
    await page.setContent(sheetHtml, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const sheetPath = path.join(stemSheetRoot, `${safeFile(stem)}.png`);
    await page.screenshot({ path: sheetPath, fullPage: true });
    stemSheetMeta.push({
      stem,
      sheetAbs: sheetPath,
      siblingIds: siblings.map((e) => e.id),
    });
    stemIdx += 1;
    writeQaProgress({
      active: true,
      stage: 'stem-sheets',
      phase: 'screenshot-qa',
      current: stemIdx,
      total: Math.max(stemsToSheet.length, stemIdx),
      unit: 'stems',
      detail: stem,
      passedSoFar: passed.length,
      brokenSoFar: brokenMap.size,
    });
  }

  // Gemma vision review of EVERY icon screenshot + every stem contact sheet.
  if (gemmaReview) {
    console.log(`[screenshot-qa] Gemma vision review of ${items.length} icon screenshots + ${stemSheetMeta.length} stem sheets…`);
    writeQaProgress({
      active: true,
      stage: 'gemma-vision',
      phase: 'screenshot-qa',
      current: 0,
      total: items.length,
      unit: 'icons',
      detail: 'Vision review every A/B/C card',
      passedSoFar: passed.length,
      brokenSoFar: brokenMap.size,
    });
    let idx = 0;
    for (const it of items) {
      idx += 1;
      const e = byId.get(it.id) || {};
      const meta = shotMetaById.get(it.id) || {};
      const r = await runGemmaScreenshotReview({
        id: it.id,
        team: e.team,
        kind: e.kind,
        context: e.context,
        sourcePath: e.sourcePath,
        usageSites: e.usageSites,
        themes: e.themes,
        states: e.states,
        description: e.description || e.context || e.label || it.id,
        screenshotAbs: meta.screenshotAbs,
        cScreenshotAbs: meta.cScreenshotAbs,
      });
      if (r.verdict !== 'PASS') {
        addBroken(r.id, {
          reasons: [`gemma-screenshot: ${(r.reasons || ['failed visual review']).join('; ')}`],
          screenshot: meta.screenshotAbs
            ? path.relative(root, meta.screenshotAbs).replace(/\\/g, '/')
            : null,
        });
        console.log(`[screenshot-qa] GEMMA FAIL ${r.id} (${idx}/${items.length})`);
      } else if (idx % 25 === 0 || idx === items.length) {
        console.log(`[screenshot-qa] gemma vision ${idx}/${items.length} ok so far`);
      }
      if (idx === 1 || idx % 5 === 0 || idx === items.length) {
        writeQaProgress({
          active: true,
          stage: 'gemma-vision',
          phase: 'screenshot-qa',
          current: idx,
          total: items.length,
          unit: 'icons',
          detail: it.id,
          passedSoFar: passed.length,
          brokenSoFar: brokenMap.size,
        });
      }
    }

    writeQaProgress({
      active: true,
      stage: 'gemma-stem-vision',
      phase: 'screenshot-qa',
      current: 0,
      total: stemSheetMeta.length || 1,
      unit: 'stems',
      detail: 'Stem contact-sheet vision',
      passedSoFar: passed.length,
      brokenSoFar: brokenMap.size,
    });
    let stemVisionIdx = 0;
    for (const sheet of stemSheetMeta) {
      const r = await runGemmaStemSheetReview(sheet.stem, sheet.sheetAbs, sheet.siblingIds);
      if (r.verdict !== 'PASS') {
        const failIds = (r.failIds && r.failIds.length) ? r.failIds : sheet.siblingIds;
        for (const id of failIds) {
          addBroken(id, {
            reasons: [`gemma-stem-sheet ${sheet.stem}: ${(r.reasons || ['pack cohesion fail']).join('; ')}`],
            screenshot: path.relative(root, sheet.sheetAbs).replace(/\\/g, '/'),
            stem: sheet.stem,
          });
        }
        console.log(`[screenshot-qa] GEMMA STEM FAIL ${sheet.stem}`);
      }
      stemVisionIdx += 1;
      writeQaProgress({
        active: true,
        stage: 'gemma-stem-vision',
        phase: 'screenshot-qa',
        current: stemVisionIdx,
        total: stemSheetMeta.length || 1,
        unit: 'stems',
        detail: sheet.stem,
        passedSoFar: passed.length,
        brokenSoFar: brokenMap.size,
      });
    }
  }

  await browser.close();

  writeQaProgress({
    active: true,
    stage: 'writing-report',
    phase: 'screenshot-qa',
    current: items.length,
    total: items.length || 1,
    unit: 'icons',
    detail: 'Writing report.json + broken.json',
    passedSoFar: passed.length,
    brokenSoFar: brokenMap.size,
  });

  // Ensure every user-focus id/prefix match is in broken (even if a page miss happened)
  const userFocus = loadUserFocusList();
  for (const it of items) {
    const hit = matchUserFocus(it.id, userFocus);
    if (hit.matched) {
      addBroken(it.id, {
        team: it.team || null,
        kind: it.kind || null,
        reasons: hit.reasons,
        primaryFocus: true,
      });
    }
  }

  // Queue FAILED ids never appear as polished cards — still track for Q&A / re-polish
  for (const f of queueFailed) {
    addBroken(f.id, {
      reasons: [
        `polish-queue-fail (${f.kind}): ${String(f.reason).replace(/\s+/g, ' ').slice(0, 180)}`,
        f.remediation,
      ],
      queueFail: true,
      failKind: f.kind,
    });
  }

  // Reconcile passed vs broken
  const broken = [...brokenMap.values()];
  const brokenIds = new Set(broken.map((b) => b.id));
  const finalPassed = passed.filter((p) => !brokenIds.has(p.id));

  const report = {
    at: new Date().toISOString(),
    base: BASE,
    polished,
    pending,
    scanned: items.length,
    passed: finalPassed.length,
    brokenCount: broken.length,
    userFocusCount: broken.filter((b) => (b.reasons || []).some((r) => /user-qa-focus/i.test(r))).length,
    queueFailedCount: queueFailed.length,
    queueFailed,
    checks: [
      'per-icon-screenshot',
      'c-column-crop',
      'stem-contact-sheet',
      'theme-pack-cohesion',
      'location-surrounding-fit',
      'description-subject-fit',
      'broken-graphics',
      'offset-shift',
      'seamless-animation-loop',
      'animation-cohesion-and-frame-clip',
      'human-figure-anatomy',
      'stethoscope-stroke-integrity',
      'qr-finder-pattern-integrity',
      'user-qa-focus-list',
      'flagged-subject-integrity',
      'polish-queue-failed-investigation',
      ...(gemmaReview ? ['gemma-screenshot-vision-every-icon', 'gemma-stem-sheet-vision'] : []),
    ],
    gemmaVision: !!gemmaReview,
    broken,
    passedIds: finalPassed.map((p) => p.id),
    stemSheets: fs.readdirSync(stemSheetRoot).length,
  };
  fs.writeFileSync(path.join(qaRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(
    path.join(qaRoot, 'broken.json'),
    `${JSON.stringify({
      at: report.at,
      ids: broken.map((b) => b.id),
      reasons: Object.fromEntries(broken.map((b) => [b.id, b.reasons])),
    }, null, 2)}\n`,
  );

  writeQaProgress({
    active: false,
    stage: broken.length === 0 ? 'passed' : 'needs-fix',
    phase: 'report',
    current: finalPassed.length,
    total: items.length || 1,
    unit: 'passed',
    detail: broken.length === 0
      ? 'All pass'
      : `${broken.length} broken — run visual:polish:repolish-qa`,
    passedSoFar: finalPassed.length,
    brokenSoFar: broken.length,
    exitCode: broken.length === 0 ? 0 : 1,
    // round / maxRounds intentionally omitted so writeQaProgress preserves Pass N
  });

  console.log(JSON.stringify({
    ok: broken.length === 0,
    scanned: items.length,
    passed: finalPassed.length,
    broken: broken.length,
    stemSheets: report.stemSheets,
    report: 'artifacts/visual-gen/qa/report.json',
    brokenList: 'artifacts/visual-gen/qa/broken.json',
  }, null, 2));

  process.exit(broken.length === 0 ? 0 : 1);
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
  main().catch((err) => {
    console.error('[screenshot-qa] fatal', err);
    try {
      writeQaProgress({
        active: false,
        stage: 'needs-fix',
        phase: 'screenshot-qa',
        detail: `fatal: ${err?.message || err}`,
        exitCode: 1,
      });
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
}
