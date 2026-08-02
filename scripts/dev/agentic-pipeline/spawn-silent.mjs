/**
 * Headless child_process helpers for agentic gates on Windows.
 *
 * Never launch `npm.cmd` / `cmd.exe` for `npm run` — those flash console
 * windows. Resolve package.json scripts to `node <script> …` when possible,
 * otherwise `node <npm-cli.js> …`, always with windowsHide + shell:false.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WIN = process.platform === 'win32';
const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

let cachedNpmCli = undefined;
let cachedScripts = undefined;

/** @returns {string|null} Absolute path to npm-cli.js when found. */
export function findNpmCliJs() {
  if (cachedNpmCli !== undefined) return cachedNpmCli;
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), 'npm', 'bin', 'npm-cli.js'),
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) {
        cachedNpmCli = path.resolve(c);
        return cachedNpmCli;
      }
    } catch {
      /* continue */
    }
  }
  cachedNpmCli = null;
  return null;
}

function loadPackageScripts(cwd = REPO_ROOT) {
  const key = path.resolve(cwd || REPO_ROOT);
  if (cachedScripts && cachedScripts.key === key) return cachedScripts.map;
  const pkgPath = path.join(key, 'package.json');
  let map = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    map = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  } catch {
    map = {};
  }
  cachedScripts = { key, map };
  return map;
}

/** Split a simple script line into argv (no shell metacharacters). */
function tokenizeScriptLine(line) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) {
    out.push(m[1] ?? m[2] ?? m[3]);
  }
  return out;
}

/**
 * If package script is `node …`, return a direct node invocation.
 * @param {string} scriptLine
 * @param {string[]} extraArgs
 * @returns {{ cmd: string, args: string[], shell: boolean }|null}
 */
export function resolveNodeScriptLine(scriptLine, extraArgs = []) {
  const trimmed = String(scriptLine || '').trim();
  if (!trimmed || /[|&;<>]/.test(trimmed)) return null;
  const parts = tokenizeScriptLine(trimmed);
  if (!parts.length) return null;
  const bin = parts[0].toLowerCase();
  if (bin !== 'node' && bin !== 'nodejs') return null;
  return {
    cmd: process.execPath,
    args: [...parts.slice(1), ...extraArgs],
    shell: false,
  };
}

/**
 * Rewrite `npm run <script>` → `node <script file> …` via package.json.
 * @param {string} scriptName
 * @param {string[]} [extraArgs] args after `--`
 * @param {string} [cwd]
 */
export function resolveNpmRunScript(scriptName, extraArgs = [], cwd = REPO_ROOT) {
  const scripts = loadPackageScripts(cwd);
  const line = scripts[scriptName];
  if (!line) return null;
  return resolveNodeScriptLine(line, extraArgs);
}

/**
 * Rewrite `npm …` into a headless invocation.
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string }} [opts]
 * @returns {{ cmd: string, args: string[], shell: boolean }}
 */
export function resolveSilentInvocation(cmd, args = [], opts = {}) {
  const cwd = opts.cwd || REPO_ROOT;

  if (cmd === 'npm' || cmd === 'npm.cmd') {
    if (args[0] === 'run' && args[1]) {
      const scriptName = args[1];
      const dash = args.indexOf('--');
      const npmFlagsEnd = dash >= 0 ? dash : args.length;
      // args[2..npmFlagsEnd) are npm-run flags (--silent, etc.) — ignore for direct node
      const passthrough = dash >= 0 ? args.slice(dash + 1) : [];
      // Also allow `npm run script --flag` style where extra is only after --
      const direct = resolveNpmRunScript(scriptName, passthrough, cwd);
      if (direct) return direct;
    }
    const cli = findNpmCliJs();
    if (cli) {
      return { cmd: process.execPath, args: [cli, ...args], shell: false };
    }
    // Last resort: still no shell on Windows (avoids cmd.exe flash; may EINVAL).
    return { cmd: WIN ? 'npm.cmd' : 'npm', args: [...args], shell: false };
  }

  if (cmd === 'node' || cmd === process.execPath) {
    return { cmd: process.execPath, args: [...args], shell: false };
  }

  if (cmd === 'git') {
    return { cmd: 'git', args: [...args], shell: false };
  }

  // Never shell:true on Windows — cmd.exe flashes a console for every call.
  return { cmd, args: [...args], shell: false };
}

/**
 * @param {string} cmd
 * @param {string[]} [args]
 * @param {import('node:child_process').SpawnSyncOptionsWithStringEncoding} [opts]
 */
export function silentSpawnSync(cmd, args = [], opts = {}) {
  const cwd = opts.cwd || REPO_ROOT;
  const inv = resolveSilentInvocation(cmd, args, { cwd });
  const {
    shell: shellOpt,
    windowsHide: _h,
    stdio,
    env,
    ...rest
  } = opts;

  const childEnv = {
    ...(env || process.env),
    // Ask nested tools / npm (if used) to stay quiet; scripts should honor windowsHide.
    AGENTIC_HEADLESS: '1',
    npm_config_progress: 'false',
    npm_config_loglevel: 'error',
  };

  return spawnSync(inv.cmd, inv.args, {
    encoding: 'utf8',
    ...rest,
    cwd,
    env: childEnv,
    shell: shellOpt != null ? shellOpt : inv.shell,
    windowsHide: true,
    stdio: stdio || ['ignore', 'pipe', 'pipe'],
  });
}

/** @deprecated use resolveSilentInvocation */
export function resolveSilentCommand(cmd) {
  return resolveSilentInvocation(cmd, []).cmd;
}
