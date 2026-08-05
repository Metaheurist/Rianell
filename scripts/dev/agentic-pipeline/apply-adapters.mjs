/**
 * Pack-specific apply adapters. Never called automatically from pack-runner.
 * Approve enqueues work onto the apply-queue (model-grouped drain).
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
import { commitApprovedItem, gitPushOnApprove } from './git-commit-on-approve.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';
import { drainApplyQueue, enqueueApprovedWork } from './apply-queue.mjs';
import { applyVisualRepolish } from './visual-qa-propose.mjs';
import {
  applyResearchFileWrite,
  applyResearchScriptRun,
  applyResearchTidy,
  applySafePatch,
  isProductTrackedPath,
} from './research-apply.mjs';

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
    .map((it) => {
      const t = String(it.title || '').trim();
      if (t.startsWith('- ')) return t;
      // Prefer Keep-a-Changelog bold lead when title is a short headline.
      if (/^\*\*/.test(t)) return `- ${t}`;
      return `- **${t.replace(/\.$/, '')}**`;
    });
  if (!bullets.length) return { ok: false, error: 'no changelog bullets selected' };
  const file = path.join(ROOT, 'CHANGELOG.md');
  let prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# Changelog\n\n## [Unreleased]\n\n### Added\n';
  // Strip legacy meta draft blocks if present.
  prev = prev.replace(/\n## Agentic draft \(approved\)\n[\s\S]*?(?=\n## |\nAll notable|\nFormat follows|$)/, '\n');

  const unreleased = prev.match(/## \[Unreleased\]([\s\S]*?)(?=\n## \[|$)/);
  if (!unreleased) {
    const inject = `## [Unreleased]\n\n### Changed\n${bullets.join('\n')}\n\n`;
    const next = prev.replace(/^(# Changelog\s*\n+)/, `$1\n${inject}`);
    fs.writeFileSync(file, next.includes(inject) ? next : `${prev}\n${inject}`);
    return { ok: true, paths: ['CHANGELOG.md'] };
  }

  let section = unreleased[1];
  if (/### Changed/.test(section)) {
    section = section.replace(/(### Changed\n)/, `$1${bullets.join('\n')}\n`);
  } else if (/### Added/.test(section)) {
    section = section.replace(/(### Added\n)/, `$1${bullets.join('\n')}\n`);
  } else {
    section = `\n\n### Changed\n${bullets.join('\n')}\n${section}`;
  }
  const next = prev.replace(/## \[Unreleased\][\s\S]*?(?=\n## \[|$)/, `## [Unreleased]${section}`);
  fs.writeFileSync(file, next);
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
  // Also accept object form { ids: [...] }
  if (broken && typeof broken === 'object' && !Array.isArray(broken)) {
    const ids = Array.isArray(broken.ids) ? broken.ids : (Array.isArray(broken.broken) ? broken.broken : []);
    if (ids.length > 0) {
      return { ok: false, error: `visual QA broken.length=${ids.length}; refuse apply` };
    }
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

/** Public entry for UI Amend-to-repo / post-polish auto-amend. */
export function applyVisualAmendToRepo(opts = {}) {
  return applyVisual(Boolean(opts.confirmProductWrite));
}

export function filterProductTouchedPaths(paths = []) {
  return [...new Set((paths || []).map(String).filter((p) => isProductTrackedPath(p)))];
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

function resolveItemAdapter(packId, it) {
  let adapter = it.applyAdapter || 'ack';
  if (it.kind === 'deps_bump') adapter = 'deps-bump';
  if (it.kind === 'i18n_string') adapter = 'i18n-apply-fill';
  if (it.kind === 'changelog_bullet') adapter = 'changelog-promote';
  if (it.kind === 'wiki_patch') adapter = 'wiki-sync';
  if (it.kind === 'visual_apply') adapter = 'visual-apply';
  if (it.kind === 'visual_repolish') adapter = 'visual-repolish';
  if (it.kind === 'file_write' || it.kind === 'file_create' || it.kind === 'doc_patch' || it.kind === 'code_hint') {
    const hasBody = (it.find != null && it.replace != null)
      || (it.content != null && String(it.content).trim())
      || (it.proposed != null && String(it.proposed).trim());
    const hasPath = Boolean(it.path || it.target || (it.targets && it.targets[0]));
    if (!hasPath || !hasBody) {
      return { ok: false, error: `safe-patch requires path+body for ${it.id || it.kind}` };
    }
    adapter = 'safe-patch';
  }
  if (it.kind === 'script_run') adapter = 'research-script-run';
  if (it.kind === 'tidy') adapter = 'research-tidy';
  // Ack-only review notes may mention CSP/headers; refuse only mutation adapters.
  if (packId === 'security' && /csp|header/i.test(it.title || '')
    && adapter !== 'ack' && adapter !== 'write-approved-artifact') {
    return { ok: false, error: 'refuse CSP/header mutation from harness' };
  }
  return { ok: true, adapter };
}

function runAdapter(packId, adapter, list, confirm, allowBump) {
  if (adapter === 'ack') return { ok: true, paths: writeAck(packId, list) };
  if (adapter === 'write-approved-artifact') return { ok: true, paths: writeApprovedArtifact(packId, list) };
  if (adapter === 'i18n-apply-fill') {
    if (!confirm) return { ok: false, error: 'confirmProductWrite required for i18n fill apply' };
    return applyI18nFill(packId, list);
  }
  if (adapter === 'changelog-promote') return applyChangelog(list, confirm);
  if (adapter === 'wiki-sync') return applyWiki(confirm);
  if (adapter === 'visual-apply') return applyVisual(confirm);
  if (adapter === 'visual-repolish') return applyVisualRepolish(list);
  if (adapter === 'deps-bump') return applyDepsBump(list, allowBump, confirm);
  if (adapter === 'safe-patch') return applySafePatch(list, confirm);
  if (adapter === 'research-file-write') return applyResearchFileWrite(list, confirm);
  if (adapter === 'research-script-run') return applyResearchScriptRun(list, confirm);
  if (adapter === 'research-tidy') return applyResearchTidy(list, confirm);
  if (adapter === 'refuse-bump' || adapter === 'refuse-csp-mutate') {
    return { ok: false, error: 'adapter refuses this action' };
  }
  return { ok: true, paths: writeApprovedArtifact(packId, list) };
}

/**
 * Execute adapters for selected proposal items (used by apply-queue drain).
 * With gitCommitOnApprove: one LLM-authored commit per item, then push once for the pack.
 */
export async function executeApprovedItems(packId, items, opts = {}) {
  const confirm = Boolean(opts.confirmProductWrite);
  const allowBump = Boolean(opts.allowDependencyBump);
  const doGit = Boolean(opts.gitCommitOnApprove);

  if (!items.length) return { ok: false, error: { code: 'empty', message: 'no items selected' } };

  const touched = [];
  const results = [];
  const gitCommits = [];
  let gitSha = null;
  let gitPush = null;

  if (doGit) {
    // One apply + dedicated LLM commit per approval item, then push once.
    for (const it of items) {
      const resolved = resolveItemAdapter(packId, it);
      if (!resolved.ok) {
        appendApprovalLog({ pack: packId, action: 'approve_failed', error: resolved.error, itemId: it.id });
        return { ok: false, error: { code: 409, message: String(resolved.error) }, data: { results, gitCommits } };
      }
      const r = runAdapter(packId, resolved.adapter, [it], confirm, allowBump);
      results.push({ adapter: resolved.adapter, itemId: it.id, ...r });
      if (!r.ok) {
        appendApprovalLog({ pack: packId, action: 'approve_failed', adapter: resolved.adapter, error: r.error, itemId: it.id });
        return { ok: false, error: { code: 409, message: String(r.error) }, data: { results, gitCommits } };
      }
      const paths = r.paths || [];
      touched.push(...paths);
      if (paths.length) {
        const g = await commitApprovedItem({ packId, item: it, paths });
        gitCommits.push(g);
        if (!g.ok) {
          return { ok: false, error: { code: 'git', message: g.error }, data: { results, touched, gitCommits } };
        }
        if (g.sha) gitSha = g.sha;
      }
    }
    if (gitCommits.some((g) => g.sha)) {
      gitPush = gitPushOnApprove();
      if (!gitPush.ok) {
        return {
          ok: false,
          error: { code: 'git_push', message: gitPush.error },
          data: { results, touched, gitCommits, gitSha, gitPush },
        };
      }
    }
  } else {
    const byAdapter = new Map();
    for (const it of items) {
      const resolved = resolveItemAdapter(packId, it);
      if (!resolved.ok) {
        return { ok: false, error: { code: 409, message: String(resolved.error) } };
      }
      if (!byAdapter.has(resolved.adapter)) byAdapter.set(resolved.adapter, []);
      byAdapter.get(resolved.adapter).push(it);
    }

    for (const [adapter, list] of byAdapter) {
      const r = runAdapter(packId, adapter, list, confirm, allowBump);
      results.push({ adapter, ...r });
      if (!r.ok) {
        appendApprovalLog({ pack: packId, action: 'approve_failed', adapter, error: r.error });
        return { ok: false, error: { code: 409, message: String(r.error) }, data: { results } };
      }
      touched.push(...(r.paths || []));
    }
  }

  const proposal = readProposal(packId);
  const deferredPolish = results.some((r) => r.deferred || r.adapter === 'visual-repolish');
  if (proposal) {
    const next = {
      ...proposal,
      status: deferredPolish ? 'polish_running' : 'applied',
      approval: {
        ...proposal.approval,
        state: deferredPolish ? 'polish_running' : 'applied',
        at: new Date().toISOString(),
        by: opts.by || 'operator',
        confirmProductWrite: confirm,
        allowDependencyBump: allowBump,
        gitCommitOnApprove: doGit,
        gitCommitSha: gitSha,
        gitCommits: doGit ? gitCommits.map((g) => ({
          itemId: g.itemId,
          sha: g.sha,
          message: g.commitMessage || g.message,
          llmFallback: g.llmFallback,
        })) : undefined,
        gitPush: doGit ? (gitPush || null) : undefined,
      },
    };
    writeProposal(packId, next);
  }

  appendApprovalLog({
    pack: packId,
    action: deferredPolish ? 'approve_polish' : 'approve',
    by: opts.by || 'operator',
    adapters: [...new Set(results.map((r) => r.adapter))],
    gitSha,
    gitCommits: doGit ? gitCommits.map((g) => g.sha).filter(Boolean) : undefined,
    gitPush: gitPush?.ok,
    itemIds: items.map((i) => i.id),
  });

  const prevState = readPackState(packId);
  writePackState(packId, {
    ...prevState,
    status: deferredPolish ? 'running' : 'applied',
    stage: deferredPolish ? 'polish' : prevState.stage,
    finishedAt: deferredPolish ? null : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    error: null,
    data: {
      results,
      touched,
      gitSha,
      gitCommits: doGit ? gitCommits : undefined,
      gitPush: doGit ? gitPush : undefined,
      proposal: readProposal(packId),
    },
  };
}

async function runDrain() {
  return drainApplyQueue({
    unloadBetweenModels: true,
    executeJob: async (job) => {
      const proposal = readProposal(job.packId);
      if (!proposal) return { ok: false, error: 'no proposal' };
      const idSet = new Set(job.itemIds || []);
      const items = (proposal.items || []).filter((it) => idSet.has(it.id));
      return executeApprovedItems(job.packId, items, {
        confirmProductWrite: job.confirmProductWrite,
        allowDependencyBump: job.allowDependencyBump,
        gitCommitOnApprove: job.gitCommitOnApprove,
        by: job.by,
      });
    },
  });
}

/**
 * Approve selected proposal items → enqueue apply job (model-grouped drain).
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

  for (const it of items) {
    const resolved = resolveItemAdapter(packId, it);
    if (!resolved.ok) {
      return { ok: false, error: { code: 409, message: String(resolved.error) } };
    }
  }

  const queuedProposal = {
    ...proposal,
    items: (proposal.items || []).map((it) => (
      items.some((s) => s.id === it.id) ? { ...it, selected: true } : it
    )),
    status: 'queued_apply',
    approval: {
      ...proposal.approval,
      state: 'queued',
      at: new Date().toISOString(),
      by: opts.by || 'operator',
      confirmProductWrite: confirm,
      allowDependencyBump: allowBump,
      gitCommitOnApprove: doGit,
      gitCommitSha: null,
    },
  };
  writeProposal(packId, queuedProposal);
  writePackState(packId, {
    ...readPackState(packId),
    status: 'queued_apply',
    updatedAt: new Date().toISOString(),
  });

  const job = enqueueApprovedWork({
    packId,
    itemIds: items.map((i) => i.id),
    confirmProductWrite: confirm,
    allowDependencyBump: allowBump,
    gitCommitOnApprove: doGit,
    by: opts.by || 'operator',
  });
  appendApprovalLog({
    pack: packId,
    action: 'enqueue_apply',
    by: opts.by || 'operator',
    jobId: job.id,
    itemIds: items.map((i) => i.id),
  });

  const drain = await runDrain();
  if (!drain.ok && !drain.skipped) {
    return {
      ok: false,
      error: { code: 'drain', message: String(drain.error || 'apply queue drain failed') },
      data: { job, drain },
    };
  }

  return {
    ok: true,
    error: null,
    data: {
      job,
      queued: true,
      proposal: readProposal(packId),
      drain,
    },
  };
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
  writePackState(packId, {
    ...readPackState(packId),
    status: 'rejected',
    finishedAt: new Date().toISOString(),
  });
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
    writePackState(packId, {
      ...readPackState(packId),
      status: 'applied',
      finishedAt: new Date().toISOString(),
    });
    appendApprovalLog({ pack: packId, action: 'auto-ack', by: 'auto-ack' });
    return { ok: true, data: next };
  }
  return executeApprovedItems(packId, safeItems, {
    confirmProductWrite: false,
    allowDependencyBump: false,
    gitCommitOnApprove: false,
    by: 'auto-ack',
  });
}
