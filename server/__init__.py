# Rianell server package - modular HTTP server for the web app
from pathlib import Path

# Project root (parent of this package)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEB_DIR = PROJECT_ROOT / 'apps' / 'pwa-webapp'

__all__ = ['PROJECT_ROOT', 'WEB_DIR']
