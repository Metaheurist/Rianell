/**
 * One-off helper: slice README.md into docs/*.md (run from repo root).
 * Usage: node scripts/split-readme-to-docs.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.join(import.meta.dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const lines = readme.split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n') + '\n';
}

const out = {
  'docs/app-and-features.md': slice(78, 236),
  'docs/setup-and-usage.md': slice(238, 420),
  'docs/testing-and-configuration.md': slice(422, 478),
  'docs/ai-architecture.md': slice(480, 609),
  'docs/project-reference.md': slice(612, 760),
  'docs/about-and-support.md': slice(762, 791),
  'docs/CHANGELOG.md': slice(795, lines.length),
};

for (const [rel, body] of Object.entries(out)) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
  console.log('Wrote', rel, '(' + body.split('\n').length + ' lines)');
}
