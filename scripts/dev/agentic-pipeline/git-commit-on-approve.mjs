/**
 * Opt-in git commit + push after agentic approve.
 * When enabled: one LLM-authored commit per approved item, then push once per pack Approve.
 * Honors hooks. Never force-pushes.
 */
import path from 'node:path';
import { ROOT } from './state.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';
import { ollamaGenerate, ollamaPs } from './ollama-client.mjs';
import { resolvePackModel } from './catalog.mjs';

const SECRET_RE = /(?:^|\/)(\.env|security\/\.env|\.encryption_key|supabase-config\.js)(?:$|\/)/i;

const COMMIT_SYSTEM = `You write git commit messages for the Rianell monorepo.
Output ONLY the commit message text — no markdown fences, no commentary.
Format: conventional commits (type(scope): summary).
First line ≤72 characters. Optional blank line then 1–3 short body bullets explaining why.
No secrets, no health/screening data, no Co-authored-by lines.`;

export function filterCommitPaths(paths = []) {
  return (paths || []).filter((p) => {
    const norm = String(p).replace(/\\/g, '/');
    if (!norm || norm.includes('..')) return false;
    if (SECRET_RE.test(norm)) return false;
    return true;
  });
}

export function fallbackCommitMessage(packId, item = {}) {
  const kind = String(item.kind || item.applyAdapter || 'change').replace(/_/g, '-');
  const title = String(item.title || item.id || 'item').replace(/\s+/g, ' ').trim().slice(0, 50);
  return `chore(agentic/${packId}): ${kind} — ${title}`;
}

/** Strip fences / quotes and clamp LLM commit text. */
export function sanitizeCommitMessage(raw, fallback) {
  let t = String(raw || '').trim();
  if (!t) return fallback;
  t = t.replace(/^```[\w]*\n?/i, '').replace(/\n?```$/i, '').trim();
  t = t.replace(/^["']|["']$/g, '').trim();
  // Drop leading labels LLMs sometimes emit
  t = t.replace(/^(?:commit message|message)\s*:\s*/i, '');
  const lines = t.split(/\r?\n/).map((l) => l.trimEnd());
  while (lines.length && !lines[0].trim()) lines.shift();
  if (!lines.length) return fallback;
  // Cap body
  const head = lines[0].slice(0, 100);
  const rest = lines.slice(1);
  // Keep at most one blank line after subject, then up to 8 body lines.
  const body = [];
  let sawBlank = false;
  for (const l of rest) {
    if (!l.trim()) {
      if (!sawBlank && body.length === 0) {
        body.push('');
        sawBlank = true;
      }
      continue;
    }
    body.push(l);
    if (body.filter((x) => x.trim()).length >= 8) break;
  }
  const msg = [head, ...body].join('\n').trim();
  return msg.length >= 8 ? msg : fallback;
}

async function pickCommitModel(packId, preferred) {
  if (preferred) return preferred;
  if (process.env.AGENTIC_COMMIT_MODEL) return process.env.AGENTIC_COMMIT_MODEL;
  try {
    const ps = await ollamaPs();
    const loaded = (ps.models || []).map((m) => m.name || m.model).filter(Boolean);
    const prefer = ['qwen2.5-coder:14b', 'qwen2.5-coder:3b', 'qwen2.5-coder:32b'];
    for (const p of prefer) {
      if (loaded.some((n) => n === p || n.startsWith(`${p}/`) || n.startsWith(`${p}:`))) return p;
    }
    if (loaded[0]) return loaded[0];
  } catch { /* ignore */ }
  const resolved = resolvePackModel(packId);
  return resolved?.model || 'qwen2.5-coder:14b';
}

/**
 * Ask local Ollama for a commit message; falls back on failure.
 */
export async function generateCommitMessageWithLlm({
  packId,
  item = {},
  paths = [],
  model,
} = {}) {
  const fallback = fallbackCommitMessage(packId, item);
  if (process.env.AGENTIC_SKIP_COMMIT_LLM === '1') return { message: fallback, model: null, fallback: true };
  let useModel;
  try {
    useModel = await pickCommitModel(packId, model);
  } catch {
    return { message: fallback, model: null, fallback: true };
  }
  const prompt = [
    `Pack: ${packId}`,
    `Item id: ${item.id || '(none)'}`,
    `Kind: ${item.kind || '(none)'}`,
    `Title: ${item.title || '(none)'}`,
    `Detail: ${String(item.detail || '').slice(0, 400)}`,
    `Paths:\n${(paths.length ? paths : ['(none)']).map((p) => `- ${p}`).join('\n')}`,
    '',
    'Write the commit message now.',
  ].join('\n');
  try {
    const raw = await ollamaGenerate({
      model: useModel,
      prompt,
      system: COMMIT_SYSTEM,
      numPredict: 180,
      numCtx: 4096,
    });
    return {
      message: sanitizeCommitMessage(raw, fallback),
      model: useModel,
      fallback: false,
    };
  } catch (err) {
    return {
      message: fallback,
      model: useModel,
      fallback: true,
      error: String(err?.message || err),
    };
  }
}

/**
 * Stage allowlisted paths and create one commit.
 * @returns {{ ok: boolean, sha?: string|null, note?: string, error?: string, paths?: string[] }}
 */
export function gitCommitOnApprove({ packId, paths = [], message, item } = {}) {
  const allow = filterCommitPaths(paths);
  if (!allow.length) {
    return { ok: false, error: 'no allowlisted paths to commit' };
  }

  const add = silentSpawnSync('git', ['add', '--', ...allow], { cwd: ROOT });
  if (add.status !== 0) {
    return { ok: false, error: (add.stderr || add.stdout || 'git add failed').slice(0, 400) };
  }

  const msg = message || fallbackCommitMessage(packId, item);
  const commit = silentSpawnSync('git', ['commit', '-m', msg], { cwd: ROOT });
  if (commit.status !== 0) {
    const err = (commit.stderr || commit.stdout || 'git commit failed').slice(0, 500);
    if (/nothing to commit/i.test(err)) {
      return { ok: true, sha: null, note: 'nothing to commit', paths: allow };
    }
    return { ok: false, error: err };
  }

  const rev = silentSpawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT });
  const sha = (rev.stdout || '').trim() || null;
  return { ok: true, sha, paths: allow.map((p) => path.normalize(p)), message: msg };
}

/**
 * Apply item → LLM message → dedicated commit.
 */
export async function commitApprovedItem({
  packId,
  item,
  paths = [],
  model,
} = {}) {
  const allow = filterCommitPaths(paths);
  if (!allow.length) {
    return { ok: true, sha: null, note: 'no paths', itemId: item?.id };
  }
  const gen = await generateCommitMessageWithLlm({ packId, item, paths: allow, model });
  const result = gitCommitOnApprove({
    packId,
    paths: allow,
    message: gen.message,
    item,
  });
  return {
    ...result,
    itemId: item?.id,
    commitMessage: gen.message,
    llmModel: gen.model,
    llmFallback: gen.fallback,
    llmError: gen.error || null,
  };
}

/**
 * Push current branch upstream (no force). Safe no-op when nothing to push.
 */
export function gitPushOnApprove() {
  if (process.env.AGENTIC_SKIP_GIT_PUSH === '1') {
    return { ok: true, skipped: true, note: 'AGENTIC_SKIP_GIT_PUSH=1' };
  }
  const push = silentSpawnSync('git', ['push'], { cwd: ROOT });
  if (push.status !== 0) {
    const err = (push.stderr || push.stdout || 'git push failed').slice(0, 600);
    // Upstream missing — try set upstream once
    if (/no upstream|has no upstream|set-upstream/i.test(err)) {
      const branch = silentSpawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT });
      const name = (branch.stdout || '').trim();
      if (name && name !== 'HEAD') {
        const up = silentSpawnSync('git', ['push', '-u', 'origin', name], { cwd: ROOT });
        if (up.status === 0) {
          return { ok: true, upstreamSet: true, branch: name };
        }
        return {
          ok: false,
          error: (up.stderr || up.stdout || err).slice(0, 600),
        };
      }
    }
    return { ok: false, error: err };
  }
  return { ok: true };
}
