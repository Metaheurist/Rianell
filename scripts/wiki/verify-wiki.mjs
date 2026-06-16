#!/usr/bin/env node
/**
 * Validates wiki/ source before sync to GitHub Wiki.
 * Usage: node scripts/wiki/verify-wiki.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');

const REQUIRED_FILES = [
  'Home.md',
  '_Sidebar.md',
  '_Footer.md',
  'Getting-Started.md',
  'Features-Guide.md',
  'Logging-Data.md',
  'Charts-and-AI.md',
  'Cloud-Sync-and-Backup.md',
  'Privacy-and-Your-Data.md',
  'Settings-and-Languages.md',
  'Downloads.md',
  'Troubleshooting.md',
  'FAQ.md',
  'Developer-Home.md',
  'Developer-Setup.md',
  'Architecture-Overview.md',
  'Platforms-and-Parity.md',
  'Build-Test-and-CI.md',
  'Contributing.md',
  'About-and-Support.md',
  'Release-Notes.md',
];

const PAGE_FILES = REQUIRED_FILES.filter((f) => !f.startsWith('_'));

const SECRET_PATTERNS = [
  /\.env\b/i,
  /SUPABASE_SECRET/i,
  /service_role/i,
  /gho_[a-zA-Z0-9]+/,
  /sk-[a-zA-Z0-9]{20,}/,
];

const WIKI_LINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

function wikiLinkToFilename(link) {
  const trimmed = link.trim();
  const normalized = trimmed.replace(/\s+/g, '-');
  return `${normalized}.md`;
}

function listWikiFiles() {
  if (!fs.existsSync(wikiDir)) return [];
  return fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
}

function readWiki(rel) {
  return fs.readFileSync(path.join(wikiDir, rel), 'utf8');
}

let failed = false;

function fail(msg) {
  console.error(`verify-wiki: ${msg}`);
  failed = true;
}

function pass(msg) {
  console.log(`verify-wiki: ${msg}`);
}

if (!fs.existsSync(wikiDir)) {
  fail('wiki/ directory missing');
  process.exit(1);
}

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(wikiDir, file))) {
    fail(`missing required file wiki/${file}`);
  }
}

if (failed) process.exit(1);

pass(`all ${REQUIRED_FILES.length} required files present`);

const allContent = REQUIRED_FILES.map((f) => ({ file: f, text: readWiki(f) }));

function sanitizeForSecretScan(text) {
  return text.replace(/\.env[\w.-]*/gi, '[env-file]');
}

for (const { file, text } of allContent) {
  const scanText = sanitizeForSecretScan(text);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(scanText)) {
      fail(`${file} matches forbidden pattern ${pattern}`);
    }
  }
  if (text.includes('<!-- AGENT:')) {
    fail(`${file} still contains stub marker`);
  }
}

const existing = new Set(listWikiFiles());

for (const { file, text } of allContent) {
  let match;
  WIKI_LINK_RE.lastIndex = 0;
  while ((match = WIKI_LINK_RE.exec(text)) !== null) {
    const target = wikiLinkToFilename(match[1]);
    if (!existing.has(target)) {
      fail(`${file} links to [[${match[1]}]] but wiki/${target} is missing`);
    }
  }
}

const home = readWiki('Home.md');
if (!/For users/i.test(home) || !/For developers/i.test(home)) {
  fail('Home.md must contain "For users" and "For developers" sections');
}
if (!/\[\[Getting-Started\]\]/.test(home) || !/\[\[Developer-Home\]\]/.test(home)) {
  fail('Home.md must link to [[Getting-Started]] and [[Developer-Home]]');
}

const sidebar = readWiki('_Sidebar.md');
for (const page of PAGE_FILES) {
  const base = page.replace(/\.md$/, '');
  if (!sidebar.includes(`[[${base}]]`)) {
    fail(`_Sidebar.md missing link to [[${base}]]`);
  }
}

if (failed) {
  console.error('verify-wiki: FAILED');
  process.exit(1);
}

pass('link graph, sidebar, Home sections, and secret scan OK');
process.exit(0);
