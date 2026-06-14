#!/usr/bin/env node
/**
 * Scan PWA/RN sources for likely user-visible English strings.
 * Output: scripts/.audit/i18n-strings.json
 * --check: fail if audit finds strings without a matching en-GB catalog key
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const outDir = path.join(root, 'scripts', '.audit');
const outFile = path.join(outDir, 'i18n-strings.json');
const checkMode = process.argv.includes('--check');

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

function loadCatalogKeys() {
  const p = path.join(canonicalLocalePacksDir(root), 'en-GB.json');
  if (!fs.existsSync(p)) return { keys: new Set(), values: new Set() };
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'));
  const keys = new Set(Object.keys(pack.strings || {}));
  const values = new Set(
    Object.values(pack.strings || {})
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim()),
  );
  return { keys, values };
}

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

function suggestKey(text, file) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 40);
  let domain = 'common';
  if (file.includes('Charts')) domain = 'charts';
  else if (file.includes('Ai') || file.includes('AIEngine') || file.includes('summary-llm')) domain = 'ai';
  else if (file.includes('LogWizard') || file.includes('wizard')) domain = 'wizard';
  else if (file.includes('Home')) domain = 'home';
  else if (file.includes('Logs')) domain = 'logs';
  else if (file.includes('Settings') || file.includes('privacy')) domain = 'settings';
  else if (file.includes('app.js') && text.includes('Chart')) domain = 'charts';
  return `${domain}.${slug || 'text'}`;
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
        found.push({
          file: relPath,
          line: idx + 1,
          text,
          suggestedKey: suggestKey(text, relPath),
          domain: suggestKey(text, relPath).split('.')[0],
        });
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

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');
console.log(`audit-hardcoded-strings: wrote ${results.length} candidates to ${path.relative(root, outFile)}`);

if (checkMode) {
  const { keys: catalogKeys, values: catalogValues } = loadCatalogKeys();
  const missing = results.filter((r) => {
    const text = r.text.trim();
    if (catalogValues.has(text)) return false;
    if (catalogKeys.has(r.suggestedKey)) return false;
    return true;
  });
  const uniqueMissing = [...new Map(missing.map((m) => [m.text, m])).values()];
  if (uniqueMissing.length > 0) {
    console.error(`audit-hardcoded-strings: ${uniqueMissing.length} strings lack catalog keys (--check)`);
    uniqueMissing.slice(0, 20).forEach((m) => {
      console.error(`  ${m.file}:${m.line} "${m.text}" → ${m.suggestedKey}`);
    });
    process.exit(1);
  }
  console.log('audit-hardcoded-strings: --check passed (all candidates covered in en-GB catalog)');
}
