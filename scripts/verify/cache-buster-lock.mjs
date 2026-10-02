#!/usr/bin/env node
/**
 * Guards hand-maintained `?v=N` cache-busters in the PWA. GitHub Pages serves these
 * files with max-age caching, so changing one without bumping its `?v=` ships stale
 * code to returning users. app.js and styles.css are content-hashed by the build.
 *
 * Usage:
 *   node scripts/verify/cache-buster-lock.mjs           check (exit 1 on drift)
 *   node scripts/verify/cache-buster-lock.mjs --write   refresh the lock after bumping
 *   node scripts/verify/cache-buster-lock.mjs --bump summary-llm.js [more...]
 *                                                       bump every reference, then refresh
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(here, '..', '..');
export const WEB_ROOT = path.join(REPO_ROOT, 'apps', 'pwa-webapp');
export const LOCK_PATH = path.join(here, 'cache-buster-lock.json');

const FINGERPRINTED_BY_BUILD = new Set(['app.js', 'styles.css']);
const VERSIONED_REF_RE = /["'(]((?:\.\/)?[\w-]+(?:\/[\w.-]+)*\.(?:js|mjs|css))\?v=(\d+)/g;

function referenceSources(webRoot) {
  const files = [path.join(webRoot, 'index.html')];
  for (const dir of [webRoot, path.join(webRoot, 'modules')]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (/\.js$/.test(name) && !/\.min\.js$/.test(name)) files.push(path.join(dir, name));
    }
  }
  return files;
}

/** Line endings are normalised so Windows checkouts hash the same as CI. */
export function hashFile(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * @returns {{ assets: Record<string, { v: number, sha256: string }>, conflicts: string[] }}
 */
export function collectVersionedAssets(webRoot = WEB_ROOT) {
  const versions = new Map();
  const conflicts = [];
  for (const source of referenceSources(webRoot)) {
    const text = fs.readFileSync(source, 'utf8');
    for (const m of text.matchAll(VERSIONED_REF_RE)) {
      const asset = m[1].replace(/^\.\//, '');
      if (FINGERPRINTED_BY_BUILD.has(asset)) continue;
      if (!fs.existsSync(path.join(webRoot, asset))) continue;
      const v = Number(m[2]);
      const where = path.relative(webRoot, source).replace(/\\/g, '/');
      const seen = versions.get(asset);
      if (seen && seen.v !== v) {
        conflicts.push(`${asset}: ?v=${seen.v} in ${seen.where} but ?v=${v} in ${where}`);
      } else if (!seen) {
        versions.set(asset, { v, where });
      }
    }
  }
  const assets = {};
  for (const asset of [...versions.keys()].sort()) {
    assets[asset] = { v: versions.get(asset).v, sha256: hashFile(path.join(webRoot, asset)) };
  }
  return { assets, conflicts };
}

/**
 * Increment `asset?v=N` on every reference (index.html and first-party JS).
 * @returns {{ from: number, to: number, files: string[] }}
 */
export function bumpAsset(asset, webRoot = WEB_ROOT) {
  const { assets } = collectVersionedAssets(webRoot);
  if (!assets[asset]) throw new Error(`${asset} has no ?v= reference`);
  const from = assets[asset].v;
  const to = from + 1;
  const escaped = asset.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const re = new RegExp(`(["'(](?:\\./)?)${escaped}\\?v=${from}(?!\\d)`, 'g');
  const files = [];
  for (const source of referenceSources(webRoot)) {
    const text = fs.readFileSync(source, 'utf8');
    const next = text.replace(re, `$1${asset}?v=${to}`);
    if (next !== text) {
      fs.writeFileSync(source, next);
      files.push(path.relative(webRoot, source).replace(/\\/g, '/'));
    }
  }
  return { from, to, files };
}

export function readLock(lockPath = LOCK_PATH) {
  return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
}

/**
 * @returns {string[]} human-readable problems; empty when the lock is in sync.
 */
export function checkLock(current, lock) {
  const problems = [...current.conflicts];
  for (const [asset, now] of Object.entries(current.assets)) {
    const locked = lock[asset];
    if (!locked) {
      problems.push(`${asset}: not in the lock - run the --write command`);
    } else if (locked.sha256 !== now.sha256 && locked.v === now.v) {
      problems.push(`${asset}: content changed but ?v=${now.v} was not bumped`);
    } else if (locked.sha256 !== now.sha256 || locked.v !== now.v) {
      problems.push(`${asset}: ?v= bumped to ${now.v} - refresh the lock with the --write command`);
    }
  }
  for (const asset of Object.keys(lock)) {
    if (!current.assets[asset]) problems.push(`${asset}: no longer referenced - refresh the lock`);
  }
  return problems;
}

function main() {
  const bumpIdx = process.argv.indexOf('--bump');
  if (bumpIdx >= 0) {
    const targets = process.argv.slice(bumpIdx + 1).filter((a) => !a.startsWith('--'));
    if (!targets.length) {
      console.error('Usage: node scripts/verify/cache-buster-lock.mjs --bump <asset> [...]');
      process.exit(1);
    }
    for (const asset of targets) {
      const { from, to, files } = bumpAsset(asset);
      console.log(`cache-buster-lock: ${asset} ?v=${from} -> ?v=${to} in ${files.join(', ')}`);
    }
  }
  const current = collectVersionedAssets();
  if (bumpIdx >= 0 || process.argv.includes('--write')) {
    if (current.conflicts.length) {
      console.error(current.conflicts.join('\n'));
      process.exit(1);
    }
    fs.writeFileSync(LOCK_PATH, `${JSON.stringify(current.assets, null, 2)}\n`);
    console.log(`cache-buster-lock: wrote ${Object.keys(current.assets).length} assets`);
    return;
  }
  const problems = checkLock(current, readLock());
  if (problems.length) {
    console.error(`cache-buster-lock: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
    console.error('Fix with: node scripts/verify/cache-buster-lock.mjs --bump <asset> (or --write after a manual bump)');
    process.exit(1);
  }
  console.log(`cache-buster-lock: ${Object.keys(current.assets).length} assets in sync`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
