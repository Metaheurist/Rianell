"""
Isolated Chromium for local server debugging — no daily-browser cache or profile.

Browsers live under server/.playwright-browsers (Playwright download).
Each launch uses a fresh ephemeral profile under server/.chromium-profiles/.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path
from typing import Callable, Optional, Tuple

from . import config

logger = logging.getLogger('Rianell')

CHROMIUM_SCRIPT = Path(__file__).resolve().parent / 'scripts' / 'chromium-dev.mjs'
CHROMIUM_BROWSERS_DIR = Path(__file__).resolve().parent / '.playwright-browsers'
CHROMIUM_PROFILES_DIR = Path(__file__).resolve().parent / '.chromium-profiles'


def _node_executable() -> Optional[str]:
    return shutil.which('node')


def chromium_env() -> dict:
    env = os.environ.copy()
    env['PLAYWRIGHT_BROWSERS_PATH'] = str(CHROMIUM_BROWSERS_DIR)
    env['RIANELL_CHROMIUM_PROFILES'] = str(CHROMIUM_PROFILES_DIR)
    return env


def chromium_status() -> dict:
    """Return install paths and whether Chromium is present."""
    node = _node_executable()
    if not node or not CHROMIUM_SCRIPT.is_file():
        return {
            'installed': False,
            'nodeAvailable': bool(node),
            'scriptPresent': CHROMIUM_SCRIPT.is_file(),
            'browsersPath': str(CHROMIUM_BROWSERS_DIR),
            'profilesPath': str(CHROMIUM_PROFILES_DIR),
            'executable': None,
        }
    try:
        result = subprocess.run(
            [node, str(CHROMIUM_SCRIPT), 'status'],
            env=chromium_env(),
            cwd=str(config.PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout)
            data['nodeAvailable'] = True
            data['scriptPresent'] = True
            return data
    except (json.JSONDecodeError, subprocess.TimeoutExpired, OSError) as exc:
        logger.debug('chromium_status failed: %s', exc)
    return {
        'installed': _find_chromium_executable() is not None,
        'nodeAvailable': True,
        'scriptPresent': True,
        'browsersPath': str(CHROMIUM_BROWSERS_DIR),
        'profilesPath': str(CHROMIUM_PROFILES_DIR),
        'executable': _find_chromium_executable(),
    }


def _find_chromium_executable() -> Optional[str]:
    root = CHROMIUM_BROWSERS_DIR
    if not root.is_dir():
        return None
    if sys.platform == 'win32':
        for exe in root.rglob('chrome.exe'):
            parts = exe.parts
            if any(p.startswith('chrome-win') for p in parts):
                return str(exe)
        return None
    if sys.platform == 'darwin':
        for app in root.rglob('Chromium'):
            if app.is_file() and 'MacOS' in app.parts:
                return str(app)
        return None
    for exe in root.rglob('chrome'):
        if exe.is_file() and 'chrome-linux' in exe.parts:
            return str(exe)
    return None


def is_chromium_installed() -> bool:
    return bool(chromium_status().get('installed'))


def install_chromium(
    on_progress: Optional[Callable[[str], None]] = None,
) -> Tuple[bool, str]:
    """Download Chromium via Playwright into server/.playwright-browsers."""
    node = _node_executable()
    if not node:
        return False, 'Node.js was not found on PATH. Install Node 20+ from nodejs.org.'
    if not CHROMIUM_SCRIPT.is_file():
        return False, f'Missing launcher script: {CHROMIUM_SCRIPT}'

    CHROMIUM_BROWSERS_DIR.mkdir(parents=True, exist_ok=True)

    if on_progress:
        on_progress('Downloading Chromium (Playwright)… this may take a few minutes.')

    logger.info('Installing dev Chromium into %s', CHROMIUM_BROWSERS_DIR)
    try:
        proc = subprocess.run(
            [node, str(CHROMIUM_SCRIPT), 'install'],
            env=chromium_env(),
            cwd=str(config.PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=900,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return False, 'Chromium install timed out after 15 minutes.'
    except OSError as exc:
        return False, str(exc)

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or '').strip()[:500]
        return False, detail or f'Install failed (exit {proc.returncode}). Run npm ci at repo root first.'

    if is_chromium_installed():
        exe = _find_chromium_executable()
        msg = f'Chromium installed under server/.playwright-browsers'
        if exe:
            msg += f'\n{exe}'
        logger.info(msg.replace('\n', ' | '))
        return True, msg
    return False, 'Install finished but Chromium executable was not found.'


def launch_clean_chromium(url: str, watch_reload: bool = True) -> Tuple[bool, str]:
    """Open url in a detached, ephemeral-profile Chromium window."""
    node = _node_executable()
    if not node:
        return False, 'Node.js was not found on PATH.'
    if not CHROMIUM_SCRIPT.is_file():
        return False, f'Missing launcher script: {CHROMIUM_SCRIPT}'
    if not is_chromium_installed():
        return False, (
            'Chromium is not installed yet. Use "Download Chromium" in the server dashboard '
            'or run: python -m server.chromium_dev install'
        )

    CHROMIUM_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [node, str(CHROMIUM_SCRIPT), 'launch', '--url', url]
    if not watch_reload:
        cmd.append('--no-watch-reload')
    logger.info('Launching clean Chromium: %s', url)

    try:
        kwargs = {
            'env': chromium_env(),
            'cwd': str(config.PROJECT_ROOT),
            'stdin': subprocess.DEVNULL,
        }
        if sys.platform == 'win32':
            subprocess.Popen(
                cmd,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS,  # type: ignore[attr-defined]
                close_fds=True,
                **kwargs,
            )
        else:
            subprocess.Popen(cmd, start_new_session=True, **kwargs)
    except OSError as exc:
        logger.error('Failed to launch Chromium: %s', exc)
        return False, str(exc)

    return True, (
        f'Clean Chromium opened at {url}'
        + (' (live reload via /api/reload enabled)' if watch_reload else '')
    )


def install_chromium_async(
    on_done: Callable[[bool, str], None],
    on_progress: Optional[Callable[[str], None]] = None,
) -> None:
    def worker():
        ok, msg = install_chromium(on_progress=on_progress)
        on_done(ok, msg)

    threading.Thread(target=worker, daemon=True).start()


def cli_main(argv: Optional[list] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(
        description='Dev Chromium for Rianell local server (isolated cache/profile).',
    )
    parser.add_argument(
        'command',
        nargs='?',
        choices=('status', 'install', 'launch'),
        default='status',
    )
    parser.add_argument('--url', default=f'http://127.0.0.1:{config.PORT}/')
    args = parser.parse_args(argv)

    if args.command == 'status':
        print(json.dumps(chromium_status(), indent=2))
        return 0 if is_chromium_installed() else 1
    if args.command == 'install':
        ok, msg = install_chromium(on_progress=print)
        print(msg)
        return 0 if ok else 1
    if args.command == 'launch':
        ok, msg = launch_clean_chromium(args.url)
        print(msg)
        return 0 if ok else 1
    return 2


if __name__ == '__main__':
    raise SystemExit(cli_main())
