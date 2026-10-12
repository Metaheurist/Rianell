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

function redact(text) {
  return ciToken ? String(text).split(ciToken).join('***') : String(text);
}

function run(file, cmdArgs, opts = {}) {
  const result = spawnSync(file, cmdArgs, {
    cwd: opts.cwd || root,
    encoding: 'utf8',
    stdio: opts.quiet ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    const detail = result.error?.message || result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`;
    throw new Error(redact(`Command failed: ${[file, ...cmdArgs].join(' ')}\n${detail}`));
  }
  return result.stdout?.trim() ?? '';
}

function git(cmdArgs, opts) {
  return run('git', ['-C', wikiClone, ...cmdArgs], opts);
}

function gitQuiet(cmdArgs) {
  return git(cmdArgs, { quiet: true });
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
      gitQuiet(['rev-parse', '--verify', `origin/${branch}`]);
      return branch;
    } catch {
      /* try next */
    }
  }
  try {
    const sym = gitQuiet(['symbolic-ref', 'refs/remotes/origin/HEAD']);
    return sym.replace('refs/remotes/origin/', '');
  } catch {
    return 'master';
  }
}

function ensureClone() {
  if (!fs.existsSync(wikiClone)) {
    console.log(`Cloning ${WIKI_REMOTE} → .wiki-sync/`);
    run('git', ['clone', WIKI_REMOTE, wikiClone]);
    return;
  }
  git(['fetch', 'origin']);
  const branch = detectDefaultBranch();
  git(['checkout', branch]);
  git(['reset', '--hard', `origin/${branch}`]);
}

function configureCiRemote() {
  if (!ciToken) return;
  const authed = `https://x-access-token:${encodeURIComponent(ciToken)}@github.com/Metaheurist/Rianell.wiki.git`;
  git(['remote', 'set-url', 'origin', authed]);
}

function configureGitIdentity() {
  const name = process.env.GIT_COMMITTER_NAME || process.env.GIT_AUTHOR_NAME || 'Metaheurist';
  const email =
    process.env.GIT_COMMITTER_EMAIL ||
    process.env.GIT_AUTHOR_EMAIL ||
    'Onceuponablock@hotmail.com';
  git(['config', 'user.name', name]);
  git(['config', 'user.email', email]);
}

function main() {
  if (!fs.existsSync(wikiSource) || !fs.existsSync(path.join(wikiSource, 'Home.md'))) {
    console.error('sync-wiki: wiki/Home.md is required');
    process.exit(1);
  }

  if (!skipVerify) {
    console.log('Running verify-wiki…');
    run(process.execPath, ['scripts/wiki/verify-wiki.mjs']);
  }

  ensureClone();
  configureCiRemote();

  const copied = copyWikiSources();
  console.log(`Copied ${copied.length} markdown file(s) to .wiki-sync/`);

  git(['add', '-A']);

  const diff = gitQuiet(['diff', '--staged', '--name-only']);
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
  git(['commit', '-m', commitMessage]);
  const hash = gitQuiet(['rev-parse', '--short', 'HEAD']);
  git(['push', 'origin', 'HEAD']);

  console.log(`Pushed wiki commit ${hash}`);
  console.log(`Live: ${WIKI_LIVE_URL}/Home`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
