#!/usr/bin/env node
/**
 * Apply completed Ollama visual-gen outputs into the PWA sources.
 *
 * - Plain sprite:* → rewrite <symbol> inners in index.html
 * - Fancy artifacts → written under artifacts/visual-gen/fancy-overrides/ for generate-theme-icons
 * - Portfolio kinds logged for patching (avatars/metrics/emblems/achievements)
 * - Animations: replace @keyframes bodies in owning CSS when validated
 *
 * Usage: node scripts/dev/visual-gen-apply.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const pwa = path.join(root, 'apps/pwa-webapp');
const registerPath = path.join(pwa, 'assets/visual-register.json');
const checkpointPath = path.join(root, 'artifacts/visual-gen/checkpoint.json');
const fancyOverrideDir = path.join(root, 'artifacts/visual-gen/fancy-overrides');
const dryRun = process.argv.includes('--dry-run');

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readOutput(entry) {
  const polishedRel = String(entry.outputPath || '').replace(/^artifacts\/visual-gen\//, 'artifacts/visual-gen/polished/');
  const polishedAbs = path.join(root, polishedRel);
  if (fs.existsSync(polishedAbs)) {
    return fs.readFileSync(polishedAbs, 'utf8').trim();
  }
  const abs = path.join(root, entry.outputPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8').trim();
}

function replaceSymbolInner(html, symbolId, newInner) {
  const re = new RegExp(
    `(<symbol\\b[^>]*\\bid=["']${symbolId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>)([\\s\\S]*?)(<\\/symbol>)`,
    'i'
  );
  if (!re.test(html)) return { html, ok: false };
  return {
    html: html.replace(re, `$1${newInner}$3`),
    ok: true,
  };
}

function replaceKeyframes(css, name, newBlock) {
  const re = new RegExp(`@keyframes\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'g');
  const m = re.exec(css);
  if (!m) return { css, ok: false };
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
    i += 1;
  }
  const block = newBlock.trim().endsWith('}') ? newBlock.trim() : `${newBlock.trim()}\n}`;
  const next = css.slice(0, m.index) + block + css.slice(i);
  return { css: next, ok: true };
}

function main() {
  const register = loadJson(registerPath, null);
  if (!register) throw new Error('visual-register.json missing');
  const cp = loadJson(checkpointPath, { completed: {} });
  const completedIds = new Set(Object.keys(cp.completed || {}));

  let html = fs.readFileSync(path.join(pwa, 'index.html'), 'utf8');
  const cssCache = new Map();
  const stats = {
    sprite: 0,
    fancy: 0,
    animation: 0,
    portfolioQueued: 0,
    skipped: 0,
    missing: 0,
  };

  fs.mkdirSync(fancyOverrideDir, { recursive: true });

  const portfolioPatches = [];

  for (const entry of register.entries) {
    if (entry.genStatus === 'skip') {
      stats.skipped += 1;
      continue;
    }
    if (!completedIds.has(entry.id) && entry.genStatus !== 'done') {
      stats.missing += 1;
      continue;
    }
    const out = readOutput(entry);
    if (!out) {
      stats.missing += 1;
      continue;
    }

    if (entry.id.startsWith('sprite:') && (!entry.team)) {
      const symbolId = entry.id.slice('sprite:'.length);
      const inner = out.replace(/^<svg[^>]*>|<\/svg>$/gi, '').trim();
      const res = replaceSymbolInner(html, symbolId, inner);
      if (res.ok) {
        html = res.html;
        stats.sprite += 1;
      }
      continue;
    }

    if (entry.id.startsWith('nav:') && !entry.id.startsWith('fancy-nav:')) {
      const symbolId = entry.id.slice('nav:'.length);
      const inner = out.replace(/^<svg[^>]*>|<\/svg>$/gi, '').trim();
      const res = replaceSymbolInner(html, symbolId, inner);
      if (res.ok) {
        html = res.html;
        stats.sprite += 1;
      }
      continue;
    }

    if (entry.id.startsWith('fancy:') || entry.id.startsWith('fancy-nav:')) {
      const file = path.join(fancyOverrideDir, `${entry.id.replace(/[:/\\]/g, '__')}.svgfrag`);
      if (!dryRun) fs.writeFileSync(file, out + '\n');
      stats.fancy += 1;
      continue;
    }

    if (entry.kind === 'animation' && entry.sourcePath) {
      const abs = path.join(root, entry.sourcePath);
      if (!cssCache.has(abs)) cssCache.set(abs, fs.readFileSync(abs, 'utf8'));
      const name = entry.id.slice('animation:'.length);
      const res = replaceKeyframes(cssCache.get(abs), name, out);
      if (res.ok) {
        cssCache.set(abs, res.css);
        stats.animation += 1;
      }
      continue;
    }

    if (['avatar', 'avatar-part', 'metric', 'emblem-badge', 'emblem-tier', 'emblem-cycle', 'achievement', 'fa-replace', 'nav'].includes(entry.kind)) {
      portfolioPatches.push({ id: entry.id, kind: entry.kind, outputPath: entry.outputPath });
      stats.portfolioQueued += 1;
    }
  }

  const patchManifest = {
    generatedAt: new Date().toISOString(),
    stats,
    portfolioPatches,
  };
  const patchPath = path.join(root, 'artifacts/visual-gen/apply-manifest.json');

  if (!dryRun) {
    fs.writeFileSync(path.join(pwa, 'index.html'), html);
    for (const [abs, css] of cssCache) {
      fs.writeFileSync(abs, css);
    }
    fs.writeFileSync(patchPath, JSON.stringify(patchManifest, null, 2) + '\n');
    // also copy fancy overrides index for generate-theme-icons
    const fancyIndex = {};
    for (const f of fs.readdirSync(fancyOverrideDir)) {
      if (!f.endsWith('.svgfrag')) continue;
      fancyIndex[f.replace(/\.svgfrag$/, '')] = path.posix.join('artifacts/visual-gen/fancy-overrides', f);
    }
    fs.writeFileSync(
      path.join(root, 'artifacts/visual-gen/fancy-overrides/index.json'),
      JSON.stringify(fancyIndex, null, 2) + '\n'
    );
  }

  console.log('[visual-apply]', JSON.stringify(stats));
  console.log(`[visual-apply] portfolio patches pending wiring: ${portfolioPatches.length}`);
  if (dryRun) console.log('[visual-apply] dry-run — no files written');
}

main();
