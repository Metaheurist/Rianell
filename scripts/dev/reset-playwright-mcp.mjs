#!/usr/bin/env node
/**
 * Unsticks the Playwright MCP server when its tool calls hang: kills only the browser that
 * @playwright/mcp launched (and that browser's child processes). Your own Chrome, other
 * Playwright runs and the MCP node server itself are left alone; the next MCP call
 * (e.g. browser_navigate) launches a fresh browser.
 *
 * A process is selected when all of these hold:
 *   - its --user-data-dir is an MCP profile (ms-playwright-mcp\mcp-chrome-* or ms-playwright\mcp-*)
 *   - it is the browser process, not a --type= renderer/GPU/utility child
 *   - its parent command line is @playwright/mcp
 *
 * Usage:
 *   node scripts/dev/reset-playwright-mcp.mjs            # kill matches
 *   node scripts/dev/reset-playwright-mcp.mjs --dry-run  # list matches only
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const MCP_PROFILE_RE = /ms-playwright-mcp[\\/]mcp-chrome-|[\\/]ms-playwright[\\/]mcp-/i;
const MCP_PARENT_RE = /@playwright[\\/]mcp/i;

/**
 * @param {{ pid: number, ppid: number, cmd: string }[]} processes
 * @returns {number[]}
 */
export function selectMcpBrowserPids(processes) {
  const byPid = new Map(processes.map((p) => [p.pid, p]));
  return processes
    .filter((p) => {
      const cmd = p.cmd || '';
      if (!MCP_PROFILE_RE.test(cmd) || /--type=/.test(cmd)) return false;
      const parent = byPid.get(p.ppid);
      return !!parent && MCP_PARENT_RE.test(parent.cmd || '');
    })
    .map((p) => p.pid);
}

function listProcessesWindows() {
  const ps = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  if (ps.status !== 0) throw new Error(`Get-CimInstance failed: ${ps.stderr || ps.status}`);
  const rows = JSON.parse(ps.stdout || '[]');
  return (Array.isArray(rows) ? rows : [rows]).map((r) => ({
    pid: Number(r.ProcessId),
    ppid: Number(r.ParentProcessId),
    cmd: r.CommandLine || '',
  }));
}

function listProcessesPosix() {
  const ps = spawnSync('ps', ['-eo', 'pid=,ppid=,args='], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (ps.status !== 0) throw new Error(`ps failed: ${ps.stderr || ps.status}`);
  return ps.stdout
    .split('\n')
    .map((line) => line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/))
    .filter(Boolean)
    .map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), cmd: m[3] }));
}

function killTree(pid) {
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
    return r.status === 0;
  }
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch (_) {
    return false;
  }
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const processes = process.platform === 'win32' ? listProcessesWindows() : listProcessesPosix();
  const pids = selectMcpBrowserPids(processes);
  if (!pids.length) {
    console.log('[reset-playwright-mcp] no Playwright MCP browser running');
    return;
  }
  for (const pid of pids) {
    if (dryRun) {
      console.log(`[reset-playwright-mcp] would kill MCP browser PID ${pid}`);
      continue;
    }
    console.log(`[reset-playwright-mcp] ${killTree(pid) ? 'killed' : 'could not kill'} MCP browser PID ${pid}`);
  }
  if (!dryRun) console.log('[reset-playwright-mcp] next MCP browser call launches a fresh browser');
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
