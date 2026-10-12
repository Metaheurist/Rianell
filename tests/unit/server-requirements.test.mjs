import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function floorOf(req, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = req.match(new RegExp(`^${esc}>=([0-9.]+)`, 'm'));
  return m ? m[1] : null;
}

function atLeast(version, minimum) {
  const a = version.split('.').map(Number);
  const b = minimum.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return true;
}

// Minimum floors (OSV-clean / resolver-safe); Dependabot may raise them freely.
const MIN_FLOORS = {
  supabase: '2.31',
  pydantic: '2.13.4',
  websockets: '15.0.1',
  cryptography: '49.0.0',
  watchdog: '6.0.0',
  'psycopg[binary]': '3.3.4',
  'psycopg2-binary': '2.9.12',
  'python-dotenv': '1.2.2',
};

test('requirements.txt keeps supabase stack peers at or above their safe floors', () => {
  const req = readFileSync('requirements.txt', 'utf8');
  for (const [name, minimum] of Object.entries(MIN_FLOORS)) {
    const floor = floorOf(req, name);
    assert.ok(floor, `${name} has a >= floor`);
    assert.ok(atLeast(floor, minimum), `${name}>=${floor} is below ${minimum}`);
  }
  assert.match(req, /^pydantic>=[0-9.]+,<3\r?$/m, 'pydantic stays below 3');
  assert.match(req, /^websockets>=[0-9.]+,<16\r?$/m, 'realtime needs websockets<16');
  assert.doesNotMatch(req, /PyQt6/);
});

test('floor check rejects a downgrade', () => {
  assert.equal(atLeast('50.0.1', '49.0.0'), true);
  assert.equal(atLeast('2.13.5', '2.13.4'), true);
  assert.equal(atLeast('2.9.11', '2.9.12'), false);
  assert.equal(floorOf('cryptography>=48.0.1\n', 'cryptography'), '48.0.1');
});

test('supabase availability probe tolerates version skew', () => {
  const src = readFileSync('server/supabase_client.py', 'utf8');
  assert.match(src, /except Exception as e/);
  assert.match(src, /Never raises/);
  assert.doesNotMatch(src, /except ImportError:\s+pass\s+SUPABASE_AVAILABLE = False/);
});

test('requirements_check probes imports beyond ImportError', () => {
  const src = readFileSync('server/requirements_check.py', 'utf8');
  assert.match(src, /def _probe_import/);
  assert.match(src, /except Exception as e/);
  assert.match(src, /def sync_requirements/);
});

test('launch-server.ps1 syncs pip before starting Python', () => {
  const ps1 = readFileSync('server/launch-server.ps1', 'utf8');
  assert.match(ps1, /pip install -r \$reqFile/);
  assert.match(ps1, /-m['"]?\s*,?\s*['"]?server|'-m', 'server'/);
  assert.match(ps1, /pythonw|pyw/);
  assert.match(ps1, /\[switch\]\$Console/);
});

test('server dashboard uses modular responsive Tk UI', () => {
  const main = readFileSync('server/main.py', 'utf8');
  const ui = readFileSync('server/dashboard_ui.py', 'utf8');
  const icons = readFileSync('server/dashboard_icons.py', 'utf8');
  assert.match(main, /dashboard_ui\.create_dashboard/);
  assert.match(main, /TKINTER_AVAILABLE/);
  assert.match(ui, /def create_dashboard/);
  assert.match(ui, /portrait_mode/);
  assert.match(ui, /IconButton/);
  assert.match(ui, /Visual gallery/);
  assert.match(ui, /\/dev\/visual-gallery/);
  assert.doesNotMatch(ui, /View here/);
  assert.match(icons, /ICON_PATHS/);
  assert.match(icons, /def draw_icon/);
});

test('supabase client warns on unreachable project host', () => {
  const src = readFileSync('server/supabase_client.py', 'utf8');
  assert.match(src, /warn_if_supabase_url_unreachable/);
  assert.match(src, /socket\.getaddrinfo/);
});
