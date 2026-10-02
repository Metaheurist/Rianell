import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { selectMcpBrowserPids } from '../../scripts/dev/reset-playwright-mcp.mjs';

const MCP_NODE = { pid: 100, ppid: 1, cmd: 'node "C:\\npm-cache\\_npx\\abc\\node_modules\\.bin\\..\\@playwright\\mcp\\cli.js"' };
const MCP_BROWSER = {
  pid: 200,
  ppid: 100,
  cmd: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --user-data-dir=C:\\Users\\me\\AppData\\Local\\ms-playwright-mcp\\mcp-chrome-6a0f0b5 --remote-debugging-pipe about:blank',
};

test('selects only the MCP-launched browser process', () => {
  const processes = [
    MCP_NODE,
    MCP_BROWSER,
    { pid: 201, ppid: 200, cmd: `${MCP_BROWSER.cmd} --type=renderer` },
    { pid: 300, ppid: 1, cmd: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"' },
    { pid: 301, ppid: 300, cmd: '"chrome.exe" --type=gpu-process' },
    { pid: 400, ppid: 1, cmd: 'node node_modules/playwright/cli.js test' },
    { pid: 401, ppid: 400, cmd: 'chrome.exe --user-data-dir=C:\\Temp\\playwright_chromiumdev_profile-xyz' },
    { pid: 500, ppid: 1, cmd: 'node hermitshell.js' },
    { pid: 501, ppid: 500, cmd: 'chrome.exe --user-data-dir=C:\\Users\\me\\AppData\\Local\\ms-playwright-mcp\\mcp-chrome-other' },
    { pid: 600, ppid: 1, cmd: 'node wrangler dev' },
  ];
  assert.deepEqual(selectMcpBrowserPids(processes), [200]);
});

test('matches the posix ms-playwright/mcp-* profile with an @playwright/mcp parent', () => {
  const processes = [
    { pid: 10, ppid: 1, cmd: 'node /home/me/.npm/_npx/x/node_modules/@playwright/mcp/cli.js' },
    { pid: 11, ppid: 10, cmd: '/opt/google/chrome/chrome --user-data-dir=/home/me/.cache/ms-playwright/mcp-chrome-1 about:blank' },
  ];
  assert.deepEqual(selectMcpBrowserPids(processes), [11]);
});

test('an orphaned MCP profile browser without the MCP parent is not killed', () => {
  assert.deepEqual(selectMcpBrowserPids([{ ...MCP_BROWSER, ppid: 999 }]), []);
});

test('npm script and harness doc point at the reset script', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['dev:reset-playwright-mcp'], 'node scripts/dev/reset-playwright-mcp.mjs');
  const doc = readFileSync('docs/development/agentic-pipeline-harness.md', 'utf8');
  assert.match(doc, /npm run dev:reset-playwright-mcp/);
});
