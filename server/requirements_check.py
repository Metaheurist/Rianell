"""
Check and install Python requirements.
"""
import sys
import subprocess

from . import config


def check_requirements():
    """Check if all required packages are installed."""
    missing_packages = []
    packages_to_check = [
        ('supabase', 'supabase'),
        ('cryptography', 'cryptography'),
    ]
    for import_name, display_name in packages_to_check:
        try:
            __import__(import_name)
        except ImportError:
            missing_packages.append((import_name, display_name))
    return missing_packages


def install_requirements_local():
    """Install to local lib - disabled by default."""
    config.logger.debug("Local lib installation disabled - using system-wide installation instead")
    return False


def install_requirements():
    """Install requirements.txt - tries local first, falls back to system."""
    if install_requirements_local():
        return True
    config.logger.info("Trying system-wide installation...")
    try:
        if not config.REQUIREMENTS_FILE.exists():
            config.logger.warning(f"requirements.txt not found at {config.REQUIREMENTS_FILE}")
            return False
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-r', str(config.REQUIREMENTS_FILE)],
            capture_output=True,
            text=True,
            timeout=300
        )
        if result.returncode == 0:
            print("Requirements installed successfully (system-wide)")
            return True
        print(f"Failed to install requirements. Return code: {result.returncode}")
        if result.stderr:
            print(result.stderr)
        return False
    except Exception as e:
        print(f"Error installing requirements: {e}")
        return False
