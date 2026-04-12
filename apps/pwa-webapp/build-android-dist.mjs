/**
 * Produces apps/pwa-webapp/.android-dist/ — a full copy with first-party JS/CSS minified
 * and index.html pointing at content-hashed app + styles bundles. Used by
 * apps/capacitor-app/copy-webapp.js --min for Capacitor Android/iOS.
 *
 * Run after build-site.mjs --skip-trace (writes asset-manifest.json + app.<hash>.min.js).
 */
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyBundleNamesToHtml, contentHash } from './fingerprint-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const SKIP_DIRS = new Set(['.trace-build', '.android-dist', 'build-plugins', 'node_modules']);
/** Build tooling at web root — not part of the shipped app */
const SKIP_FILES = new Set(['build-site.mjs', 'build-android-dist.mjs', 'fingerprint-assets.mjs']);

/** Already minified / special — copy as-is */
function isPreMinifiedJs(name) {
  if (name === 'apexcharts.min.js') return true;
  if (name === 'app.min.js') return true;
  return /^app\.[0-9a-f]+\.min\.js$/i.test(name);
}

function loadManifestMainJs(webRoot) {
  const p = path.join(webRoot, 'asset-manifest.json');
  if (!fs.existsSync(p)) return 'app.min.js';
  try {
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (m.mainJs && typeof m.mainJs === 'string') return m.mainJs;
  } catch (_) {}
  return 'app.min.js';
}

export async function buildAndroidDistBundle(webRoot) {
  const outRoot = path.join(webRoot, '.android-dist');
  rmrf(outRoot);
  mkdirp(outRoot);

  const distMainJs = loadManifestMainJs(webRoot);

  let stylesPrepared = null;
  const stylesPath = path.join(webRoot, 'styles.css');
  if (fs.existsSync(stylesPath)) {
    const code = fs.readFileSync(stylesPath, 'utf8');
    const r = await esbuild.transform(code, {
      loader: 'css',
      minify: true,
    });
    const body = r.code;
    const fname = `styles.${contentHash(Buffer.from(body, 'utf8'))}.css`;
    stylesPrepared = { fname, body };
  }
  const distMainCss = stylesPrepared ? stylesPrepared.fname : null;

  async function minifyJs(absIn, relOut) {
    const code = fs.readFileSync(absIn, 'utf8');
    const r = await esbuild.transform(code, {
      loader: 'js',
      minify: true,
      legalComments: 'none',
    });
    const dest = path.join(outRoot, relOut);
    mkdirp(path.dirname(dest));
    fs.writeFileSync(dest, r.code, 'utf8');
  }

  async function minifyCss(absIn, relOut) {
    const code = fs.readFileSync(absIn, 'utf8');
    const r = await esbuild.transform(code, {
      loader: 'css',
      minify: true,
    });
    const dest = path.join(outRoot, relOut);
    mkdirp(path.dirname(dest));
    fs.writeFileSync(dest, r.code, 'utf8');
  }

  function copyFile(absIn, relOut) {
    const dest = path.join(outRoot, relOut);
    mkdirp(path.dirname(dest));
    fs.copyFileSync(absIn, dest);
  }

  async function walk(rel = '') {
    const dir = path.join(webRoot, rel);
    if (!fs.existsSync(dir)) return;
    const names = fs.readdirSync(dir);
    for (const name of names) {
      if (SKIP_DIRS.has(name)) continue;
      if (SKIP_FILES.has(name)) continue;
      const abs = path.join(dir, name);
      const st = fs.statSync(abs);
      const relP = rel ? path.join(rel, name) : name;
      if (st.isDirectory()) {
        await walk(relP);
        continue;
      }
      if (name === 'app.js') continue;
      if (name === 'styles.css' && stylesPrepared) {
        const dest = path.join(outRoot, stylesPrepared.fname);
        mkdirp(path.dirname(dest));
        fs.writeFileSync(dest, stylesPrepared.body, 'utf8');
        continue;
      }
      if (isPreMinifiedJs(name)) {
        copyFile(abs, relP);
        continue;
      }
      if (name.endsWith('.js')) {
        await minifyJs(abs, relP);
        continue;
      }
      if (name.endsWith('.css')) {
        await minifyCss(abs, relP);
        continue;
      }
      if (name === 'index.html') {
        let html = fs.readFileSync(abs, 'utf8');
        html = applyBundleNamesToHtml(html, { mainJs: distMainJs, mainCss: distMainCss });
        const dest = path.join(outRoot, relP);
        mkdirp(path.dirname(dest));
        fs.writeFileSync(dest, html, 'utf8');
        continue;
      }
      copyFile(abs, relP);
    }
  }

  await walk('');
  console.log('[build-android-dist] wrote', path.relative(repoRoot, outRoot));
}
