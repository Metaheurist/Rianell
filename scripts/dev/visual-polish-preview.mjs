#!/usr/bin/env node
/**
 * Build artifacts/visual-gen/gemma-preview.html with N random polished samples.
 * Usage: node scripts/dev/visual-polish-preview.mjs [count]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const COUNT = Math.max(1, Number(process.argv[2] || 10));

const cp = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/visual-gen/polish-checkpoint.json'), 'utf8'));
const reg = JSON.parse(fs.readFileSync(path.join(root, 'apps/pwa-webapp/assets/visual-register.json'), 'utf8'));
const byId = new Map((reg.entries || []).map((e) => [e.id, e]));

function wrapSvg(inner, vb = '0 0 24 24') {
  const t = String(inner || '').trim();
  if (!t) return '';
  if (/^<svg[\s>]/i.test(t)) return t;
  if (/^<symbol[\s>]/i.test(t)) {
    return t.replace(/^<symbol\b/i, '<svg').replace(/<\/symbol>/i, '</svg>');
  }
  return `<svg viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">${t}</svg>`;
}

function uniqueFilterIds(svg, salt) {
  return String(svg)
    .replace(/\bid=(["'])([^"']+)\1/g, (_m, q, id) => `id=${q}${salt}-${id}${q}`)
    .replace(/url\((["']?)#([^)"']+)\1\)/g, (_m, _q, id) => `url(#${salt}-${id})`);
}

const ids = Object.keys(cp.completed || {});
for (let i = ids.length - 1; i > 0; i -= 1) {
  const j = Math.floor(Math.random() * (i + 1));
  [ids[i], ids[j]] = [ids[j], ids[i]];
}

const picks = [];
for (const id of ids) {
  if (picks.length >= COUNT) break;
  const meta = cp.completed[id];
  const entry = byId.get(id);
  if (!meta?.outputPath) continue;
  const abs = path.isAbsolute(meta.outputPath) ? meta.outputPath : path.join(root, meta.outputPath);
  if (!fs.existsSync(abs)) continue;
  const afterRaw = fs.readFileSync(abs, 'utf8');
  if (afterRaw.trim().length < 40) continue;
  const vb = entry?.viewBox || '0 0 24 24';
  const beforeRaw = entry?.currentPayload || '';
  const beforeIsSvg = /<(?:svg|path|circle|ellipse|rect|g|line|polyline|polygon)\b/i.test(beforeRaw);
  const after = uniqueFilterIds(wrapSvg(afterRaw, vb), `a${picks.length}`);
  const before = beforeIsSvg ? uniqueFilterIds(wrapSvg(beforeRaw, vb), `b${picks.length}`) : '';
  picks.push({
    id,
    kind: entry?.kind || '',
    team: entry?.team || null,
    bytes: meta.bytes,
    before,
    after,
    path: meta.outputPath,
  });
}

const cards = picks.map((p, i) => {
  const beforeBlock = p.before
    ? `<div class="stage">${p.before}</div><div class="stage stage--light">${p.before}</div>`
    : '<div class="stage empty">(no SVG original — stub/source)</div>';
  const tag = p.team ? `<span class="tag">${p.team}</span>` : '';
  return `<article class="pair">
  <header><span class="idx">${i + 1}/${picks.length}</span> <code>${p.id}</code>${tag}</header>
  <div class="cols">
    <div class="col"><h3>A — Original</h3>${beforeBlock}</div>
    <div class="col"><h3>C — Gemma</h3>
      <div class="stage">${p.after}</div>
      <div class="stage stage--light">${p.after}</div>
    </div>
  </div>
</article>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gemma polish — ${picks.length} random</title>
<style>
:root{--bg:#0f1412;--panel:#1a2420;--mint:#7bdf8c;--mint-soft:#a8e6cf;--text:#e8f5ee;--muted:#8aa396;}
*{box-sizing:border-box}
body{margin:0;font-family:Segoe UI,system-ui,sans-serif;color:var(--text);background:radial-gradient(ellipse 80% 40% at 50% -5%,rgba(123,223,140,.16),transparent),var(--bg);padding:28px 20px 56px}
h1{font-size:1.3rem;margin:0 0 6px}
.sub{color:var(--muted);margin:0 0 24px;font-size:.92rem}
.pair{background:var(--panel);border:1px solid rgba(168,230,207,.16);border-radius:16px;padding:16px 18px 18px;margin-bottom:16px}
.pair header{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.idx{color:var(--mint-soft);font-size:.75rem;font-weight:700;letter-spacing:.04em}
code{font-size:.85rem;color:var(--text)}
.tag{font-size:.7rem;padding:2px 8px;border-radius:999px;background:rgba(123,223,140,.15);color:var(--mint-soft)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:720px){.cols{grid-template-columns:1fr}}
h3{margin:0 0 8px;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mint-soft)}
.stage{display:flex;align-items:center;justify-content:center;min-height:120px;border-radius:12px;background:#121a17;color:var(--mint);margin-bottom:8px}
.stage--light{background:#f3faf6;color:#1a3d2a}
.stage svg{width:72px;height:72px;overflow:visible}
.stage.empty{color:var(--muted);font-size:.8rem}
</style>
</head>
<body>
<h1>Gemma polish — ${picks.length} random</h1>
<p class="sub">Random sample from ${Object.keys(cp.completed || {}).length} polished units · ${new Date().toISOString()}</p>
${cards}
</body>
</html>
`;

const outHtml = path.join(root, 'artifacts/visual-gen/gemma-preview.html');
const outJson = path.join(root, 'artifacts/visual-gen/gemma-preview-pick.json');
fs.writeFileSync(outHtml, html);
fs.writeFileSync(outJson, `${JSON.stringify(picks.map((p) => ({ id: p.id, team: p.team, bytes: p.bytes, path: p.path })), null, 2)}\n`);
console.log(picks.map((p, i) => `${i + 1}. ${p.id} (${p.bytes}B)`).join('\n'));
console.log(`wrote ${outHtml}`);
