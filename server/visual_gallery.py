"""
Current visual gallery — Node dump cache + HTML for the debug server.

Python runs `node scripts/dev/visual-current-gallery.mjs --json --limit=0` once,
caches the full payload (invalidated by register/overrides mtimes), then slices
for /api/visual-gallery pagination.
"""
from __future__ import annotations

import json
import logging
import re
import shutil
import subprocess
import threading
from pathlib import Path
from typing import Any, Optional
from urllib.parse import parse_qs

from . import config

logger = logging.getLogger('Rianell')

GALLERY_SCRIPT = config.PROJECT_ROOT / 'scripts' / 'dev' / 'visual-current-gallery.mjs'
GALLERY_HTML = config.PROJECT_ROOT / 'scripts' / 'dev' / 'visual-current-gallery.html'
GALLERY_SKIN_CSS = config.PROJECT_ROOT / 'scripts' / 'dev' / 'visual-gallery-skin.css'
REGISTER_PATH = config.PROJECT_ROOT / 'apps' / 'pwa-webapp' / 'assets' / 'visual-register.json'
OVERRIDES_PATH = config.PROJECT_ROOT / 'apps' / 'pwa-webapp' / 'modules' / 'visual-overrides.generated.js'

_cache_lock = threading.Lock()
_cache: dict[str, Any] = {
    'payload': None,
    'mtimes': None,
    'error': None,
}

NODE_TIMEOUT_SEC = 120


def gallery_html_path() -> Path:
    return GALLERY_HTML


def gallery_skin_css_path() -> Path:
    return GALLERY_SKIN_CSS


def gallery_html_with_skin() -> bytes:
    """HTML with shared skin inlined so /dev/visual-gallery never ships unstyled."""
    html = GALLERY_HTML.read_text(encoding='utf-8') if GALLERY_HTML.is_file() else ''
    if not html:
        return b''
    if GALLERY_SKIN_CSS.is_file():
        css = GALLERY_SKIN_CSS.read_text(encoding='utf-8')
        style = f'<style id="visual-gallery-skin">\n{css}\n</style>'
        html = re.sub(
            r'<link\s+rel=["\']stylesheet["\']\s+href=["\']/visual-gallery-skin\.css["\']\s*/?>',
            style,
            html,
            count=1,
            flags=re.IGNORECASE,
        )
    return html.encode('utf-8')


def _source_mtimes() -> tuple[float, ...]:
    paths = (REGISTER_PATH, OVERRIDES_PATH, GALLERY_SCRIPT)
    out: list[float] = []
    for p in paths:
        try:
            out.append(p.stat().st_mtime if p.is_file() else 0.0)
        except OSError:
            out.append(0.0)
    return tuple(out)


def _node_executable() -> Optional[str]:
    return shutil.which('node')


def _run_full_dump() -> dict[str, Any]:
    node = _node_executable()
    if not node:
        return {'error': 'Node.js not found on PATH', 'counts': {}, 'items': []}
    if not GALLERY_SCRIPT.is_file():
        return {'error': f'Gallery script missing: {GALLERY_SCRIPT}', 'counts': {}, 'items': []}
    try:
        result = subprocess.run(
            [node, str(GALLERY_SCRIPT), '--json', '--limit=0'],
            cwd=str(config.PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=NODE_TIMEOUT_SEC,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {'error': f'Gallery dump timed out after {NODE_TIMEOUT_SEC}s', 'counts': {}, 'items': []}
    except OSError as exc:
        return {'error': f'Failed to run Node gallery dump: {exc}', 'counts': {}, 'items': []}

    if result.returncode != 0:
        err = (result.stderr or result.stdout or '').strip() or f'exit {result.returncode}'
        return {'error': f'Gallery dump failed: {err[:500]}', 'counts': {}, 'items': []}

    raw = (result.stdout or '').strip()
    if not raw:
        return {'error': 'Gallery dump returned empty stdout', 'counts': {}, 'items': []}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        return {'error': f'Gallery dump JSON parse error: {exc}', 'counts': {}, 'items': []}
    if not isinstance(data, dict):
        return {'error': 'Gallery dump was not a JSON object', 'counts': {}, 'items': []}
    return data


def get_full_gallery(force: bool = False) -> dict[str, Any]:
    """Return cached full gallery payload (all items)."""
    mtimes = _source_mtimes()
    with _cache_lock:
        if (
            not force
            and _cache['payload'] is not None
            and _cache['mtimes'] == mtimes
        ):
            return _cache['payload']

    data = _run_full_dump()
    with _cache_lock:
        _cache['payload'] = data
        _cache['mtimes'] = mtimes
        _cache['error'] = data.get('error')
        return data


def slice_gallery(
    *,
    limit: Optional[int] = 10,
    offset: int = 0,
    id_filter: Optional[str] = None,
) -> dict[str, Any]:
    """Paginate the cached full dump for the HTTP API."""
    full = get_full_gallery()
    if full.get('error') and not full.get('items'):
        return {
            'error': full['error'],
            'updatedAt': full.get('updatedAt'),
            'mode': 'current',
            'counts': {
                'totalMatching': 0,
                'showing': 0,
                'overrideCount': 0,
                'offset': offset,
                'limit': limit if limit is not None else 0,
                'registerTotal': 0,
                'skipped': 0,
            },
            'items': [],
        }

    items = list(full.get('items') or [])
    if id_filter:
        items = [it for it in items if it.get('id') == id_filter]

    total = len(items)
    off = max(0, int(offset or 0))
    if limit is None or limit == 0:
        page = items[off:]
        lim = total
    else:
        lim = max(1, int(limit))
        page = items[off:off + lim]

    base_counts = dict(full.get('counts') or {})
    return {
        'updatedAt': full.get('updatedAt'),
        'mode': full.get('mode') or 'current',
        'counts': {
            **base_counts,
            'totalMatching': total if id_filter else base_counts.get('totalMatching', total),
            'showing': len(page),
            'offset': off,
            'limit': lim if limit != 0 else 0,
            'overrideCount': base_counts.get('overrideCount', 0),
            'registerTotal': base_counts.get('registerTotal', 0),
            'skipped': base_counts.get('skipped', 0),
        },
        'items': page,
        **({'error': full['error']} if full.get('error') else {}),
    }


def parse_gallery_query(query_string: str) -> dict[str, Any]:
    qs = parse_qs(query_string or '')
    limit_raw = (qs.get('limit') or [None])[0]
    offset_raw = (qs.get('offset') or ['0'])[0]
    id_raw = (qs.get('id') or [None])[0]
    if limit_raw is None:
        limit: Optional[int] = 10
    elif str(limit_raw) == '0':
        limit = 0
    else:
        try:
            limit = int(limit_raw)
        except (TypeError, ValueError):
            limit = 10
    try:
        offset = int(offset_raw or 0)
    except (TypeError, ValueError):
        offset = 0
    return {
        'limit': limit,
        'offset': offset,
        'id_filter': id_raw or None,
    }
