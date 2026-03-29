/**
 * Normalise UK English in Markdown under the repo root.
 * Skips fenced ``` code blocks. Preserves CSS `*-behavior-*` and `sync_behavior`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');

const T_SYNC = '\x00SYNC\x00';
const T_OS_Y = '\x00OSCY\x00';
const T_OS = '\x00OSC\x00';

function protect(s) {
  let t = s;
  t = t.split('sync_behavior').join(T_SYNC);
  t = t.split('overscroll-behavior-y').join(T_OS_Y);
  t = t.split('overscroll-behavior').join(T_OS);
  return t;
}

function unprotect(t) {
  let s = t;
  s = s.split(T_OS_Y).join('overscroll-behavior-y');
  s = s.split(T_OS).join('overscroll-behavior');
  s = s.split(T_SYNC).join('sync_behavior');
  return s;
}

const REPLACEMENTS = [
  ['defense in depth', 'defence in depth'],
  ['Defense in depth', 'Defence in depth'],
  ['labeled ', 'labelled '],
  ['labeled)', 'labelled)'],
  ['labeled,', 'labelled,'],
  ['labeled:', 'labelled:'],
  ['minimized ', 'minimised '],
  ['minimized)', 'minimised)'],
  ['minimized,', 'minimised,'],
  ['minimized.', 'minimised.'],
  ['customization', 'customisation'],
  ['Customization', 'Customisation'],
  ['organization ', 'organisation '],
  ['organization)', 'organisation)'],
  ['organizations', 'organisations'],
  ['Organization', 'Organisation'],
  ['Analyzing…', 'Analysing…'],
  ['Analyzing ', 'Analysing '],
  ['Analyzing your', 'Analysing your'],
  ['honor ', 'honour '],
  ['honor.', 'honour.'],
  ['honor a', 'honour a'],
  ['behavior', 'behaviour'],
  ['Behavior', 'Behaviour'],
  ['color-coded', 'colour-coded'],
  ['synchronized', 'synchronised'],
  ['Synchronized', 'Synchronised'],
  ['unsanitized', 'unsanitised'],
];

function applyReplacements(text) {
  let u = protect(text);
  for (const [a, b] of REPLACEMENTS) {
    u = u.split(a).join(b);
  }
  return unprotect(u);
}

function processMarkdown(body) {
  const re = /```[\s\S]*?```/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(body)) !== null) {
    out += applyReplacements(body.slice(last, m.index));
    out += m[0];
    last = m.index + m[0].length;
  }
  out += applyReplacements(body.slice(last));
  return out;
}

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === '.git') continue;
      walk(p, acc);
    } else if (name.name.endsWith('.md')) acc.push(p);
  }
}

const mdFiles = [];
walk(REPO, mdFiles);
mdFiles.sort();

let changed = 0;
for (const file of mdFiles) {
  const rel = path.relative(REPO, file);
  const raw = fs.readFileSync(file, 'utf8');
  const next = processMarkdown(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('updated', rel);
    changed++;
  }
}

console.log('done. changed:', changed, 'of', mdFiles.length);
