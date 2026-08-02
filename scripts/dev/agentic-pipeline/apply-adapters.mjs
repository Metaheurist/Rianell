/**
 * Pack-specific apply adapters. Never called automatically from pack-runner.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../../../packages/shared/src/i18n/packPaths.mjs';
import {
  appendApprovalLog,
  readProposal,
  writeProposal,
} from './proposal.mjs';
import { ensureDir, packDir, ROOT, readPackState, writePackState } from './state.mjs';
import { gitCommitOnApprove } from './git-commit-on-approve.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';

function npmRun(script, extraArgs = []) {
  const res = silentSpawnSync('npm', ['run', script, ...extraArgs], {
    cwd: ROOT,
    env: process.env,
  });
  return {
    ok: res.status === 0,
    code: res.status,
    stdout: String(res.stdout || '').slice(0, 4000),
    stderr: String(res.stderr || '').slice(0, 2000),
  };
}

function writeAck(packId, items) {
  const dir = path.join(packDir(packId), 'approved');
  ensureDir(dir);
  const body = [
    `# Approved ack — ${packId}`,
    '',
    ...items.map((it) => `- ${it.title}`),
    '',
  ].join('\n');
  const file = path.join(dir, 'ACK.md');
  fs.writeFileSync(file, body);
  return [path.relative(ROOT, file).replace(/\\/g, '/')];
}

function writeApprovedArtifact(packId, items) {
  const dir = path.join(packDir(packId), 'approved');
  ensureDir(dir);
  const file = path.join(dir, 'approved-actions.md');
  const body = [
    `# Approved actions — ${packId}`,
    '',
    ...items.map((it) => `## ${it.title}\n\n${it.detail || ''}\n`),
  ].join('\n');
  fs.writeFileSync(file, body);
  return [path.relative(ROOT, file).replace(/\\/g, '/')];
}

function applyI18nFill(packId, items) {
  const proposeDir = path.join(packDir(packId), 'fill-proposals');
  const packsDir = canonicalLocalePacksDir(ROOT);
  const written = [];
  const byLocale = new Map();
  for (const it of items) {
    if (it.kind !== 'i18n_string' || !it.locale || !it.key || it.proposed == null) continue;
    if (!byLocale.has(it.locale)) byLocale.set(it.locale, []);
    byLocale.get(it.locale).push(it);
  }
  for (const [locale, list] of byLocale) {
    const filePath = path.join(packsDir, `${locale}.json`);
    if (!fs.existsSync(filePath)) continue;
    const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    pack.strings = pack.strings || {};
    for (const it of list) {
      pack.strings[it.key] = it.proposed;
    }
    fs.writeFileSync(filePath, `${JSON.stringify(pack, null, 2)}\n`);
    written.push(path.relative(ROOT, filePath).replace(/\\/g, '/'));
  }
  // Also persist selected proposals for audit
  if (fs.existsSync(proposeDir)) {
    written.push(path.relative(ROOT, proposeDir).replace(/\\/g, '/'));
  }
  const merge = npmRun('i18n:merge-tier-c');
  if (!merge.ok) {
    return { ok: false, error: merge.stderr || merge.stdout || 'merge-tier-c failed', paths: written };
  }
  const check = npmRun('verify:i18n:check');
  if (!check.ok) {
    return { ok: false, error: check.stderr || 'verify:i18n:check failed after apply', paths: written };
  }
  return { ok: true, paths: written };
}

function applyChangelog(items, confirm) {
  if (!confirm) return { ok: false, error: 'confirmProductWrite required for CHANGELOG.md' };
  const bullets = items
    .filter((it) => it.kind === 'changelog_bullet' || it.selected)
    .map((it) => `- ${it.title}`);
  if (!bullets.length) return { ok: false, error: 'no changelog bullets selected' };
  const file = path.join(ROOT, 'CHANGELOG.md');
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# Changelog\n';
  const block = `\n## Agentic draft (approved)\n\n${bullets.join('\n')}\n`;
  fs.writeFileSync(file, prev.replace(/^(# Changelog\s*\n)/, `$1${block}`) || `${prev}\n${block}`);
  return { ok: true, paths: ['CHANGELOG.md'] };
}

function applyWiki(confirm) {
  if (!confirm) return { ok: false, error: 'confirmProductWrite required for wiki:sync' };
  const res = npmRun('wiki:sync');
  return {
    ok: res.ok,
    error: res.ok ? null : (res.stderr || res.stdout || 'wiki:sync failed'),
    paths: res.ok ? ['wiki/'] : [],
  };
}

function applyVisual(confirm) {
  if (!confirm) return { ok: false, error: 'confirmProductWrite required for visual:apply' };
  const brokenPath = path.join(ROOT, 'artifacts/visual-gen/qa/broken.json');
  let broken = [];
  if (fs.existsSync(brokenPath)) {
    try { broken = JSON.parse(fs.readFileSync(brokenPath, 'utf8')); } catch { broken = []; }
  }
  if (Array.isArray(broken) && broken.length > 0) {
    return { ok: false, error: `visual QA broken.length=${broken.length}; refuse apply` };
  }
  const unlock = path.join(packDir('visual'), 'apply-unlock.json');
  ensureDir(packDir('visual'));
  fs.writeFileSync(unlock, `${JSON.stringify({ unlockedAt: new Date().toISOString() }, null, 2)}\n`);
  const res = npmRun('visual:apply');
  return {
    ok: res.ok,
    error: res.ok ? null : (res.stderr || 'visual:apply failed'),
    paths: res.ok ? ['apps/pwa-webapp/', path.relative(ROOT, unlock).replace(/\\/g, '/')] : [],
  };
}

function applyDepsBump(items, allow, confirm) {
  if (!allow || !confirm) {
    return { ok: false, error: 'allowDependencyBump + confirmProductWrite required' };
  }
  const bumps = items.filter((it) => it.kind === 'deps_bump' && it.package && it.to);
  if (!bumps.length) return { ok: false, error: 'no deps_bump items selected' };
  const paths = ['package.json', 'package-lock.json'];
  for (const b of bumps) {
    const pkg = String(b.package);
    if (pkg.includes('..') || pkg.startsWith('@/') || /[;|&]/.test(pkg)) {
      return { ok: false, error: `refusing unsafe package name ${pkg}` };
    }
    const res = silentSpawnSync('npm', ['install', `${pkg}@${b.to}`, '--save'], {
      cwd: ROOT,
      env: process.env,
    });
    if (res.status !== 0) {
      return { ok: false, error: (res.stderr || res.stdout || 'npm install failed').slice(0, 500), paths };
    }
  }
  const docs = npmRun('docs:dependencies');
  if (docs.ok) paths.push('docs/dependencies.md');
  return { ok: true, paths };
}

/**
 * Approve selected proposal items and run adapters.
 */
export async function approvePack(packId, opts = {}) {
  const proposal = readProposal(packId);
  if (!proposal) return { ok: false, error: { code: 'no_proposal', message: 'no proposal' } };

  const confirm = Boolean(opts.confirmProductWrite);
  const allowBump = Boolean(opts.allowDependencyBump);
  const doGit = Boolean(opts.gitCommitOnApprove);
  const selectedIds = opts.itemIds?.length
    ? new Set(opts.itemIds)
    : null;
  const items = (proposal.items || []).filter((it) => {
    if (selectedIds) return selectedIds.has(it.id);
    return it.selected !== false;
  });
  if (!items.length) return { ok: false, error: { code: 'empty', message: 'no items selected' } };

  const byAdapter = new Map();
  for (const it of items) {
    let adapter = it.applyAdapter || 'ack';
    if (it.kind === 'deps_bump') adapter = 'deps-bump';
    if (it.kind === 'i18n_string') adapter = 'i18n-apply-fill';
    if (it.kind === 'changelog_bullet') adapter = 'changelog-promote';
    if (it.kind === 'wiki_patch') adapter = 'wiki-sync';
    if (it.kind === 'visual_apply') adapter = 'visual-apply';
    if (packId === 'security' && /csp|header/i.test(it.title)) {
      return { ok: false, error: { code: 409, message: 'refuse CSP/header mutation from harness' } };
    }
    if (!byAdapter.has(adapter)) byAdapter.set(adapter, []);
    byAdapter.get(adapter).push(it);
  }

  const touched = [];
  const results = [];

  for (const [adapter, list] of byAdapter) {
    let r;
    if (adapter === 'ack') r = { ok: true, paths: writeAck(packId, list) };
    else if (adapter === 'write-approved-artifact') r = { ok: true, paths: writeApprovedArtifact(packId, list) };
    else if (adapter === 'i18n-apply-fill') {
      if (!confirm) r = { ok: false, error: 'confirmProductWrite required for i18n fill apply' };
      else r = applyI18nFill(packId, list);
    } else if (adapter === 'changelog-promote') r = applyChangelog(list, confirm);
    else if (adapter === 'wiki-sync') r = applyWiki(confirm);
    else if (adapter === 'visual-apply') r = applyVisual(confirm);
    else if (adapter === 'deps-bump') r = applyDepsBump(list, allowBump, confirm);
    else if (adapter === 'refuse-bump' || adapter === 'refuse-csp-mutate') {
      r = { ok: false, error: 'adapter refuses this action' };
    } else {
      r = { ok: true, paths: writeApprovedArtifact(packId, list) };
    }
    results.push({ adapter, ...r });
    if (!r.ok) {
      appendApprovalLog({ pack: packId, action: 'approve_failed', adapter, error: r.error });
      return { ok: false, error: { code: 409, message: String(r.error) }, data: { results } };
    }
    touched.push(...(r.paths || []));
  }

  let gitSha = null;
  if (doGit && touched.length) {
    const g = gitCommitOnApprove({
      packId,
      paths: touched,
      message: `chore(agentic): approve ${packId}`,
    });
    if (!g.ok) {
      return { ok: false, error: { code: 'git', message: g.error }, data: { results, touched } };
    }
    gitSha = g.sha;
  }

  const next = {
    ...proposal,
    status: 'applied',
    approval: {
      ...proposal.approval,
      state: 'applied',
      at: new Date().toISOString(),
      by: opts.by || 'operator',
      confirmProductWrite: confirm,
      allowDependencyBump: allowBump,
      gitCommitOnApprove: doGit,
      gitCommitSha: gitSha,
    },
  };
  writeProposal(packId, next);
  appendApprovalLog({
    pack: packId,
    action: 'approve',
    by: opts.by || 'operator',
    adapters: [...byAdapter.keys()],
    gitSha,
    itemIds: items.map((i) => i.id),
  });

  writePackState(packId, {
    ...readPackState(packId),
    status: 'applied',
    finishedAt: new Date().toISOString(),
  });

  return { ok: true, error: null, data: { proposal: next, results, touched, gitSha } };
}

export function rejectPack(packId, opts = {}) {
  const proposal = readProposal(packId);
  if (!proposal) return { ok: false, error: { code: 'no_proposal', message: 'no proposal' } };
  const archived = {
    ...proposal,
    status: 'rejected',
    approval: {
      ...proposal.approval,
      state: 'rejected',
      at: new Date().toISOString(),
      by: opts.by || 'operator',
    },
  };
  writeProposal(packId, archived);
  const rejectPath = path.join(packDir(packId), 'proposal.rejected.json');
  fs.writeFileSync(rejectPath, `${JSON.stringify(archived, null, 2)}\n`);
  appendApprovalLog({ pack: packId, action: 'reject', by: opts.by || 'operator' });
  return { ok: true, error: null, data: archived };
}

export function selectProposalItems(packId, itemIds, selected) {
  const proposal = readProposal(packId);
  if (!proposal) return { ok: false, error: { code: 'no_proposal', message: 'no proposal' } };
  const set = new Set(itemIds || []);
  proposal.items = (proposal.items || []).map((it) => (
    set.has(it.id) ? { ...it, selected: Boolean(selected) } : it
  ));
  writeProposal(packId, proposal);
  return { ok: true, error: null, data: proposal };
}

/** Auto-ack path for run-all autoApproveMode=ack (no product writes). */
export async function autoAckPack(packId) {
  const proposal = readProposal(packId);
  if (!proposal) return { ok: true, skipped: true };
  const safeItems = (proposal.items || []).filter((it) => (
    it.kind === 'ack_only' || it.applyAdapter === 'ack' || it.applyAdapter === 'write-approved-artifact'
  ));
  if (!safeItems.length) {
    writeApprovedArtifact(packId, proposal.items || []);
    const next = {
      ...proposal,
      status: 'applied',
      approval: {
        ...proposal.approval,
        state: 'applied',
        at: new Date().toISOString(),
        by: 'auto-ack',
      },
    };
    writeProposal(packId, next);
    appendApprovalLog({ pack: packId, action: 'auto-ack', by: 'auto-ack' });
    return { ok: true, data: next };
  }
  return approvePack(packId, {
    itemIds: safeItems.map((i) => i.id),
    confirmProductWrite: false,
    allowDependencyBump: false,
    gitCommitOnApprove: false,
    by: 'auto-ack',
  });
}
