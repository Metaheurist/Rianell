/**
 * 1) Instrument first-party web JS (AST trace) in place or into .trace-build
 * 2) Minify app.js to app.min.js
 *
 * Usage:
 *   node web/build-site.mjs
 *     mirrors web/ to web/.trace-build/ with transforms, minifies to web/app.min.js
 *   node web/build-site.mjs --site <dir>
 *     instruments all JS under dir in place (e.g. after cp -r web to site)
 *
 * Env: RIANELL_SITE_DIR — same as --site (CI can set this)
 */
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformFileIfNeeded } from './build-plugins/function-trace-plugin.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function walkJsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.trace-build') continue;
      walkJsFiles(p, acc);
    } else if (name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Mirror webRoot tree into outRoot, applying trace transform to each .js (or copy if excluded).
 */
function mirrorInstrumentedWeb(webRoot, outRoot) {
  rmrf(outRoot);
  function walkCopy(rel) {
    const srcDir = path.join(webRoot, rel);
    if (!fs.existsSync(srcDir)) return;
    for (const name of fs.readdirSync(srcDir)) {
      const src = path.join(srcDir, name);
      const st = fs.statSync(src);
      const dest = path.join(outRoot, rel, name);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '.trace-build') continue;
        walkCopy(path.join(rel, name));
      } else {
        mkdirp(path.dirname(dest));
        if (name.endsWith('.js')) {
          const transformed = transformFileIfNeeded(src, webRoot);
          if (transformed !== undefined) fs.writeFileSync(dest, transformed, 'utf8');
          else fs.copyFileSync(src, dest);
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    }
  }
  walkCopy('');
}

/**
 * Transform all .js under targetDir in place.
 */
function instrumentInPlace(targetDir) {
  const files = walkJsFiles(targetDir);
  for (const abs of files) {
    const t = transformFileIfNeeded(abs, targetDir);
    if (t !== undefined) fs.writeFileSync(abs, t, 'utf8');
  }
}

function parseArgs(argv) {
  let siteDir = process.env.RIANELL_SITE_DIR || '';
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site' && args[i + 1]) {
      siteDir = args[i + 1];
      i++;
    }
  }
  return { siteDir: siteDir ? path.resolve(siteDir) : '' };
}

const { siteDir } = parseArgs(process.argv);
const webRoot = path.join(root, 'web');

if (siteDir) {
  console.log('[build-site] instrument in place:', siteDir);
  instrumentInPlace(siteDir);
  const appJs = path.join(siteDir, 'app.js');
  const appMin = path.join(siteDir, 'app.min.js');
  await esbuild.build({
    entryPoints: [appJs],
    outfile: appMin,
    minify: true,
    legalComments: 'none',
    logLevel: 'info',
  });
  console.log('Wrote', path.relative(root, appMin));
} else {
  const staging = path.join(webRoot, '.trace-build');
  console.log('[build-site] mirror instrumented →', path.relative(root, staging));
  mirrorInstrumentedWeb(webRoot, staging);
  const appJs = path.join(staging, 'app.js');
  const appMin = path.join(webRoot, 'app.min.js');
  await esbuild.build({
    entryPoints: [appJs],
    outfile: appMin,
    minify: true,
    legalComments: 'none',
    logLevel: 'info',
  });
  console.log('Wrote web/app.min.js');
}
