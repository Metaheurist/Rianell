#!/usr/bin/env node
/**
 * Phase 0 — A-stage icon corpus audit.
 *
 * Scores all visual-register entries against machine-checkable criteria and
 * emits keep/refine/redraw/merge/retire verdicts per stem.
 *
 * Usage:
 *   node scripts/audit/icon-a-audit.mjs
 *   node scripts/audit/icon-a-audit.mjs --limit=50
 *   npm run audit:icon-a
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  resolveRegisterPayload,
  buildStemIndex,
  extractSvgUnit,
} from '../dev/visual-polish-queue.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const registerPath = path.join(root, 'apps/pwa-webapp/assets/visual-register.json');
const args = process.argv.slice(2);
const outDirArg = args.find((a) => a.startsWith('--out-dir='));
const outDir = outDirArg
  ? (path.isAbsolute(outDirArg.slice('--out-dir='.length))
    ? outDirArg.slice('--out-dir='.length)
    : path.join(root, outDirArg.slice('--out-dir='.length)))
  : path.join(root, 'artifacts/audit');
const outJson = path.join(outDir, 'icon-a-audit.json');
const outHtml = path.join(outDir, 'icon-a-audit.html');

const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

const CANVAS = {
  '0 0 24 24': { size: 24, live: 20, trim: 2 },
  '0 0 32 32': { size: 32, live: 28, trim: 2 },
  '0 0 48 48': { size: 48, live: 42, trim: 3 },
  '0 0 64 64': { size: 64, live: 56, trim: 4 },
  '0 0 96 96': { size: 96, live: 84, trim: 6 },
};

const AUTHORITATIVE_STROKE = 2;

function parseViewBox(svg, fallback = '0 0 24 24') {
  const m = /\bviewBox=["']([^"']+)["']/.exec(svg || '');
  return m ? m[1].trim() : fallback;
}

function countShapes(svg) {
  const t = String(svg || '');
  return {
    paths: (t.match(/<path\b/gi) || []).length,
    circles: (t.match(/<circle\b/gi) || []).length,
    ellipses: (t.match(/<ellipse\b/gi) || []).length,
    rects: (t.match(/<rect\b/gi) || []).length,
    lines: (t.match(/<(?:line|polyline|polygon)\b/gi) || []).length,
    groups: (t.match(/<g\b/gi) || []).length,
  };
}

function nodeCount(shapes) {
  return shapes.paths + shapes.circles + shapes.ellipses + shapes.rects + shapes.lines;
}

function collectCoords(svg) {
  const nums = [];
  const t = String(svg || '');
  for (const m of t.matchAll(/\b(?:cx|cy|r|rx|ry|x|y|x1|y1|x2|y2|width|height)=["'](-?\d+(?:\.\d+)?)["']/gi)) {
    nums.push(Number(m[1]));
  }
  for (const m of t.matchAll(/\bd=["']([^"']+)["']/gi)) {
    for (const n of m[1].matchAll(/-?\d+(?:\.\d+)?/g)) nums.push(Number(n[0]));
  }
  return nums;
}

function scoreGrid(svg, viewBox) {
  const issues = [];
  const canvas = CANVAS[viewBox] || CANVAS['0 0 24 24'];
  const coords = collectCoords(svg);
  if (!coords.length) {
    issues.push('no-geometry');
    return { score: 0, issues };
  }
  let outOfLive = 0;
  let offHalf = 0;
  const min = canvas.trim;
  const max = canvas.size - canvas.trim;
  for (const n of coords) {
    if (!Number.isFinite(n)) continue;
    if (n < min - 0.5 || n > max + 0.5) outOfLive += 1;
    const half = Math.round(n * 2) / 2;
    if (Math.abs(n - half) > 0.05) offHalf += 1;
  }
  if (outOfLive > coords.length * 0.15) issues.push('ink-outside-live-area');
  if (offHalf > coords.length * 0.4) issues.push('off-half-unit-grid');
  const score = Math.max(0, 1 - (issues.length * 0.35) - (outOfLive / Math.max(1, coords.length)) * 0.3);
  return { score, issues, outOfLive, offHalf, coordCount: coords.length };
}

function scoreStroke(svg) {
  const issues = [];
  const widths = [...String(svg || '').matchAll(/\bstroke-width=["']([^"']+)["']/gi)].map((m) => m[1]);
  const inlineConflict = widths.filter((w) => {
    const n = Number(w);
    return Number.isFinite(n) && Math.abs(n - AUTHORITATIVE_STROKE) > 0.01;
  });
  if (inlineConflict.length) issues.push(`inline-stroke-width≠${AUTHORITATIVE_STROKE}`);
  const hasCap = /stroke-linecap=/i.test(svg || '');
  const hasJoin = /stroke-linejoin=/i.test(svg || '');
  // Cap/join often come from CSS cascade — warn only when stroke present without them
  const hasStroke = /stroke=/i.test(svg || '') || /stroke-width=/i.test(svg || '');
  if (hasStroke && widths.length && !hasCap) issues.push('missing-linecap');
  if (hasStroke && widths.length && !hasJoin) issues.push('missing-linejoin');
  const score = Math.max(0, 1 - issues.length * 0.25);
  return { score, issues, inlineWidths: widths };
}

function scoreComplexity(shapes, familyMedian = 4) {
  const n = nodeCount(shapes);
  const issues = [];
  if (n === 0) issues.push('empty');
  if (n > familyMedian * 3 && n > 12) issues.push('over-detailed');
  if (n === 1 && shapes.circles === 1) issues.push('degenerate-ring');
  const ratio = familyMedian > 0 ? n / familyMedian : 1;
  let score = 1;
  if (ratio > 3) score = 0.4;
  else if (ratio > 2) score = 0.65;
  else if (n === 0) score = 0;
  return { score, issues, nodes: n };
}

function scoreLegibility(svg, viewBox) {
  // Proxy without rasterizer: path-command density + ink span vs canvas.
  const canvas = CANVAS[viewBox] || CANVAS['0 0 24 24'];
  const coords = collectCoords(svg);
  const issues = [];
  if (!coords.length) {
    issues.push('no-ink');
    return { score: 0, issues };
  }
  const min = Math.min(...coords);
  const max = Math.max(...coords);
  const span = max - min;
  const coverage = span / canvas.size;
  if (coverage < 0.35) issues.push('too-small-features');
  if (coverage > 1.05) issues.push('overflow');
  const cmdCount = (String(svg).match(/[MmLlHhVvCcSsQqTtAaZz]/g) || []).length;
  if (cmdCount > 80) issues.push('too-dense-for-16px');
  const score = Math.max(0, 1 - issues.length * 0.3);
  return { score, issues, coverage: Number(coverage.toFixed(3)), cmdCount };
}

function silhouetteHash(svg) {
  const norm = String(svg || '')
    .replace(/\s+/g, ' ')
    .replace(/fill="[^"]*"/gi, '')
    .replace(/stroke="[^"]*"/gi, '')
    .replace(/stroke-width="[^"]*"/gi, '')
    .replace(/opacity="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    .toLowerCase()
    .slice(0, 4000);
  return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 12);
}

function scoreSemantic(entry, shapes) {
  const issues = [];
  const id = String(entry.id || '');
  const ctx = String(entry.context || entry.description || '');
  const n = nodeCount(shapes);
  if (/stethoscope/i.test(id + ctx) && shapes.paths < 2) issues.push('stethoscope-underbuilt');
  if (/\bqr\b/i.test(id + ctx) && shapes.rects < 3) issues.push('qr-weak-geometry');
  if (/pizza/i.test(id + ctx) && n < 2) issues.push('pizza-underbuilt');
  if (/cycle_tracker/i.test(id) && shapes.circles + shapes.ellipses + shapes.paths < 1) issues.push('cycle-empty');
  if (/close|x-mark/i.test(id + ctx) && shapes.paths < 1 && shapes.lines < 2) issues.push('close-missing-x');
  const score = issues.length ? Math.max(0.2, 1 - issues.length * 0.35) : 1;
  return { score, issues };
}

function stemKey(entry) {
  const id = entry?.id || '';
  if (id.startsWith('fancy:')) return id.replace(/^fancy:/, '').replace(/:(mint|mono|rainbow|red-black)$/, '');
  if (id.startsWith('fancy-nav:')) return id.replace(/^fancy-nav:/, '').replace(/:(mint|mono|rainbow|red-black)$/, '');
  if (id.startsWith('sprite:')) return id.slice('sprite:'.length);
  if (id.startsWith('nav:')) return id.slice('nav:'.length);
  return id;
}

function verdictFromScores(avg, issues) {
  if (issues.includes('empty') || issues.includes('no-geometry')) return 'redraw';
  if (issues.includes('degenerate-ring') && avg < 0.5) return 'redraw';
  if (avg >= 0.85) return 'keep';
  if (avg >= 0.65) return 'refine';
  if (avg >= 0.4) return 'redraw';
  return 'redraw';
}

function loadEntrySvg(entry) {
  try {
    const resolved = resolveRegisterPayload(entry);
    if (resolved.kind === 'svg' || resolved.kind === 'svg-resolved') {
      return extractSvgUnit(resolved.text) || resolved.text || '';
    }
    if (resolved.kind === 'anim' || entry.promptMode === 'single-anim' || entry.kind === 'animation' || entry.kind === 'fx') {
      return String(resolved.text || entry.currentPayload || '');
    }
    return String(resolved.text || '');
  } catch {
    return '';
  }
}

function main() {
  const register = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
  let entries = (register.entries || []).filter((e) => e.genStatus !== 'skip');
  if (Number.isFinite(LIMIT)) entries = entries.slice(0, LIMIT);

  const stemIndex = buildStemIndex(entries);
  const byStem = new Map();
  const results = [];
  const hashBuckets = new Map();

  // Pass 1: per-entry metrics
  for (const entry of entries) {
    const isAnim = entry.promptMode === 'single-anim' || entry.kind === 'animation' || entry.kind === 'fx';
    const svg = loadEntrySvg(entry);
    const viewBox = isAnim ? null : parseViewBox(svg, entry.viewBox || '0 0 24 24');
    const shapes = isAnim ? { paths: 0, circles: 0, ellipses: 0, rects: 0, lines: 0, groups: 0 } : countShapes(svg);
    const grid = isAnim ? { score: 1, issues: [] } : scoreGrid(svg, viewBox);
    const stroke = isAnim ? { score: 1, issues: [] } : scoreStroke(svg);
    const legibility = isAnim ? { score: 1, issues: [] } : scoreLegibility(svg, viewBox);
    const semantic = isAnim ? { score: 1, issues: [] } : scoreSemantic(entry, shapes);
    const hash = isAnim ? null : silhouetteHash(svg);
    if (hash) {
      if (!hashBuckets.has(hash)) hashBuckets.set(hash, []);
      hashBuckets.get(hash).push(entry.id);
    }

    const stem = stemKey(entry);
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push({ entry, shapes, nodes: nodeCount(shapes) });

    results.push({
      id: entry.id,
      kind: entry.kind,
      team: entry.team || null,
      stem,
      track: isAnim ? 'motion' : 'static',
      viewBox,
      shapes,
      grid,
      stroke,
      legibility,
      semantic,
      silhouetteHash: hash,
      complexity: null, // filled after family median
    });
  }

  // Family medians
  const stemMedian = new Map();
  for (const [stem, rows] of byStem) {
    const nodes = rows.map((r) => r.nodes).sort((a, b) => a - b);
    stemMedian.set(stem, nodes[Math.floor(nodes.length / 2)] || 4);
  }

  for (const row of results) {
    const median = stemMedian.get(row.stem) || 4;
    const shapes = row.shapes;
    row.complexity = row.track === 'motion'
      ? { score: 1, issues: [], nodes: 0, familyMedian: median }
      : { ...scoreComplexity(shapes, median), familyMedian: median };

    const scores = [row.grid.score, row.stroke.score, row.complexity.score, row.legibility.score, row.semantic.score];
    row.avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3));
    row.issues = [
      ...row.grid.issues,
      ...row.stroke.issues,
      ...row.complexity.issues,
      ...row.legibility.issues,
      ...row.semantic.issues,
    ];
  }

  // Near-duplicate / merge candidates
  const mergeHints = [];
  for (const [hash, ids] of hashBuckets) {
    const uniqueStems = new Set(ids.map((id) => {
      const r = results.find((x) => x.id === id);
      return r?.stem;
    }));
    if (uniqueStems.size > 1 && ids.length >= 2) {
      mergeHints.push({ hash, ids, stems: [...uniqueStems] });
      for (const id of ids) {
        const r = results.find((x) => x.id === id);
        if (r && !r.issues.includes('near-duplicate-silhouette')) {
          r.issues.push('near-duplicate-silhouette');
          r.avg = Number(Math.max(0, r.avg - 0.1).toFixed(3));
        }
      }
    }
  }

  // Stem verdicts
  const stems = [];
  for (const [stem, rows] of byStem) {
    const scored = results.filter((r) => r.stem === stem);
    const avg = scored.reduce((a, r) => a + r.avg, 0) / Math.max(1, scored.length);
    const allIssues = [...new Set(scored.flatMap((r) => r.issues))];
    let verdict = verdictFromScores(avg, allIssues);
    if (mergeHints.some((h) => h.stems.includes(stem))) {
      if (verdict === 'keep' || verdict === 'refine') verdict = 'merge';
    }
    // Retire only for empty raster leftovers or explicitly skipped — keep rare
    if (scored.every((r) => r.issues.includes('empty'))) verdict = 'retire';
    stems.push({
      stem,
      count: scored.length,
      avg: Number(avg.toFixed(3)),
      verdict,
      issues: allIssues,
      ids: scored.map((r) => r.id),
    });
  }

  const summary = {
    at: new Date().toISOString(),
    scanned: results.length,
    stems: stems.length,
    byVerdict: stems.reduce((acc, s) => {
      acc[s.verdict] = (acc[s.verdict] || 0) + 1;
      return acc;
    }, {}),
    byTrack: {
      static: results.filter((r) => r.track === 'static').length,
      motion: results.filter((r) => r.track === 'motion').length,
    },
    mergeHints: mergeHints.length,
    authoritativeStroke: AUTHORITATIVE_STROKE,
  };

  const report = { summary, stems, entries: results, mergeHints };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + '\n');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Icon A-stage audit</title>
<style>
body{font-family:system-ui,sans-serif;background:#0c100e;color:#e8f5ee;padding:24px}
h1{font-size:1.2rem} table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #2a3a32;padding:6px 8px;text-align:left}
th{background:#15201b} .keep{color:#7bdf8c}.refine{color:#f0b429}.redraw{color:#ff7b7b}.merge{color:#7eb6ff}.retire{color:#8aa396}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#1c2a24;margin:2px}
</style></head><body>
<h1>Icon A-stage audit</h1>
<p>Scanned <strong>${summary.scanned}</strong> · stems <strong>${summary.stems}</strong> ·
<span class="pill keep">keep ${summary.byVerdict.keep||0}</span>
<span class="pill refine">refine ${summary.byVerdict.refine||0}</span>
<span class="pill redraw">redraw ${summary.byVerdict.redraw||0}</span>
<span class="pill merge">merge ${summary.byVerdict.merge||0}</span>
<span class="pill retire">retire ${summary.byVerdict.retire||0}</span>
</p>
<table><thead><tr><th>Stem</th><th>N</th><th>Avg</th><th>Verdict</th><th>Issues</th></tr></thead>
<tbody>
${stems.sort((a,b)=>a.avg-b.avg).map((s)=>`<tr><td>${s.stem}</td><td>${s.count}</td><td>${s.avg}</td><td class="${s.verdict}">${s.verdict}</td><td>${s.issues.slice(0,6).join(', ')}</td></tr>`).join('\n')}
</tbody></table>
</body></html>`;
  fs.writeFileSync(outHtml, html);

  console.log(JSON.stringify(summary, null, 2));
  console.log(`[icon-a-audit] wrote ${path.relative(root, outJson)}`);
  console.log(`[icon-a-audit] wrote ${path.relative(root, outHtml)}`);
}

main();
