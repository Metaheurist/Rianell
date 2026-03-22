"""
Server configuration: paths, logging, environment, and global state.
"""
import os
import sys
import logging
import threading
from pathlib import Path
from collections import defaultdict

# Paths (project root = parent of server package)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = _PROJECT_ROOT
WEB_DIR = _PROJECT_ROOT / 'web'
LOCAL_LIB_DIR = _PROJECT_ROOT / 'lib'
REQUIREMENTS_FILE = _PROJECT_ROOT / 'requirements.txt'
# Secrets and env: prefer security/; root .env is legacy fallback
SECURITY_DIR = _PROJECT_ROOT / 'security'
ENV_FILE = SECURITY_DIR / '.env'
ENV_FILE_LEGACY_ROOT = _PROJECT_ROOT / '.env'
LOG_DIR = _PROJECT_ROOT / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# Optional imports
try:
    from dotenv import load_dotenv
    if ENV_FILE.exists():
        load_dotenv(ENV_FILE)
    elif ENV_FILE_LEGACY_ROOT.exists():
        load_dotenv(ENV_FILE_LEGACY_ROOT)
except ImportError:
    pass

# Logging
from datetime import datetime


class EmojiLogFormatter(logging.Formatter):
    """Prepends an emoji per level for file and console handlers (StreamHandler, FileHandler)."""

    _LEVEL_EMOJI = {
        logging.DEBUG: '🐛',
        logging.INFO: 'ℹ️',
        logging.WARNING: '⚠️',
        logging.ERROR: '❌',
        logging.CRITICAL: '💥',
    }

    def format(self, record):
        line = super().format(record)
        emoji = self._LEVEL_EMOJI.get(record.levelno, '📋')
        # Two spaces after emoji so console shows a clear gap before the timestamp
        return f'{emoji}  {line}'


class BracketLevelFormatter(logging.Formatter):
    """Leading [LEVEL] prefix for the Tkinter dashboard only (ASCII; Tk often mangles emoji)."""

    def format(self, record):
        line = super().format(record)
        return f'[{record.levelname.upper()}]  {line}'


def _console_color_enabled() -> bool:
    """ANSI colors only when stdout is a TTY and NO_COLOR is unset (https://no-color.org/)."""
    if os.environ.get('NO_COLOR', '').strip():
        return False
    if os.environ.get('FORCE_COLOR', '').strip():
        return True
    try:
        return sys.stdout.isatty()
    except Exception:
        return False


def _ansi_level_bracket(levelno: int, text: str) -> str:
    """Wrap [LEVEL] in ANSI colors (bright, readable on dark terminals)."""
    reset = '\033[0m'
    if levelno >= logging.CRITICAL:
        code = '\033[95m'  # bright magenta
    elif levelno >= logging.ERROR:
        code = '\033[91m'  # bright red
    elif levelno >= logging.WARNING:
        code = '\033[93m'  # bright yellow
    elif levelno >= logging.INFO:
        code = '\033[94m'  # bright blue
    else:
        code = '\033[96m'  # bright cyan (DEBUG)
    return f'{code}{text}{reset}'


class ConsoleColorBracketFormatter(logging.Formatter):
    """
    Terminal handler: leading [INFO]/[ERROR]/… with color; plain text when not a TTY or NO_COLOR is set.
    Does not add escape codes to log files.
    """

    def format(self, record):
        line = super().format(record)
        prefix = f'[{record.levelname.upper()}]'
        if _console_color_enabled():
            prefix = _ansi_level_bracket(record.levelno, prefix)
        return f'{prefix}  {line}'


LOG_FORMAT = '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
LOG_DATEFMT = '%Y-%m-%d %H:%M:%S'
log_formatter = EmojiLogFormatter(LOG_FORMAT, datefmt=LOG_DATEFMT)
dashboard_log_formatter = BracketLevelFormatter(LOG_FORMAT, datefmt=LOG_DATEFMT)
console_formatter = ConsoleColorBracketFormatter(LOG_FORMAT, datefmt=LOG_DATEFMT)

LOG_FILE = LOG_DIR / f"rianell_{datetime.now().strftime('%Y%m%d')}.log"
logger = logging.getLogger('Rianell')
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    fh = logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a', delay=False)
    fh.setLevel(logging.DEBUG)
    if hasattr(fh.stream, 'reconfigure'):
        fh.stream.reconfigure(line_buffering=True)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    fh.setFormatter(log_formatter)
    ch.setFormatter(console_formatter)
    logger.addHandler(fh)
    logger.addHandler(ch)
file_handler = logger.handlers[0] if logger.handlers else None

# Env
PORT = int(os.getenv('PORT', '8080'))
# Default bind: loopback only. Set HOST=0.0.0.0 in security/.env (or legacy root .env) for LAN.
_host_raw = os.getenv('HOST', '127.0.0.1')
HOST = (_host_raw or '127.0.0.1').strip() or '127.0.0.1'
# Allow /api/encryption-key and /api/anonymized-data from non-loopback clients (shared LAN risk).
SENSITIVE_APIS_ON_LAN = os.getenv('HEALTH_APP_SENSITIVE_APIS_ON_LAN', '').lower() in ('1', 'true', 'yes')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://YOUR_PROJECT_REF.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

# Connection state
active_connections = defaultdict(set)
connection_lock = threading.Lock()
last_activity = defaultdict(float)
CONNECTION_TIMEOUT = 300
CLEANUP_INTERVAL = 60
MAX_CONNECTIONS_PER_IP = 50

# SSE
sse_clients = []
sse_lock = threading.Lock()
file_change_event = threading.Event()
last_file_change_time = None

# Server instance (set by main)
server_instance = None
server_thread = None
server_lock = threading.Lock()
