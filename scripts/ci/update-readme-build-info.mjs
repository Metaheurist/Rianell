#!/usr/bin/env node
/**
 * Replaces the block between <!-- RIANELL_BUILD_INFO_START --> and
 * <!-- RIANELL_BUILD_INFO_END --> in README.md with current CI + artifacts numbers.
 *
 * Tables:
 * - CI builds: **Server** uses workflow run number. **Web / PWA**
 *   row shows **GITHUB_RUN_NUMBER** (Pages deploy).
 *
 * Env: GITHUB_RUN_NUMBER, GITHUB_SHA, GITHUB_RUN_ID, GITHUB_REPOSITORY
 */
import fs from 'fs';
import path from 'path';

const START = '<!-- RIANELL_BUILD_INFO_START -->';
const END = '<!-- RIANELL_BUILD_INFO_END -->';

const readmePath = path.join(process.cwd(), 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');

if (!readme.includes(START) || !readme.includes(END)) {
  console.error('README.md must contain RIANELL_BUILD_INFO_START/END markers.');
  process.exit(1);
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
  } catch {
    return null;
  }
}

const run = process.env.GITHUB_RUN_NUMBER || 'local';
const sha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
const repo = process.env.GITHUB_REPOSITORY || 'Metaheurist/Rianell';
const runId = process.env.GITHUB_RUN_ID || '';
const runUrl = runId ? `https://github.com/${repo}/actions/runs/${runId}` : `https://github.com/${repo}/actions`;

const server = readJson(path.join('artifacts', 'Server', 'latest.json'));
const serverX64 = readJson(path.join('artifacts', 'Server', 'latest-x64.json'));
const serverX86 = readJson(path.join('artifacts', 'Server', 'latest-x86.json'));

const serverV = server && typeof server.version !== 'undefined' ? String(server.version) : '-';
const serverX64V = serverX64 && typeof serverX64.version !== 'undefined' ? String(serverX64.version) : serverV;
const serverX86V = serverX86 && typeof serverX86.version !== 'undefined' ? String(serverX86.version) : serverV;

const serverFile = server && server.file ? String(server.file) : 'latest.json';
const serverX64File = serverX64 && serverX64.file ? String(serverX64.file) : 'rianell-server-x64.exe';
const serverX86File = serverX86 && serverX86.file ? String(serverX86.file) : 'rianell-server-x86.exe';

const badgeHref = runId ? runUrl : `https://github.com/${repo}/actions`;
const summaryBadgeUrl = `https://img.shields.io/badge/build-Server%20${encodeURIComponent(serverV)}%20%7C%20Web%20${encodeURIComponent(run)}-2e7d32?style=flat-square`;
const BETA_BADGE = 'https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white';

const block = [
  START,
  '',
  `[![CI builds](${summaryBadgeUrl})](${badgeHref})`,
  '',
  '**CI builds** (server + web)',
  '',
  '| Channel | Build |',
  '| :--- | :---: |',
  `| ![Beta](${BETA_BADGE}) **Server** EXE (x64) | **${serverX64V}** |`,
  `| ![Beta](${BETA_BADGE}) **Server** EXE (x86) | **${serverX86V}** |`,
  `| ![Beta](${BETA_BADGE}) **Web / PWA** (GitHub Pages deploy) | **${run}** |`,
  '',
  `Latest: [\`artifacts/Server/${serverFile}\`](artifacts/Server/latest.json) · [\`artifacts/Server/${serverX64File}\`](artifacts/Server/latest-x64.json) · [\`artifacts/Server/${serverX86File}\`](artifacts/Server/latest-x86.json) · [Workflow #${run}](${runUrl}) · \`${sha}\``,
  '',
  END,
].join('\n');

const re = new RegExp(
  START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '[\\s\\S]*?' +
    END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  'm'
);

readme = readme.replace(re, block);
fs.writeFileSync(readmePath, readme);
console.log('README build info block updated.');
