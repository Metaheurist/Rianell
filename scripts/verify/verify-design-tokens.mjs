#!/usr/bin/env node
/**
 * Guardrail: fail when critical UI files reintroduce hardcoded scaffold literals
 * or layout-property progress animations. See docs/design-token-contract.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const PWA_JS_FORBIDDEN = [
  { re: /\.style\.width\s*=\s*[^;]+%/, msg: 'width % assignment — use setProgressScale() with --progress' },
];

const PWA_CSS_PROGRESS = [
  'apps/pwa-webapp/styles.css',
];

const CSS_FORBIDDEN = [
  { re: /\.log-wizard-progress-fill[^}]*transition:\s*width/, msg: 'log-wizard progress must animate transform only' },
  { re: /\.achievement-progress-fill[^}]*transition:\s*width/, msg: 'achievement progress must animate transform only' },
  { re: /#tabNavIndicator[^}]*transition:[^;]*width/, msg: 'tab indicator must not transition width' },
  { re: /--transition-fast:\s*0\.\d+s/, msg: 'legacy hardcoded --transition-fast — alias to --dur-* tokens' },
];

const failures = [];

function checkFile(rel, rules) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`${rel}: missing`);
    return;
  }
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  for (const { re, msg } of rules) {
    if (re.test(text)) {
      const idx = lines.findIndex((l) => re.test(l));
      failures.push(`${rel}:${idx + 1}: ${msg}`);
    }
  }
}

checkFile('apps/pwa-webapp/app.js', PWA_JS_FORBIDDEN);

for (const rel of PWA_CSS_PROGRESS) {
  checkFile(rel, CSS_FORBIDDEN);
}

const contract = path.join(root, 'docs/design-token-contract.md');
if (!fs.existsSync(contract)) {
  failures.push('docs/design-token-contract.md: missing canonical token contract');
}

const tokensMjs = fs.readFileSync(path.join(root, 'packages/tokens/src/index.mjs'), 'utf8');
if (!tokensMjs.includes('SPACING_TOKENS') || !tokensMjs.includes('SURFACE_TOKENS')) {
  failures.push('packages/tokens/src/index.mjs: missing SPACING_TOKENS or SURFACE_TOKENS');
}

if (failures.length) {
  console.error('verify-design-tokens: FAILED\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log('verify-design-tokens: OK');
