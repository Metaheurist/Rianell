"""
Local Agentic AIO harness — HTML shell + Node control-plane bridge.
Loopback-only; see /api/agentic/* handlers in routes/api.py.
"""
from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

from . import config

logger = config.logger

REPO_ROOT = Path(__file__).resolve().parent.parent
CONSOLE_DIR = REPO_ROOT / 'scripts' / 'dev' / 'agentic-console'
CATALOG_PATH = REPO_ROOT / 'scripts' / 'dev' / 'agentic-pipeline' / 'model-catalog.json'
MODE_PATH = REPO_ROOT / 'artifacts' / 'agentic' / 'mode.json'
VISUAL_LIVE_URL = 'http://127.0.0.1:8766/'
PACK_IDS = (
    'design', 'planning', 'i18n', 'rtl', 'a11y', 'seo', 'privacy', 'security',
    'deps', 'migration', 'changelog', 'wikisync', 'image', 'bootllm', 'perf', 'visual',
)


def console_index_path() -> Path:
    return CONSOLE_DIR / 'index.html'


def console_html() -> bytes:
    path = console_index_path()
    if not path.is_file():
        return b''
    return path.read_bytes()


def console_asset(rel: str) -> Optional[tuple[bytes, str]]:
    """Serve files under scripts/dev/agentic-console/ (no path escape)."""
    clean = (rel or '').lstrip('/').replace('\\', '/')
    if not clean or '..' in clean.split('/'):
        return None
    path = (CONSOLE_DIR / clean).resolve()
    try:
        path.relative_to(CONSOLE_DIR.resolve())
    except ValueError:
        return None
    if not path.is_file():
        return None
    suffix = path.suffix.lower()
    ctype = {
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml',
    }.get(suffix, 'application/octet-stream')
    return path.read_bytes(), ctype


def load_catalog() -> dict:
    if not CATALOG_PATH.is_file():
        return {'packs': {}, 'runAllOrder': list(PACK_IDS)}
    return json.loads(CATALOG_PATH.read_text(encoding='utf-8'))


def get_mode() -> dict[str, Any]:
    if MODE_PATH.is_file():
        try:
            return json.loads(MODE_PATH.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            pass
    return {'mode': 'serial'}


def set_mode(mode: str) -> dict[str, Any]:
    if mode not in ('serial', 'parallel', 'dry-run'):
        return {'ok': False, 'error': {'code': 'bad_mode', 'message': mode}, 'data': None}
    MODE_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {'mode': mode}
    MODE_PATH.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    return {'ok': True, 'error': None, 'data': payload}


def visual_live_status() -> dict[str, Any]:
    reachable = False
    try:
        req = urllib.request.Request(VISUAL_LIVE_URL, method='GET')
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            reachable = 200 <= getattr(resp, 'status', 200) < 500
    except (urllib.error.URLError, TimeoutError, OSError):
        reachable = False
    return {
        'liveUrl': VISUAL_LIVE_URL,
        'reachable': reachable,
        'applyDeferred': True,
        'hint': 'npm run visual:polish:live',
    }


def _node(args: list[str], timeout: int = 120) -> dict[str, Any]:
    cmd = ['node', *args]
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
    except Exception as e:
        return {'ok': False, 'error': {'code': 'spawn', 'message': str(e)}, 'data': None}
    out = (proc.stdout or '').strip()
    try:
        data = json.loads(out) if out else None
    except json.JSONDecodeError:
        data = {'raw': out[-4000:], 'stderr': (proc.stderr or '')[-2000:]}
    if proc.returncode != 0:
        return {
            'ok': False,
            'error': {
                'code': 'node_exit',
                'message': (proc.stderr or out or f'exit {proc.returncode}')[:500],
            },
            'data': data,
        }
    return {'ok': True, 'error': None, 'data': data}


def run_pack(pack_id: str, dry_run: bool = False) -> dict[str, Any]:
    if pack_id not in PACK_IDS:
        return {'ok': False, 'error': {'code': 'unknown_pack', 'message': pack_id}, 'data': None}
    args = ['scripts/ci/agentic-pack-cli.mjs', pack_id]
    if dry_run:
        args.append('--dry-run')
    return _node(args, timeout=600)


def run_all(dry_run: bool = False, skip: Optional[list[str]] = None) -> dict[str, Any]:
    args = ['scripts/ci/agentic-run-all.mjs']
    if dry_run:
        args.append('--dry-run')
    if skip:
        args.append('--skip=' + ','.join(skip))
    return _node(args, timeout=3600)


def pack_status(pack_id: str) -> dict[str, Any]:
    return _node(['scripts/dev/agentic-pipeline/cli-state.mjs', '--status', f'--pack={pack_id}'])


def global_status() -> dict[str, Any]:
    return _node(['scripts/dev/agentic-pipeline/cli-state.mjs', '--status'])


def hw_profile() -> dict[str, Any]:
    return _node(['scripts/dev/probe-hardware-profile.mjs'])


def ollama_model_action(action: str, model: str) -> dict[str, Any]:
    if action not in ('load', 'unload') or not model:
        return {'ok': False, 'error': {'code': 'bad_args', 'message': 'model required'}, 'data': None}
    return _node([
        'scripts/dev/agentic-pipeline/ollama-cli.mjs',
        f'--{action}',
        f'--model={model}',
    ], timeout=120)


def envelope(ok: bool, data: Any = None, error: Any = None, pack: str | None = None) -> dict:
    return {
        'ok': ok,
        'schemaVersion': 1,
        'pack': pack,
        'data': data,
        'error': error,
    }
