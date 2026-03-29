/**
 * Merge downloaded benchmark artifacts into benchmarks/ (CI commit job).
 * Usage: node merge-benchmark-ci.mjs <webArtifactDir> <expoArtifactDir> [repoRoot]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateBenchmarkCompare } from './generate-benchmark-compare.mjs';
import { updateBenchmarksReadme } from './update-benchmarks-readme.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.argv[4] || path.resolve(__dirname, '..', '..');
const webRoot = path.resolve(process.argv[2] || '');
const expoRoot = path.resolve(process.argv[3] || '');
const out = path.join(repoRoot, 'benchmarks');

const HISTORY_MAX = 150;

function runDedupeKey(run) {
  const slug = run.slug || 'unknown';
  if (run.meta?.github_run_id) return `run:${run.meta.github_run_id}:${slug}`;
  return `local:${run.meta?.git_sha || ''}:${run.meta?.timestamp_utc || ''}:${slug}`;
}

/**
 * Prepend latest run into history.json (dedupe by CI run id or local sha+time).
 */
function mergeHistoryForSlug(slug, newRun) {
  const histPath = path.join(repoRoot, 'benchmarks', slug, 'history.json');
  let prev = [];
  if (fs.existsSync(histPath)) {
    try {
      prev = JSON.parse(fs.readFileSync(histPath, 'utf8'));
      if (!Array.isArray(prev)) prev = [];
    } catch {
      prev = [];
    }
  }
  const combined = [newRun, ...prev];
  const seen = new Set();
  const deduped = [];
  for (const r of combined) {
    const k = runDedupeKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(r);
    if (deduped.length >= HISTORY_MAX) break;
  }
  fs.mkdirSync(path.dirname(histPath), { recursive: true });
  fs.writeFileSync(histPath, JSON.stringify(deduped, null, 2), 'utf8');
  console.log('Updated history for', slug, 'entries:', deduped.length);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

fs.mkdirSync(out, { recursive: true });

for (const name of ['web-pwa', 'github-pages', 'capacitor-web']) {
  const s = path.join(webRoot, name);
  if (fs.existsSync(s)) {
    copyDir(s, path.join(out, name));
  }
}

const expoCandidates = [
  path.join(expoRoot, 'expo-rn'),
  path.join(expoRoot, 'benchmarks', 'expo-rn'),
  expoRoot,
];
let mergedExpo = false;
for (const c of expoCandidates) {
  if (fs.existsSync(path.join(c, 'latest.md'))) {
    fs.mkdirSync(path.join(out, 'expo-rn'), { recursive: true });
    if (c === expoRoot && !c.endsWith('expo-rn')) {
      fs.copyFileSync(path.join(c, 'latest.md'), path.join(out, 'expo-rn', 'latest.md'));
      const runJson = path.join(c, 'latest.run.json');
      if (fs.existsSync(runJson)) {
        fs.copyFileSync(runJson, path.join(out, 'expo-rn', 'latest.run.json'));
      }
    } else {
      copyDir(c, path.join(out, 'expo-rn'));
    }
    mergedExpo = true;
    break;
  }
}
if (!mergedExpo) {
  console.warn('merge-benchmark-ci: no expo-rn/latest.md found under', expoRoot);
}

const SLUGS = ['web-pwa', 'github-pages', 'capacitor-web', 'expo-rn'];
for (const slug of SLUGS) {
  const latestRun = path.join(out, slug, 'latest.run.json');
  if (!fs.existsSync(latestRun)) {
    console.warn('merge-benchmark-ci: skipping history — no', latestRun);
    continue;
  }
  try {
    const newRun = JSON.parse(fs.readFileSync(latestRun, 'utf8'));
    mergeHistoryForSlug(slug, newRun);
  } catch (e) {
    console.warn('merge-benchmark-ci: failed to merge history for', slug, e.message);
  }
}

generateBenchmarkCompare(repoRoot);
updateBenchmarksReadme();
console.log('Merged benchmark artifacts into', out);
