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
ENV_FILE = _PROJECT_ROOT / '.env'
LOG_DIR = _PROJECT_ROOT / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# Optional imports
try:
    from dotenv import load_dotenv
    if ENV_FILE.exists():
        load_dotenv(ENV_FILE)
except ImportError:
    pass

# Logging
from datetime import datetime
LOG_FILE = LOG_DIR / f"health_app_{datetime.now().strftime('%Y%m%d')}.log"
logger = logging.getLogger('HealthApp')
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    fh = logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a', delay=False)
    fh.setLevel(logging.DEBUG)
    if hasattr(fh.stream, 'reconfigure'):
        fh.stream.reconfigure(line_buffering=True)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    fmt = logging.Formatter('%(asctime)s | %(levelname)-8s | %(name)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    fh.setFormatter(fmt)
    ch.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(ch)
file_handler = logger.handlers[0] if logger.handlers else None

# Env
PORT = int(os.getenv('PORT', '8080'))
HOST = os.getenv('HOST', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://gitnxgfbbpykwqvogmqq.supabase.co')
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
