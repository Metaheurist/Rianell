/**
 * Opt-in local git commit after agentic approve. Never pushes. Honors hooks.
 */
import path from 'node:path';
import { ROOT } from './state.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';

const SECRET_RE = /(?:^|\/)(\.env|security\/\.env|\.encryption_key|supabase-config\.js)(?:$|\/)/i;

export function gitCommitOnApprove({ packId, paths = [], message } = {}) {
  const allow = (paths || []).filter((p) => {
    const norm = String(p).replace(/\\/g, '/');
    if (!norm || norm.includes('..')) return false;
    if (SECRET_RE.test(norm)) return false;
    return true;
  });
  if (!allow.length) {
    return { ok: false, error: 'no allowlisted paths to commit' };
  }

  const add = silentSpawnSync('git', ['add', '--', ...allow], { cwd: ROOT });
  if (add.status !== 0) {
    return { ok: false, error: (add.stderr || add.stdout || 'git add failed').slice(0, 400) };
  }

  const msg = message || `chore(agentic): approve ${packId}`;
  const commit = silentSpawnSync('git', ['commit', '-m', msg], { cwd: ROOT });
  if (commit.status !== 0) {
    const err = (commit.stderr || commit.stdout || 'git commit failed').slice(0, 500);
    if (/nothing to commit/i.test(err)) {
      return { ok: true, sha: null, note: 'nothing to commit' };
    }
    return { ok: false, error: err };
  }

  const rev = silentSpawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT });
  const sha = (rev.stdout || '').trim() || null;
  return { ok: true, sha, paths: allow.map((p) => path.normalize(p)) };
}
