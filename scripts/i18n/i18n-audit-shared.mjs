/**
 * Shared scanner for audit-hardcoded-strings.mjs and verify-no-hardcoded-ui.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';

export const SCAN_FILES = [
  'apps/pwa-webapp/index.html',
  'apps/pwa-webapp/app.js',
  'apps/pwa-webapp/privacy-region.js',
  'apps/pwa-webapp/ui-feedback.js',
  'apps/pwa-webapp/summary-llm.js',
  'apps/pwa-webapp/AIEngine.js',
  'apps/pwa-webapp/device-benchmark.js',
];

export const RN_GLOBS = [
  'apps/rn-app/src/screens',
  'apps/rn-app/src/settings',
  'apps/rn-app/src/privacy',
  'apps/rn-app/src/navigation/RootNavigator.tsx',
];

export const STRING_PATTERNS = [
  /(?:innerHTML|textContent|title|placeholder|aria-label)\s*[=:]\s*['"]([^'"]{3,120})['"]/g,
  /(?:showAlertModal|showConfirmModal|alert)\(\s*['"]([^'"]{3,200})['"]/g,
  /<(?:h[1-6]|label|button|span|p)[^>]*>([A-Za-z][^<]{2,80})<\//g,
  /Alert\.alert\(\s*['"]([^'"]{3,120})['"]/g,
  /<Text[^>]*>([A-Za-z][^<{]{2,80})<\/Text>/g,
  /\{\s*label:\s*['"]([^'"]{3,120})['"]/g,
  /sectionCard\(\s*['"]([^'"]{3,80})['"]/g,
  /addRow\([^,]+,\s*['"]([^'"]{3,80})['"]/g,
  /class="tutorial-text"[^>]*>([A-Za-z][^<]{10,240})</g,
];

const SKIP = /^(https?:|#|\{|\/\/|data-|className|var\(|calc\(|true|false|\d)/i;
const SKIP_TEXT = /^(OK|Cancel|Close|\.\.\.)$/;

const I18N_LINE =
  /data-i18n(?:-aria|-placeholder|-title)?|tUi\s*\(|useT\s*\(|\bt\s*\(\s*['"`]|RianellI18n\.t\s*\(/;

const WIRED_LINE = /data-i18n(?:-aria|-placeholder|-title)?|tUi\s*\(|useT\s*\(|\bt\s*\(\s*['"`]|RianellI18n\.t\s*\(/;

export function loadAllowlist(root) {
  const p = path.join(root, 'scripts', '.audit', 'i18n-allowlist.json');
  if (!fs.existsSync(p)) {
    return { exact: [], patterns: [], files: {} };
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return {
    exact: new Set(raw.exact || []),
    patterns: (raw.patterns || []).map((p) => new RegExp(p, 'i')),
    files: raw.files || {},
  };
}

export function isAllowlisted(text, file, allowlist) {
  if (allowlist.exact.has(text)) return true;
  if (allowlist.patterns.some((re) => re.test(text))) return true;
  const rel = file.replace(/\\/g, '/');
  const fileRules = allowlist.files[rel];
  if (fileRules?.exact?.includes(text)) return true;
  if (fileRules?.patterns?.some((p) => new RegExp(p, 'i').test(text))) return true;
  return false;
}

export function loadCatalog(root) {
  const p = path.join(canonicalLocalePacksDir(root), 'en-GB.json');
  if (!fs.existsSync(p)) return { keys: new Set(), values: new Set(), valueToKey: new Map() };
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'));
  const keys = new Set(Object.keys(pack.strings || {}));
  const values = new Set();
  const valueToKey = new Map();
  for (const [key, value] of Object.entries(pack.strings || {})) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    values.add(trimmed);
    if (!valueToKey.has(trimmed)) valueToKey.set(trimmed, key);
  }
  return { keys, values, valueToKey };
}

export function listRnFiles(root) {
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

export function suggestKey(text, file) {
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

function lineIsSkipped(line) {
  if (I18N_LINE.test(line)) return true;
  if (line.includes("t('") || line.includes('t("')) return true;
  if (/labelKey:\s*['"]/.test(line)) return true;
  if (/titleKey:\s*['"]/.test(line)) return true;
  if (/hintKey:\s*['"]/.test(line)) return true;
  return false;
}

function lineIsWired(line) {
  return WIRED_LINE.test(line);
}

export function scanFile(root, relPath, allowlist) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) return [];
  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split('\n');
  const found = [];
  const seen = new Set();
  const { keys: catalogKeys } = loadCatalog(root);

  lines.forEach((line, idx) => {
    if (lineIsSkipped(line)) return;
    for (const re of STRING_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const text = m[1].trim();
        if (text.length < 3 || SKIP.test(text) || SKIP_TEXT.test(text)) continue;
        if (!/[A-Za-z]/.test(text)) continue;
        if (/[<>]/.test(text)) continue;
        if (/\$\{/.test(text)) continue;
        if (isAllowlisted(text, relPath, allowlist)) continue;
        if (catalogKeys.has(text)) continue;
        const key = `${relPath}:${idx + 1}:${text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({
          file: relPath,
          line: idx + 1,
          text,
          suggestedKey: suggestKey(text, relPath),
          domain: suggestKey(text, relPath).split('.')[0],
          wired: lineIsWired(line),
        });
      }
    }
  });
  return found;
}

export function scanAll(root) {
  const allowlist = loadAllowlist(root);
  const results = [];
  for (const f of SCAN_FILES) results.push(...scanFile(root, f, allowlist));
  for (const abs of listRnFiles(root)) {
    results.push(...scanFile(root, path.relative(root, abs), allowlist));
  }
  return results;
}
