"""
Check and install Python requirements.
"""
import sys
import subprocess

from . import config


def _probe_import(import_name):
    """Return None if import succeeds, else a short error string (any failure, not only ImportError)."""
    try:
        __import__(import_name)
        return None
    except Exception as e:
        return str(e)


def check_requirements():
    """
    Check required runtime packages. Returns list of (import_name, display_name, error).
    Catches version skew (e.g. pydantic vs pydantic-core) that surfaces as SystemError, not ImportError.
    """
    issues = []
    packages_to_check = [
        ('supabase', 'supabase'),
        ('cryptography', 'cryptography'),
    ]
    for import_name, display_name in packages_to_check:
        err = _probe_import(import_name)
        if err:
            issues.append((import_name, display_name, err))
    return issues


def missing_packages_legacy():
    """Backward-compatible shape: [(import_name, display_name), ...] for callers expecting ImportError-only."""
    return [(name, label) for name, label, _err in check_requirements()]


def install_requirements_local():
    """Install to local lib - disabled by default."""
    config.logger.debug("Local lib installation disabled - using system-wide installation instead")
    return False


def sync_requirements(upgrade=False):
    """
    Install/align packages from requirements.txt using pip's resolver.
    upgrade=False: satisfy constraints only (fast, fixes mismatched peers).
    upgrade=True: prefer newest versions within constraints.
    """
    if not config.REQUIREMENTS_FILE.exists():
        config.logger.warning("requirements.txt not found at %s", config.REQUIREMENTS_FILE)
        return False
    cmd = [sys.executable, '-m', 'pip', 'install', '-r', str(config.REQUIREMENTS_FILE)]
    if upgrade:
        cmd.append('--upgrade')
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode == 0:
            config.logger.info("Python requirements satisfied (%s)", config.REQUIREMENTS_FILE.name)
            return True
        config.logger.warning(
            "pip install failed (exit %s). stderr: %s",
            result.returncode,
            (result.stderr or result.stdout or '').strip()[:500],
        )
        return False
    except Exception as e:
        config.logger.warning("Error syncing requirements: %s", e)
        return False


def install_requirements():
    """Install requirements.txt - tries local first, falls back to system."""
    if install_requirements_local():
        return True
    config.logger.info("Syncing Python requirements (system-wide)...")
    ok = sync_requirements(upgrade=False)
    if ok:
        print("Requirements installed successfully (system-wide)")
    else:
        print("Failed to install requirements. Check server logs or run: pip install -r requirements.txt")
    return ok
