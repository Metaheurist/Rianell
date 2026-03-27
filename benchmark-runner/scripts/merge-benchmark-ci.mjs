/**
 * Merge downloaded benchmark artifacts into Benchmarks/ (CI commit job).
 * Usage: node merge-benchmark-ci.mjs <webArtifactDir> <expoArtifactDir> [repoRoot]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateBenchmarksReadme } from './update-benchmarks-readme.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.argv[4] || path.resolve(__dirname, '..', '..');
const webRoot = path.resolve(process.argv[2] || '');
const expoRoot = path.resolve(process.argv[3] || '');
const out = path.join(repoRoot, 'Benchmarks');

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
  path.join(expoRoot, 'Benchmarks', 'expo-rn'),
  expoRoot,
];
let mergedExpo = false;
for (const c of expoCandidates) {
  if (fs.existsSync(path.join(c, 'latest.md'))) {
    fs.mkdirSync(path.join(out, 'expo-rn'), { recursive: true });
    if (c === expoRoot && !c.endsWith('expo-rn')) {
      fs.copyFileSync(path.join(c, 'latest.md'), path.join(out, 'expo-rn', 'latest.md'));
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

updateBenchmarksReadme();
console.log('Merged benchmark artifacts into', out);
