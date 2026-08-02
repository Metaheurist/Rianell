/**
 * Safe path / script validators + apply adapters for Research-stage actions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ensureDir, packDir } from './state.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';

const ALLOW_PREFIXES = [
  'apps/',
  'packages/',
  'scripts/',
  'docs/',
  'wiki/',
  'i18n-packs/',
  'tests/',
  'server/',
  'benchmarks/',
  'artifacts/agentic/',
  'CHANGELOG.md',
  'AGENTS.md',
  'README.md',
];

const DENY_EXACT = new Set([
  'security/.env',
  'security/.encryption_key',
  'supabase-config.js',
  '.env',
  '.env.local',
  '.env.production',
]);

const DENY_SUBSTR = [
  'security/.env',
  '.encryption_key',
  'node_modules/',
  '.git/',
  'service_role',
];

export function normalizeRelPath(raw) {
  let p = String(raw || '').replace(/\\/g, '/').trim().replace(/^\.?\//, '');
  if (!p || p.includes('\0') || p.includes('..')) return null;
  if (path.isAbsolute(p)) return null;
  return p;
}

export function isAllowedWritePath(rel) {
  const p = normalizeRelPath(rel);
  if (!p) return false;
  if (DENY_EXACT.has(p)) return false;
  const lower = p.toLowerCase();
  for (const d of DENY_SUBSTR) {
    if (lower.includes(d.toLowerCase())) return false;
  }
  return ALLOW_PREFIXES.some((pre) => (pre.endsWith('.md') ? p === pre : p === pre.slice(0, -1) || p.startsWith(pre)));
}

export function isAllowedNpmScript(name) {
  return /^[a-z0-9][a-z0-9:_-]{0,80}$/i.test(String(name || ''));
}

export function isAllowedNodeScript(rel) {
  const p = normalizeRelPath(rel);
  if (!p) return false;
  if (!p.startsWith('scripts/') || !/\.m?js$/i.test(p)) return false;
  return isAllowedWritePath(p);
}

/**
 * Write or create files under allowlisted repo paths.
 * Item fields: path|target, content|proposed, kind file_write|file_create
 */
export function applyResearchFileWrite(items, confirm) {
  if (!confirm) return { ok: false, error: 'confirmProductWrite required for research file writes' };
  const written = [];
  for (const it of items) {
    const rel = normalizeRelPath(it.path || it.target || (it.targets && it.targets[0]));
    if (!isAllowedWritePath(rel)) {
      return { ok: false, error: `refusing path: ${rel || '(empty)'}`, paths: written };
    }
    const abs = path.join(ROOT, rel);
    const content = it.content != null ? String(it.content) : String(it.proposed || '');
    if (!content && it.kind === 'file_create') {
      return { ok: false, error: `empty content for ${rel}`, paths: written };
    }
    if (it.kind === 'file_create' && fs.existsSync(abs)) {
      return { ok: false, error: `file already exists: ${rel}`, paths: written };
    }
    if (it.kind === 'file_write' && !fs.existsSync(abs) && content === '') {
      return { ok: false, error: `missing file and empty patch: ${rel}`, paths: written };
    }
    ensureDir(path.dirname(abs));
    if (it.kind === 'file_write' && fs.existsSync(abs) && it.replace == null && it.content == null && it.proposed) {
      // Propose as full-file replacement when content provided via proposed
      fs.writeFileSync(abs, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    } else {
      fs.writeFileSync(abs, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    }
    written.push(rel);
  }
  return { ok: true, paths: written };
}

/**
 * Run allowlisted npm scripts or node scripts under scripts/.
 * Item fields: npmScript | script | cmdArgs?
 */
export function applyResearchScriptRun(items, confirm) {
  if (!confirm) return { ok: false, error: 'confirmProductWrite required for research script runs' };
  const logs = [];
  for (const it of items) {
    if (it.npmScript) {
      const name = String(it.npmScript);
      if (!isAllowedNpmScript(name)) {
        return { ok: false, error: `refusing npm script: ${name}`, paths: logs };
      }
      const res = silentSpawnSync('npm', ['run', name], { cwd: ROOT, env: process.env });
      logs.push(`npm run ${name}`);
      if (res.status !== 0) {
        return {
          ok: false,
          error: (res.stderr || res.stdout || `npm run ${name} failed`).toString().slice(0, 800),
          paths: logs,
        };
      }
      continue;
    }
    const script = normalizeRelPath(it.script || it.path);
    if (!isAllowedNodeScript(script)) {
      return { ok: false, error: `refusing node script: ${script || '(empty)'}`, paths: logs };
    }
    const extra = Array.isArray(it.args) ? it.args.map(String) : [];
    if (extra.some((a) => /[;&|<>]/.test(a) || a.includes('..'))) {
      return { ok: false, error: 'refusing unsafe script args', paths: logs };
    }
    const res = silentSpawnSync(process.execPath, [script, ...extra], { cwd: ROOT, env: process.env });
    logs.push(script);
    if (res.status !== 0) {
      return {
        ok: false,
        error: (res.stderr || res.stdout || `${script} failed`).toString().slice(0, 800),
        paths: logs,
      };
    }
  }
  return { ok: true, paths: logs };
}

/**
 * Tidy research runtime artifacts across pack dirs (not full clear-all).
 */
export function applyResearchTidy(items, confirm) {
  // Tidy is local artifact cleanup — still require explicit approve, not product-write.
  void confirm;
  void items;
  const removeNames = ['web-research.json', 'web-research.md'];
  const removed = [];
  const agenticRoot = path.dirname(packDir('design'));
  let dirs = [];
  try {
    if (fs.existsSync(agenticRoot)) {
      dirs = fs.readdirSync(agenticRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(agenticRoot, d.name));
    }
  } catch {
    dirs = [];
  }
  const legacy = packDir('research');
  if (!dirs.includes(legacy)) dirs.push(legacy);

  for (const dir of dirs) {
    for (const name of removeNames) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        removed.push(path.relative(ROOT, p).replace(/\\/g, '/'));
      }
    }
  }
  return { ok: true, paths: removed };
}

/** Infer adapter/kind from proposed action title/detail. */
export function classifyResearchAction(title, detail = '') {
  const t = `${title}\n${detail}`;
  if (/\b(tidy|cleanup|clear artifacts)\b/i.test(t)) {
    return { kind: 'tidy', applyAdapter: 'research-tidy', risk: 'low' };
  }
  if (/\b(npm run|run script|node scripts\/)\b/i.test(t)) {
    return { kind: 'script_run', applyAdapter: 'research-script-run', risk: 'high' };
  }
  if (/\b(create file|file_create|new file)\b/i.test(t)) {
    return { kind: 'file_create', applyAdapter: 'research-file-write', risk: 'high' };
  }
  if (/\b(write|edit|patch|update file|file_write)\b/i.test(t)) {
    return { kind: 'file_write', applyAdapter: 'research-file-write', risk: 'high' };
  }
  if (/\b(fact.?check|verify claim|source)\b/i.test(t)) {
    return { kind: 'fact_check', applyAdapter: 'write-approved-artifact', risk: 'low' };
  }
  return { kind: 'ack_only', applyAdapter: 'ack', risk: 'low' };
}
