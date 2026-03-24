/**
 * 1) Instrument first-party web JS (AST trace) in place or into .trace-build
 * 2) Minify app.js to app.min.js (+ selected standalone AI/LLM JS in --site mode)
 *
 * Usage:
 *   node web/build-site.mjs
 *     mirrors web/ to web/.trace-build/ with transforms, minifies to web/app.min.js
 *   node web/build-site.mjs --site <dir>
 *     instruments all JS under dir in place (e.g. after cp -r web to site)
 *   node web/build-site.mjs --skip-trace
 *     mirror web/ without function-trace instrumentation (smaller app.min.js - use for APK / release)
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

async function minifyFileInPlace(absPath) {
  const code = fs.readFileSync(absPath, 'utf8');
  const r = await esbuild.transform(code, {
    loader: 'js',
    minify: true,
    legalComments: 'none',
  });
  fs.writeFileSync(absPath, r.code, 'utf8');
}

async function minifyStandaloneAiFilesInSite(siteDirAbs) {
  const files = walkJsFiles(siteDirAbs);
  const minified = [];
  for (const abs of files) {
    const base = path.basename(abs);
    const lower = base.toLowerCase();
    if (lower === 'app.js' || lower === 'app.min.js') continue;
    // Keep already-minified vendor files as-is.
    if (lower.endsWith('.min.js')) continue;
    // Include AI engine + any LLM-named entrypoints (e.g., summary-llm.js).
    if (base === 'AIEngine.js' || lower.includes('llm')) {
      await minifyFileInPlace(abs);
      minified.push(path.relative(root, abs));
    }
  }
  return minified;
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
const webRoot = path.join(root, 'web');

if (siteDir) {
  if (!skipTrace) {
    console.log('[build-site] instrument in place:', siteDir);
    instrumentInPlace(siteDir);
  } else {
    console.log('[build-site] skip trace; minify only:', siteDir);
  }
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
  const aiFiles = await minifyStandaloneAiFilesInSite(siteDir);
  if (aiFiles.length) {
    console.log('[build-site] minified standalone AI/LLM files:');
    for (const f of aiFiles) console.log('  -', f);
  }
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
  const appMin = path.join(webRoot, 'app.min.js');
  await esbuild.build({
    entryPoints: [appJs],
    outfile: appMin,
    minify: true,
    legalComments: 'none',
    logLevel: 'info',
  });
  console.log('Wrote web/app.min.js');
  if (skipTrace) {
    await buildAndroidDistBundle(webRoot);
  } else {
    rmrf(path.join(webRoot, '.android-dist'));
  }
}
