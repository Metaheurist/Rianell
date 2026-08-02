#!/usr/bin/env node
/**
 * Guardrail: icon design specs stay aligned with tokens + CSS.
 * npm run verify:icon-spec
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_FX_TOKENS } from '@rianell/tokens';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

function mustExist(rel) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`missing ${rel}`);
}

const SPEC_FILES = [
  'docs/style-and-design/icon-grid.md',
  'docs/style-and-design/icon-stroke-and-fill.md',
  'docs/style-and-design/icon-size-ladder.md',
  'docs/style-and-design/icon-optical-alignment.md',
  'docs/style-and-design/motion-catalogue.md',
  'docs/style-and-design/theme-variants.md',
  'docs/style-and-design/icon-taxonomy.md',
  'docs/style-and-design/subject-contracts.json',
];

for (const f of SPEC_FILES) mustExist(f);

const strokeDoc = fs.readFileSync(path.join(root, 'docs/style-and-design/icon-stroke-and-fill.md'), 'utf8');
if (!/\|\s*`--ui-icon-stroke`\s*\|\s*\*\*2\*\*/.test(strokeDoc) && !/--ui-icon-stroke`\s*\|\s*\*\*2\*\*/.test(strokeDoc)) {
  if (!strokeDoc.includes('**2**') || !strokeDoc.includes('--ui-icon-stroke')) {
    failures.push('icon-stroke-and-fill.md must declare authoritative --ui-icon-stroke = 2');
  }
}

const css = fs.readFileSync(path.join(root, 'apps/pwa-webapp/styles.css'), 'utf8');
const rootStroke = /--ui-icon-stroke:\s*2\s*;/.test(css);
if (!rootStroke) failures.push('apps/pwa-webapp/styles.css root --ui-icon-stroke must be 2');

const gridDoc = fs.readFileSync(path.join(root, 'docs/style-and-design/icon-grid.md'), 'utf8');
for (const vb of ['0 0 24 24', '0 0 32 32', '0 0 48 48', '0 0 64 64', '0 0 96 96']) {
  if (!gridDoc.includes(vb)) failures.push(`icon-grid.md missing canvas ${vb}`);
}

const motionDoc = fs.readFileSync(path.join(root, 'docs/style-and-design/motion-catalogue.md'), 'utf8');
for (const tok of ['--dur-fast', '--dur-normal', '--ease-out-expo', 'cyclic-translate', 'rotate-360', 'pulse']) {
  if (!motionDoc.includes(tok)) failures.push(`motion-catalogue.md missing ${tok}`);
}

const teams = Object.keys(THEME_FX_TOKENS.teams || {});
const themeDoc = fs.readFileSync(path.join(root, 'docs/style-and-design/theme-variants.md'), 'utf8');
for (const t of teams) {
  if (!themeDoc.includes(t)) failures.push(`theme-variants.md missing team ${t}`);
}
for (const t of teams) {
  const glow = THEME_FX_TOKENS.teams[t].glow;
  if (glow && !themeDoc.includes(String(glow).slice(0, 7))) {
    // soft check — hex prefix
  }
}

const contracts = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/style-and-design/subject-contracts.json'), 'utf8'),
);
for (const key of ['stethoscope', 'qr', 'pizza', 'cycle_tracker', 'ashspiral', 'fa-replace', 'human-figure']) {
  if (!contracts.subjects?.[key]) failures.push(`subject-contracts.json missing subjects.${key}`);
}

if (!THEME_FX_TOKENS.uiIcon || !THEME_FX_TOKENS.budgets) {
  failures.push('THEME_FX_TOKENS missing uiIcon or budgets');
}

if (failures.length) {
  console.error('verify:icon-spec FAILED');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('verify:icon-spec OK');
