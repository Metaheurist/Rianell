"""
Local Agentic AIO harness — HTML shell + Node control-plane bridge.
Loopback-only; see /api/agentic/* handlers in routes/api.py.
"""
from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
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
    """Return extended mode prefs (serial + approval defaults)."""
    result = _node(['scripts/dev/agentic-pipeline/mode-prefs-cli.mjs', '--get'])
    inner = result.get('data')
    if isinstance(inner, dict) and inner.get('ok') and isinstance(inner.get('data'), dict):
        return inner['data']
    if isinstance(inner, dict) and 'mode' in inner:
        return inner
    if MODE_PATH.is_file():
        try:
            return json.loads(MODE_PATH.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            pass
    return {
        'mode': 'serial',
        'autoApprove': False,
        'autoApproveMode': 'ack',
        'confirmProductWrite': False,
        'allowDependencyBump': False,
        'gitCommitOnApprove': False,
        'i18nFillScope': 'full',
    }


def set_mode(mode_or_patch) -> dict[str, Any]:
    """Accept legacy string mode or a prefs patch object."""
    if isinstance(mode_or_patch, str):
        patch = {'mode': mode_or_patch}
    elif isinstance(mode_or_patch, dict):
        patch = mode_or_patch
    else:
        return {'ok': False, 'error': {'code': 'bad_mode', 'message': 'invalid'}, 'data': None}
    args = ['scripts/dev/agentic-pipeline/mode-prefs-cli.mjs', '--set']
    args.append('--json=' + json.dumps(patch))
    result = _node(args)
    inner = result.get('data')
    if isinstance(inner, dict) and 'ok' in inner:
        return {
            'ok': bool(inner.get('ok')),
            'data': inner.get('data'),
            'error': inner.get('error') or result.get('error'),
        }
    return result


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


def run_all_state_path() -> Path:
    return REPO_ROOT / 'artifacts' / 'agentic' / 'run-all-state.json'


def read_run_all_state() -> dict[str, Any]:
    path = run_all_state_path()
    if not path.is_file():
        return {'status': 'idle', 'order': list(PACK_IDS), 'results': {}}
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        return {'status': 'idle', 'order': list(PACK_IDS), 'results': {}, 'error': 'corrupt state'}


def run_all(
    dry_run: bool = False,
    skip: Optional[list[str]] = None,
    background: Optional[bool] = None,
    auto_approve: bool = False,
    auto_approve_mode: str = 'ack',
    confirm_product_write: bool = False,
    allow_dependency_bump: bool = False,
    git_commit_on_approve: bool = False,
) -> dict[str, Any]:
    """Run chronological pack sequence. Live runs default to background so UI can poll."""
    if background is None:
        background = not dry_run
    args = ['scripts/ci/agentic-run-all.mjs']
    if dry_run:
        args.append('--dry-run')
    if skip:
        args.append('--skip=' + ','.join(skip))
    if auto_approve:
        args.append('--auto-approve')
        args.append(f'--auto-approve-mode={auto_approve_mode or "ack"}')
    if confirm_product_write:
        args.append('--confirm-product-write')
    if allow_dependency_bump:
        args.append('--allow-dependency-bump')
    if git_commit_on_approve:
        args.append('--git-commit-on-approve')

    if not background:
        return _node(args, timeout=3600)

    current = read_run_all_state()
    if current.get('status') in ('running', 'paused'):
        return {
            'ok': False,
            'error': {
                'code': 'busy',
                'message': f"run-all already {current.get('status')}",
            },
            'data': current,
        }

    # Seed optimistic state so GET /run-all shows progress immediately.
    seed = {
        'status': 'running',
        'stepIndex': 0,
        'order': [p for p in PACK_IDS if p not in (skip or [])],
        'skip': list(skip or []),
        'currentPack': None,
        'results': {},
        'dryRun': dry_run,
        'startedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z',
        'background': True,
    }
    run_all_state_path().parent.mkdir(parents=True, exist_ok=True)
    run_all_state_path().write_text(json.dumps(seed, indent=2) + '\n', encoding='utf-8')

    log_path = REPO_ROOT / 'artifacts' / 'agentic' / 'run-all-worker.log'
    try:
        log_f = open(log_path, 'a', encoding='utf-8')
    except OSError:
        log_f = subprocess.DEVNULL
    try:
        subprocess.Popen(
            ['node', *args],
            cwd=str(REPO_ROOT),
            stdout=log_f,
            stderr=subprocess.STDOUT,
            shell=False,
        )
    except Exception as e:
        return {'ok': False, 'error': {'code': 'spawn', 'message': str(e)}, 'data': seed}
    return {'ok': True, 'error': None, 'data': seed}


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


def approval_action(action: str, pack: str | None = None, body: Optional[dict] = None) -> dict[str, Any]:
    """Bridge to approval-cli.mjs / activity helpers."""
    body = body or {}
    args = ['scripts/dev/agentic-pipeline/approval-cli.mjs', f'--action={action}']
    if pack:
        args.append(f'--pack={pack}')
    if body.get('itemIds') is not None:
        args.append('--itemIds=' + json.dumps(body.get('itemIds')))
    if 'selected' in body:
        args.append(f"--selected={'true' if body.get('selected') else 'false'}")
    if body.get('confirmProductWrite'):
        args.append('--confirmProductWrite')
    if body.get('allowDependencyBump'):
        args.append('--allowDependencyBump')
    if body.get('gitCommitOnApprove'):
        args.append('--gitCommitOnApprove')
    if body.get('by'):
        args.append(f"--by={body.get('by')}")
    result = _node(args, timeout=600)
    # approval-cli prints { ok, data, error } — unwrap for envelope helpers
    inner = result.get('data')
    if isinstance(inner, dict) and 'ok' in inner and ('data' in inner or 'error' in inner):
        return {
            'ok': bool(inner.get('ok')),
            'data': inner.get('data'),
            'error': inner.get('error') or result.get('error'),
        }
    return result


def visual_qa() -> dict[str, Any]:
    return approval_action('visual-qa')


def clear_all_and_unload() -> dict[str, Any]:
    """Reset pack/run-all runtime state and unload Ollama models in VRAM."""
    result = _node(['scripts/dev/agentic-pipeline/clear-all.mjs'], timeout=180)
    inner = result.get('data')
    if isinstance(inner, dict) and 'ok' in inner and ('data' in inner or 'error' in inner):
        return {
            'ok': bool(inner.get('ok')),
            'data': inner.get('data'),
            'error': inner.get('error') or result.get('error'),
        }
    return result
