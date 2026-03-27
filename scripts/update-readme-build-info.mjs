#!/usr/bin/env node
/**
 * Replaces the block between <!-- RIANELL_BUILD_INFO_START --> and
 * <!-- RIANELL_BUILD_INFO_END --> in README.md with current CI + App build numbers.
 *
 * Tables:
 * - CI builds: React Native CLI (Alpha) + Server + Web — versions from App build JSON + workflow run.
 * - Legacy builds: Capacitor Android (Beta) + legacy Capacitor iOS zip metadata (Alpha) — frozen paths.
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

function v(j) {
  if (!j || typeof j.version === 'undefined' || j.version === null) return '—';
  return String(j.version);
}

const run = process.env.GITHUB_RUN_NUMBER || 'local';
const sha = (process.env.GITHUB_SHA || 'local').slice(0, 7);
const repo = process.env.GITHUB_REPOSITORY || 'Metaheurist/Rianell';
const runId = process.env.GITHUB_RUN_ID || '';
const runUrl = runId ? `https://github.com/${repo}/actions/runs/${runId}` : `https://github.com/${repo}/actions`;

const rnAndroid = readJson(path.join('App build', 'RNCLI-Android', 'latest.json'));
const rnIos = readJson(path.join('App build', 'iOS', 'latest.json'));
const legacyAndroid = readJson(path.join('App build', 'Android', 'latest.json'));
const legacyCapIos = readJson(path.join('App build', 'Legacy', 'Capacitor-iOS', 'latest.json'));

const server = readJson(path.join('App build', 'Server', 'latest.json'));
const serverX64 = readJson(path.join('App build', 'Server', 'latest-x64.json'));
const serverX86 = readJson(path.join('App build', 'Server', 'latest-x86.json'));

const rnAndroidV = v(rnAndroid);
const rnIosV = v(rnIos);
const legacyAndroidV = v(legacyAndroid);
const legacyIosV = v(legacyCapIos);

const serverV = server && typeof server.version !== 'undefined' ? String(server.version) : '-';
const serverX64V = serverX64 && typeof serverX64.version !== 'undefined' ? String(serverX64.version) : serverV;
const serverX86V = serverX86 && typeof serverX86.version !== 'undefined' ? String(serverX86.version) : serverV;

const rnAndroidFile = rnAndroid && rnAndroid.file ? String(rnAndroid.file) : 'latest.json';
const rnIosFile = rnIos && rnIos.file ? String(rnIos.file) : 'latest.json';
const legacyAndroidFile = legacyAndroid && legacyAndroid.file ? String(legacyAndroid.file) : 'latest.json';
const legacyIosFile = legacyCapIos && legacyCapIos.file ? String(legacyCapIos.file) : 'latest.json';

const serverFile = server && server.file ? String(server.file) : 'latest.json';
const serverX64File = serverX64 && serverX64.file ? String(serverX64.file) : 'rianell-server-x64.exe';
const serverX86File = serverX86 && serverX86.file ? String(serverX86.file) : 'rianell-server-x86.exe';

const badgeHref = runId ? runUrl : `https://github.com/${repo}/actions`;
// Summary: RN Alpha builds + server + web workflow run
const summaryBadgeUrl = `https://img.shields.io/badge/build-RN%20${encodeURIComponent(rnAndroidV)}%20%7C%20RN%20iOS%20${encodeURIComponent(rnIosV)}%20%7C%20Server%20${encodeURIComponent(serverV)}%20%7C%20Web%20${encodeURIComponent(run)}-2e7d32?style=flat-square`;
const BETA_BADGE = 'https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white';
const ALPHA_BADGE = 'https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white';

const block = [
  START,
  '',
  `[![CI builds](${summaryBadgeUrl})](${badgeHref})`,
  '',
  '**CI builds** (React Native CLI + server + web)',
  '',
  '| Channel | Build |',
  '| :--- | :---: |',
  `| ![Alpha](${ALPHA_BADGE}) **Android** APK (React Native CLI) | **${rnAndroidV}** |`,
  `| ![Alpha](${ALPHA_BADGE}) **iOS** (Xcode project zip, RN CLI) | **${rnIosV}** |`,
  `| ![Beta](${BETA_BADGE}) **Server** EXE (x64) | **${serverX64V}** |`,
  `| ![Beta](${BETA_BADGE}) **Server** EXE (x86) | **${serverX86V}** |`,
  `| ![Beta](${BETA_BADGE}) **Web / PWA** (GitHub Pages deploy) | **${run}** |`,
  '',
  '**Legacy builds** (Capacitor — no longer produced by CI; metadata only)',
  '',
  '| Channel | Build |',
  '| :--- | :---: |',
  `| ![Beta](${BETA_BADGE}) **Android** APK (Capacitor) | **${legacyAndroidV}** |`,
  `| ![Alpha](${ALPHA_BADGE}) **iOS** (Xcode project zip, Capacitor) | **${legacyIosV}** |`,
  '',
  `Latest: [\`App build/RNCLI-Android/${rnAndroidFile}\`](App%20build/RNCLI-Android/latest.json) · [\`App build/iOS/${rnIosFile}\`](App%20build/iOS/latest.json) · [\`App build/Server/${serverFile}\`](App%20build/Server/latest.json) · [\`App build/Server/${serverX64File}\`](App%20build/Server/latest-x64.json) · [\`App build/Server/${serverX86File}\`](App%20build/Server/latest-x86.json) · legacy Capacitor Android [\`App build/Android/${legacyAndroidFile}\`](App%20build/Android/latest.json) · legacy Capacitor iOS [\`App build/Legacy/Capacitor-iOS/${legacyIosFile}\`](App%20build/Legacy/Capacitor-iOS/latest.json) · [Workflow #${run}](${runUrl}) · \`${sha}\``,
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
