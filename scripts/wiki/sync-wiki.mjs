#!/usr/bin/env node
/**
 * Sync wiki/ from main repo to GitHub Wiki git repo via git CLI.
 *
 * Usage:
 *   node scripts/wiki/sync-wiki.mjs [--dry-run] [--skip-verify] [--prune]
 *   node scripts/wiki/sync-wiki.mjs --ci-token "$WIKI_PUSH_TOKEN" [--message "msg"]
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const WIKI_REMOTE = 'https://github.com/Metaheurist/Rianell.wiki.git';
const WIKI_LIVE_URL = 'https://github.com/Metaheurist/Rianell/wiki';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipVerify = args.includes('--skip-verify');
const prune = args.includes('--prune');
const ciTokenIdx = args.indexOf('--ci-token');
const ciToken = ciTokenIdx >= 0 ? args[ciTokenIdx + 1] : process.env.WIKI_PUSH_TOKEN || '';
const msgIdx = args.indexOf('--message');
const commitMessage =
  msgIdx >= 0 ? args[msgIdx + 1] : 'docs(wiki): sync from main repo wiki/ [skip ci]';

const root = process.cwd();
const wikiSource = path.join(root, 'wiki');
const wikiClone = path.join(root, '.wiki-sync');

function run(cmd, opts = {}) {
  const result = spawnSync(cmd, {
    shell: true,
    cwd: opts.cwd || root,
    encoding: 'utf8',
    stdio: opts.quiet ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`;
    throw new Error(`Command failed: ${cmd}\n${detail}`);
  }
  return result.stdout?.trim() ?? '';
}

function runQuiet(cmd, cwd) {
  return run(cmd, { cwd, quiet: true });
}

function copyWikiSources() {
  const files = fs.readdirSync(wikiSource).filter((f) => f.endsWith('.md'));
  if (!files.length) throw new Error('No .md files in wiki/');
  for (const file of files) {
    fs.copyFileSync(path.join(wikiSource, file), path.join(wikiClone, file));
  }
  if (prune) {
    const allowed = new Set(files);
    for (const file of fs.readdirSync(wikiClone)) {
      if (file.endsWith('.md') && !allowed.has(file)) {
        fs.unlinkSync(path.join(wikiClone, file));
      }
    }
  }
  return files;
}

function detectDefaultBranch() {
  for (const branch of ['master', 'main']) {
    try {
      runQuiet(`git -C "${wikiClone}" rev-parse --verify origin/${branch}`);
      return branch;
    } catch {
      /* try next */
    }
  }
  try {
    const sym = runQuiet(`git -C "${wikiClone}" symbolic-ref refs/remotes/origin/HEAD`);
    return sym.replace('refs/remotes/origin/', '');
  } catch {
    return 'master';
  }
}

function ensureClone() {
  if (!fs.existsSync(wikiClone)) {
    console.log(`Cloning ${WIKI_REMOTE} → .wiki-sync/`);
    run(`git clone "${WIKI_REMOTE}" "${wikiClone}"`);
    return;
  }
  run(`git -C "${wikiClone}" fetch origin`);
  const branch = detectDefaultBranch();
  run(`git -C "${wikiClone}" checkout ${branch}`);
  run(`git -C "${wikiClone}" reset --hard origin/${branch}`);
}

function configureCiRemote() {
  if (!ciToken) return;
  const authed = `https://x-access-token:${ciToken}@github.com/Metaheurist/Rianell.wiki.git`;
  run(`git -C "${wikiClone}" remote set-url origin "${authed}"`);
}

function configureGitIdentity() {
  const name = process.env.GIT_COMMITTER_NAME || process.env.GIT_AUTHOR_NAME || 'github-actions[bot]';
  const email =
    process.env.GIT_COMMITTER_EMAIL ||
    process.env.GIT_AUTHOR_EMAIL ||
    'github-actions[bot]@users.noreply.github.com';
  run(`git -C "${wikiClone}" config user.name "${name.replace(/"/g, '\\"')}"`);
  run(`git -C "${wikiClone}" config user.email "${email.replace(/"/g, '\\"')}"`);
}

function main() {
  if (!fs.existsSync(wikiSource) || !fs.existsSync(path.join(wikiSource, 'Home.md'))) {
    console.error('sync-wiki: wiki/Home.md is required');
    process.exit(1);
  }

  if (!skipVerify) {
    console.log('Running verify-wiki…');
    run('node scripts/wiki/verify-wiki.mjs');
  }

  ensureClone();
  configureCiRemote();

  const copied = copyWikiSources();
  console.log(`Copied ${copied.length} markdown file(s) to .wiki-sync/`);

  run(`git -C "${wikiClone}" add -A`);

  const diff = runQuiet(`git -C "${wikiClone}" diff --staged --name-only`);
  if (!diff) {
    console.log('Wiki already up to date — nothing to push.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('Dry run — staged changes:');
    console.log(diff);
    console.log(`Would commit: ${commitMessage}`);
    console.log(`Live URL: ${WIKI_LIVE_URL}/Home`);
    process.exit(0);
  }

  configureGitIdentity();
  run(`git -C "${wikiClone}" commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
  const hash = runQuiet(`git -C "${wikiClone}" rev-parse --short HEAD`);
  run(`git -C "${wikiClone}" push origin HEAD`);

  console.log(`Pushed wiki commit ${hash}`);
  console.log(`Live: ${WIKI_LIVE_URL}/Home`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
