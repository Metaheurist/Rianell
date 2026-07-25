import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('requirements.txt pins supabase stack peers for pip resolver', () => {
  const req = readFileSync('requirements.txt', 'utf8');
  assert.match(req, /supabase>=2\.31/);
  assert.match(req, /pydantic>=2\.13\.4,<3/);
  assert.match(req, /websockets>=15\.0\.1,<16/);
  assert.match(req, /cryptography>=49\.0\.0/);
  assert.match(req, /watchdog>=6\.0\.0/);
  assert.match(req, /psycopg\[binary\]>=3\.3\.4/);
  assert.match(req, /psycopg2-binary>=2\.9\.12/);
  assert.doesNotMatch(req, /PyQt6/);
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
