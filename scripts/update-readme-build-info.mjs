#!/usr/bin/env node
/**
 * Replaces the block between <!-- RIANELL_BUILD_INFO_START --> and
 * <!-- RIANELL_BUILD_INFO_END --> in README.md with current CI + App build numbers.
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

const android = readJson(path.join('App build', 'Android', 'latest.json'));
const ios = readJson(path.join('App build', 'iOS', 'latest.json'));

const androidV = android && typeof android.version !== 'undefined' ? String(android.version) : '—';
const iosV = ios && typeof ios.version !== 'undefined' ? String(ios.version) : '—';

const androidFile = android && android.file ? String(android.file) : 'latest.json';
const iosFile = ios && ios.file ? String(ios.file) : 'latest.json';

const badgeHref = runId ? runUrl : `https://github.com/${repo}/actions`;
// Badge order: Alpha (iOS) first, then Beta (Android, Web). Matches table below.
const summaryBadgeUrl = `https://img.shields.io/badge/build-iOS%20${encodeURIComponent(iosV)}%20%7C%20Android%20${encodeURIComponent(androidV)}%20%7C%20Web%20${encodeURIComponent(run)}-2e7d32?style=flat-square`;
// Orange = Beta (Android, Web); blue = Alpha (iOS native zip) — shields named colors render reliably.
const BETA_BADGE = 'https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white';
const ALPHA_BADGE = 'https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white';

const block = [
  START,
  '',
  `[![CI builds](${summaryBadgeUrl})](${badgeHref})`,
  '',
  '**CI builds**',
  '',
  '| Channel | Build |',
  '| :--- | :---: |',
  `| ![Alpha](${ALPHA_BADGE}) **iOS** (Xcode project zip) | **${iosV}** |`,
  `| ![Beta](${BETA_BADGE}) **Android** APK | **${androidV}** |`,
  `| ![Beta](${BETA_BADGE}) **Web / PWA** (GitHub Pages deploy) | **${run}** |`,
  '',
  `Latest: [\`App build/Android/${androidFile}\`](App%20build/Android/latest.json) · [\`App build/iOS/${iosFile}\`](App%20build/iOS/latest.json) · [Workflow #${run}](${runUrl}) · \`${sha}\``,
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
