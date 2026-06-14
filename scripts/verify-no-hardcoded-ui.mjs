#!/usr/bin/env node
/**
 * Scan PWA/RN sources for likely user-visible English strings not using t().
 * Default: warn only (exit 0). Pass --strict to fail on findings.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');

const SCAN_FILES = [
  'apps/pwa-webapp/index.html',
  'apps/pwa-webapp/app.js',
  'apps/pwa-webapp/privacy-region.js',
  'apps/pwa-webapp/ui-feedback.js',
  'apps/pwa-webapp/summary-llm.js',
  'apps/pwa-webapp/AIEngine.js',
];

const RN_GLOBS = [
  'apps/rn-app/src/screens',
  'apps/rn-app/src/settings',
  'apps/rn-app/src/privacy',
  'apps/rn-app/src/navigation/RootNavigator.tsx',
];

const STRING_PATTERNS = [
  /(?:innerHTML|textContent|title|placeholder|aria-label)\s*[=:]\s*['"]([^'"]{3,120})['"]/g,
  /(?:showAlertModal|showConfirmModal|alert)\(\s*['"]([^'"]{3,200})['"]/g,
  /<(?:h[1-6]|label|button|span|p)[^>]*>([A-Za-z][^<]{2,80})<\//g,
  /Alert\.alert\(\s*['"]([^'"]{3,120})['"]/g,
  /<Text[^>]*>([A-Za-z][^<{]{2,80})<\/Text>/g,
];

const SKIP = /^(https?:|#|\{|\/\/|data-|className|var\(|calc\(|true|false|\d)/i;
const SKIP_TEXT = /^(OK|Cancel|Close|\.\.\.)$/;

function listRnFiles() {
  const files = [];
  for (const rel of RN_GLOBS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isFile()) {
      files.push(abs);
      continue;
    }
    for (const name of fs.readdirSync(abs)) {
      if (/\.(tsx|ts|jsx|js)$/.test(name)) files.push(path.join(abs, name));
    }
  }
  return files;
}

function scanFile(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) return [];
  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split('\n');
  const found = [];
  const seen = new Set();

  lines.forEach((line, idx) => {
    if (line.includes('data-i18n') || line.includes("t('") || line.includes('t("')) return;
    for (const re of STRING_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const text = m[1].trim();
        if (text.length < 3 || SKIP.test(text) || SKIP_TEXT.test(text)) continue;
        if (!/[A-Za-z]/.test(text)) continue;
        if (/[<>]/.test(text)) continue;
        const key = `${relPath}:${idx + 1}:${text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ file: relPath, line: idx + 1, text });
      }
    }
  });
  return found;
}

const results = [];
for (const f of SCAN_FILES) results.push(...scanFile(f));
for (const abs of listRnFiles()) {
  results.push(...scanFile(path.relative(root, abs)));
}

if (results.length === 0) {
  console.log('verify-no-hardcoded-ui: no hardcoded UI candidates found');
  process.exit(0);
}

console.warn(`verify-no-hardcoded-ui: ${results.length} hardcoded UI candidate(s)`);
results.slice(0, 30).forEach((r) => {
  console.warn(`  ${r.file}:${r.line} "${r.text}"`);
});
if (results.length > 30) {
  console.warn(`  … and ${results.length - 30} more`);
}

if (strict) {
  console.error('verify-no-hardcoded-ui: --strict failed');
  process.exit(1);
}

console.log('verify-no-hardcoded-ui: warn mode (pass); use --strict to fail CI');
