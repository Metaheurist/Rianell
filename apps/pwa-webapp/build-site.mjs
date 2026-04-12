/**
 * 1) Instrument first-party web JS (AST trace) in place or into .trace-build
 * 2) Minify app.js → content-hashed bundle + asset-manifest.json
 *
 * Usage:
 *   node apps/pwa-webapp/build-site.mjs
 *     mirrors apps/pwa-webapp/ to .trace-build/ with transforms, minifies to hashed app bundle
 *   node apps/pwa-webapp/build-site.mjs --site <dir>
 *     instruments all JS under dir in place (e.g. after cp -r pwa-webapp to site)
 *   node apps/pwa-webapp/build-site.mjs --skip-trace
 *     mirror without function-trace instrumentation (smaller bundle - use for APK / release)
 *
 * Env: RIANELL_SITE_DIR - same as --site (CI can set this)
 * Env: RIANELL_SKIP_FUNCTION_TRACE=1 - same as --skip-trace
 */
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformFileIfNeeded } from './build-plugins/function-trace-plugin.mjs';
import { buildAndroidDistBundle } from './build-android-dist.mjs';
import {
  fingerprintAppJs,
  fingerprintStylesheet,
  patchIndexHtml,
  removeOldFingerprintedBundles,
  removeOldFingerprintedStyles,
  writeAssetManifest,
} from './fingerprint-assets.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
/** Repository root (parent of apps/) */
const root = path.join(scriptDir, '..', '..');

function resolveWebRoot(repoRoot, currentScriptDir) {
  const candidates = [
    currentScriptDir,
    path.join(repoRoot, 'apps', 'pwa-webapp'),
    path.join(repoRoot, 'apps', 'web'),
    path.join(repoRoot, 'web'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'app.js'))) return dir;
  }
  return currentScriptDir;
}

/** PWA static app root (supports both current and legacy folder layouts). */
const webRoot = resolveWebRoot(root, scriptDir);

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
 * Mirror webRoot tree into outRoot. When instrumentJs is true, apply trace transform to each .js (or copy if excluded).
 */
function mirrorWeb(webRoot, outRoot, instrumentJs) {
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
        if (name.endsWith('.js') && instrumentJs) {
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
  let skipTrace = process.env.RIANELL_SKIP_FUNCTION_TRACE === '1';
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site' && args[i + 1]) {
      siteDir = args[i + 1];
      i++;
    } else if (args[i] === '--skip-trace') {
      skipTrace = true;
    }
  }
  return { siteDir: siteDir ? path.resolve(siteDir) : '', skipTrace };
}

const { siteDir, skipTrace } = parseArgs(process.argv);

if (siteDir) {
  if (!skipTrace) {
    console.log('[build-site] instrument in place:', siteDir);
    instrumentInPlace(siteDir);
  } else {
    console.log('[build-site] skip trace; minify only:', siteDir);
  }
  removeOldFingerprintedBundles(siteDir);
  removeOldFingerprintedStyles(siteDir);
  const appJs = path.join(siteDir, 'app.js');
  const appMin = path.join(siteDir, 'app.min.js');
  await esbuild.build({
    entryPoints: [appJs],
    outfile: appMin,
    minify: true,
    legalComments: 'none',
    logLevel: 'info',
  });
  const mainJs = fingerprintAppJs(siteDir);
  const mainCss = fingerprintStylesheet(siteDir);
  const manifest = { mainJs, mainCss: mainCss || undefined };
  writeAssetManifest(siteDir, manifest);
  patchIndexHtml(path.join(siteDir, 'index.html'), manifest);
  console.log(
    '[build-site] fingerprinted',
    mainJs + (mainCss ? `, ${mainCss}` : ''),
    '→',
    path.relative(root, siteDir)
  );
} else {
  const staging = path.join(webRoot, '.trace-build');
  if (skipTrace) {
    console.log('[build-site] mirror without trace →', path.relative(root, staging));
    mirrorWeb(webRoot, staging, false);
  } else {
    console.log('[build-site] mirror instrumented →', path.relative(root, staging));
    mirrorWeb(webRoot, staging, true);
  }
  const appJs = path.join(staging, 'app.js');
  if (!fs.existsSync(appJs)) {
    throw new Error(`[build-site] staging app.js missing at ${appJs} (webRoot=${webRoot})`);
  }
  const appMin = path.join(webRoot, 'app.min.js');
  removeOldFingerprintedBundles(webRoot);
  await esbuild.build({
    entryPoints: [appJs],
    outfile: appMin,
    minify: true,
    legalComments: 'none',
    logLevel: 'info',
  });
  const mainJs = fingerprintAppJs(webRoot);
  writeAssetManifest(webRoot, { mainJs });
  console.log('[build-site] wrote', mainJs, '→', path.relative(root, webRoot));
  if (skipTrace) {
    await buildAndroidDistBundle(webRoot);
  } else {
    rmrf(path.join(webRoot, '.android-dist'));
  }
}
