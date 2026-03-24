/**
 * Produces web/.android-dist/ — a full copy of web/ with first-party JS/CSS minified
 * and index.html pointing at app.min.js. Used by react-app/copy-webapp.js --min for
 * Capacitor Android/iOS (smaller parse/load than shipping raw sources).
 *
 * Run after web/app.min.js exists (see build-site.mjs --skip-trace).
 */
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const SKIP_DIRS = new Set(['.trace-build', '.android-dist', 'build-plugins', 'node_modules']);
/** Build tooling at web root — not part of the shipped app */
const SKIP_FILES = new Set(['build-site.mjs', 'build-android-dist.mjs']);

/** Already minified / special — copy as-is */
function isPreMinifiedJs(name) {
  return name === 'apexcharts.min.js' || name === 'app.min.js';
}

export async function buildAndroidDistBundle(webRoot) {
  const outRoot = path.join(webRoot, '.android-dist');
  rmrf(outRoot);
  mkdirp(outRoot);

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
        html = html.replace(/src="app\.js(\?[^"]*)?"/g, 'src="app.min.js$1"');
        html = html.replace(/href="app\.js(\?[^"]*)?"/g, 'href="app.min.js$1"');
        const dest = path.join(outRoot, relP);
        mkdirp(path.dirname(dest));
        fs.writeFileSync(dest, html, 'utf8');
        continue;
      }
      copyFile(abs, relP);
    }
  }

  await walk('');
  console.log('[build-android-dist] wrote', path.relative(path.join(__dirname, '..'), outRoot));
}
