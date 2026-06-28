#!/usr/bin/env node
/**
 * Dev Chromium for the Rianell local server — isolated from daily-use browsers.
 * Browsers: server/.playwright-browsers (PLAYWRIGHT_BROWSERS_PATH)
 * Ephemeral profiles: server/.chromium-profiles/run-*
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(SERVER_DIR, '..');

function browsersPath() {
  return process.env.PLAYWRIGHT_BROWSERS_PATH
    || path.join(SERVER_DIR, '.playwright-browsers');
}

function profilesPath() {
  return process.env.RIANELL_CHROMIUM_PROFILES
    || path.join(SERVER_DIR, '.chromium-profiles');
}

function playwrightEnv() {
  return {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: browsersPath(),
  };
}

async function loadPlaywright() {
  const candidates = [
    'playwright',
    path.join(PROJECT_ROOT, 'node_modules', 'playwright', 'index.mjs'),
    path.join(PROJECT_ROOT, 'benchmarks', 'node_modules', 'playwright', 'index.mjs'),
  ];
  for (const spec of candidates) {
    try {
      return await import(spec);
    } catch {
      // try next
    }
  }
  throw new Error(
    'Playwright is not installed. From repo root run: npm ci (or npm install in benchmarks/).',
  );
}

function findChromiumExecutable() {
  const root = browsersPath();
  if (!fs.existsSync(root)) return null;
  if (process.platform === 'win32') {
    const hits = [];
    walk(root, (p) => {
      if (p.endsWith('chrome.exe') && (p.includes('chrome-win') || p.includes('chrome-win64'))) hits.push(p);
    });
    return hits[0] || null;
  }
  if (process.platform === 'darwin') {
    let found = null;
    walk(root, (p) => {
      if (p.endsWith('Chromium.app/Contents/MacOS/Chromium')) found = p;
    });
    return found;
  }
  let found = null;
  walk(root, (p) => {
    if (p.endsWith(path.join('chrome-linux', 'chrome'))) found = p;
  });
  return found;
}

function walk(dir, fn) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, fn);
    else fn(full);
  }
}

function parseArgs(argv) {
  const out = {
    command: argv[0] || 'status',
    url: 'http://127.0.0.1:8080/',
    watchReload: true,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--url' && argv[i + 1]) {
      out.url = argv[++i];
    } else if (a === '--no-watch-reload') {
      out.watchReload = false;
    } else if (a === '--watch-reload') {
      out.watchReload = true;
    } else if (a.startsWith('http://') || a.startsWith('https://')) {
      out.url = a;
    }
  }
  return out;
}

/** Loopback hosts where the Python dev server exposes /api/reload (same gate as PWA index.html). */
function isDevReloadHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function parseSseEvents(buffer) {
  const events = [];
  let rest = buffer;
  let sep;
  while ((sep = rest.indexOf('\n\n')) >= 0) {
    const block = rest.slice(0, sep);
    rest = rest.slice(sep + 2);
    for (const line of block.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        // ignore malformed chunks
      }
    }
  }
  return { events, rest };
}

/**
 * Subscribe to the server's SSE reload stream and invoke onReload for each push.
 * Mirrors connectToReloadStream() in apps/pwa-webapp/app.js (localhost dev only).
 */
async function watchDevReloadStream(pageUrl, onReload) {
  const origin = new URL(pageUrl).origin;
  const host = new URL(pageUrl).hostname;
  if (!isDevReloadHost(host)) {
    console.log(`Live reload watcher skipped (non-loopback host: ${host})`);
    return;
  }

  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(`${origin}/api/reload`, {
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok || !res.body) {
        throw new Error(`SSE HTTP ${res.status}`);
      }

      attempt = 0;
      console.log(`Live reload: connected to ${origin}/api/reload`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parsed = parseSseEvents(buf);
        buf = parsed.rest;
        for (const data of parsed.events) {
          if (data && data.type === 'reload') {
            console.log('Live reload: server push — refreshing page…');
            await onReload();
          }
        }
      }
    } catch (err) {
      attempt += 1;
      const delay = Math.min(2000 * 2 ** (attempt - 1), 16000);
      console.warn(`Live reload: reconnecting in ${delay}ms (${err?.message || err})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function cmdInstall() {
  fs.mkdirSync(browsersPath(), { recursive: true });
  console.log(`Installing Chromium into ${browsersPath()} …`);
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    npx,
    ['playwright', 'install', 'chromium'],
    {
      cwd: PROJECT_ROOT,
      env: playwrightEnv(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
  const exe = findChromiumExecutable();
  if (!exe) {
    console.error('Install finished but Chromium executable was not found.');
    process.exit(1);
  }
  console.log(`Chromium ready: ${exe}`);
}

async function cmdLaunch(url, options = {}) {
  const watchReload = options.watchReload !== false;
  fs.mkdirSync(profilesPath(), { recursive: true });
  const sessionDir = fs.mkdtempSync(path.join(profilesPath(), 'run-'));
  const pw = await loadPlaywright();
  const executablePath = findChromiumExecutable() || undefined;
  if (!executablePath) {
    console.error('Chromium is not installed. Run: node server/scripts/chromium-dev.mjs install');
    process.exit(1);
  }

  console.log(`Launching clean Chromium → ${url}`);
  console.log(`Profile (ephemeral): ${sessionDir}`);
  if (watchReload && isDevReloadHost(new URL(url).hostname)) {
    console.log('Live reload: enabled (same /api/reload stream as “Open app in browser”)');
  }

  const browser = await pw.chromium.launch({
    headless: false,
    executablePath,
    args: [
      '--disable-sync',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-component-update',
    ],
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: null,
  });
  context.setDefaultNavigationTimeout(120_000);
  await context.addInitScript(() => {
    window.__rianellExternalReloadWatcher = true;
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (watchReload) {
    watchDevReloadStream(url, async () => {
      try {
        await page.reload({ waitUntil: 'domcontentloaded' });
      } catch {
        // ignore reload races while the tab is closing
      }
    });
  }

  const cleanup = () => {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  };

  browser.on('disconnected', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    try {
      await browser.close();
    } catch {
      // ignore
    }
    cleanup();
    process.exit(0);
  });
}

function cmdStatus() {
  const exe = findChromiumExecutable();
  const payload = {
    installed: !!exe,
    browsersPath: browsersPath(),
    profilesPath: profilesPath(),
    executable: exe,
    platform: process.platform,
  };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exe ? 0 : 1);
}

async function main() {
  const { command, url, watchReload } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'install':
      cmdInstall();
      break;
    case 'launch':
      await cmdLaunch(url, { watchReload });
      break;
    case 'status':
      cmdStatus();
      break;
    default:
      console.error(`Unknown command: ${command}. Use install | launch | status`);
      process.exit(2);
  }
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
