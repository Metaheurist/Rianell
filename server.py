#!/usr/bin/env python3
"""
Simple HTTP Server for Health App
Serves the Health Dashboard application on http://localhost:8080
Also accessible over LAN using your computer's local IP address
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import socket
import logging
import json
import threading
import time
import random
import csv
from collections import defaultdict
from pathlib import Path
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs, unquote
import re
import subprocess

# ============================================
# Local Package Installation
# ============================================

# Add local lib directory to Python path for bundled packages (if needed)
APP_DIR = Path(__file__).parent.absolute()
LOCAL_LIB_DIR = APP_DIR / 'lib'

# Note: Local lib installation is disabled by default to avoid permission issues
# Users should install packages using: pip install -r requirements.txt

# Try to import required packages from the current Python environment
def check_requirements():
    """Check if all required packages are installed in the current Python environment"""
    missing_packages = []
    
    # Try importing key packages
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
    """Install requirements.txt to local lib directory - DISABLED due to permission issues"""
    # Local lib installation is disabled by default to avoid permission issues
    # Users should install packages using: pip install -r requirements.txt
    logger.debug("Local lib installation disabled - using system-wide installation instead")
    return False

def install_requirements():
    """Install requirements.txt - tries local first, falls back to system"""
    # Try local installation first
    if install_requirements_local():
        return True
    
    # Fallback to system installation
    logger.info("Local installation failed, trying system-wide installation...")
    try:
        requirements_file = APP_DIR / 'requirements.txt'
        if not requirements_file.exists():
            logger.warning(f"requirements.txt not found at {requirements_file}")
            return False
        
        python_exe = sys.executable
        logger.info(f"Installing requirements system-wide using: {python_exe}")
        
        result = subprocess.run(
            [python_exe, '-m', 'pip', 'install', '-r', str(requirements_file)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print("Requirements installed successfully (system-wide)")
            return True
        else:
            print(f"Failed to install requirements. Return code: {result.returncode}")
            if result.stderr:
                print(f"Error output: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error installing requirements: {e}")
        return False

# Setup logging BEFORE checking for Supabase (needed for early initialization messages)
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / f"health_app_{datetime.now().strftime('%Y%m%d')}.log"

# Configure logger
logger = logging.getLogger('HealthApp')
logger.setLevel(logging.DEBUG)

# File handler for persistent logging (unbuffered for immediate writes)
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a', delay=False)
file_handler.setLevel(logging.DEBUG)
if hasattr(file_handler.stream, 'reconfigure'):
    file_handler.stream.reconfigure(line_buffering=True)

# Console handler for immediate feedback
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Formatter with detailed information
formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Function to check Supabase availability (tries system/venv first, then local lib)
def check_supabase_availability():
    """Check if Supabase is available, trying system/venv first, then local lib"""
    # First try system/venv (most common case, especially with virtual environments)
    try:
        from supabase import create_client, Client
        logger.debug("Supabase found in system/venv Python")
        return True
    except ImportError as e:
        logger.debug(f"Supabase not found in system/venv: {e}")
    except Exception as e:
        logger.debug(f"Error importing supabase from system/venv: {e}")
    
    # Then try local lib (for bundled installations)
    if LOCAL_LIB_DIR.exists():
        try:
            # Temporarily add to path if not already there
            if str(LOCAL_LIB_DIR) not in sys.path:
                sys.path.insert(0, str(LOCAL_LIB_DIR))
            from supabase import create_client, Client
            logger.debug("Supabase found in local lib directory")
            return True
        except (ImportError, ModuleNotFoundError) as e:
            logger.debug(f"Supabase not found in local lib: {e}")
        except Exception as e:
            logger.debug(f"Error importing supabase from local lib: {e}")
    
    return False

# Try to import Supabase client
SUPABASE_AVAILABLE = check_supabase_availability()
if not SUPABASE_AVAILABLE:
    print("Warning: supabase library not installed. Supabase features will be disabled.")
    print("Install with: pip install supabase")

# Try to import tkinter for dashboard
try:
    import tkinter as tk
    from tkinter import ttk, scrolledtext, messagebox
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False
    print("Warning: tkinter not available. Dashboard will be disabled.")
    print("On Linux, install with: sudo apt-get install python3-tk")

# Try to import watchdog for file watching
try:
    from watchdog.observers import Observer  # type: ignore
    from watchdog.events import FileSystemEventHandler  # type: ignore
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("Warning: watchdog library not installed. File watching disabled.")
    print("Install with: pip install watchdog")

# Try to import python-dotenv for environment variables
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False
    print("Warning: python-dotenv not installed. Using default configuration.")
    print("Install with: pip install python-dotenv")

# Try to import cryptography for encryption
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.backends import default_backend
    import base64
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False
    print("Warning: cryptography library not installed. Encryption features will be disabled.")
    print("Install with: pip install cryptography")

# Load environment variables from .env file
if DOTENV_AVAILABLE:
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"Loaded environment variables from {env_path}")
    else:
        logger.warning(f".env file not found at {env_path}. Using default configuration.")
else:
    logger.warning("python-dotenv not available. Install with: pip install python-dotenv")

# Configuration - Load from environment variables or use defaults
PORT = int(os.getenv('PORT', '8080'))
HOST = os.getenv('HOST', '')  # Empty string means bind to all interfaces (0.0.0.0), accessible over LAN

# Supabase Configuration - Load from environment variables
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://gitnxgfbbpykwqvogmqq.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'sb_publishable_K_1etT5oKxV5g5dOF2KjOQ_dhLnJuyo')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')  # Optional: postgres connection string for direct SQL execution
supabase_client = None

logger.info("=" * 60)
logger.info("Health App Server - Logging Initialized")
logger.info(f"Log file: {LOG_FILE}")
logger.info("Note: Client-side logs are only sent when demo mode is enabled")
logger.info("=" * 60)

# Connection tracking for multiple concurrent connections
active_connections = defaultdict(set)  # IP -> set of connection threads
connection_lock = threading.Lock()
last_activity = defaultdict(float)  # IP -> last activity timestamp
CONNECTION_TIMEOUT = 300  # 5 minutes of inactivity before cleanup
CLEANUP_INTERVAL = 60  # Run cleanup every 60 seconds
MAX_CONNECTIONS_PER_IP = 50  # Maximum concurrent connections per IP

# SSE (Server-Sent Events) clients for auto-refresh
sse_clients = []  # List of (client_ip, response_writer) tuples
sse_lock = threading.Lock()
file_change_event = threading.Event()
last_file_change_time = None

# Global server instance for restart functionality
server_instance = None
server_thread = None
server_lock = threading.Lock()

# ============================================
# Supabase Functions
# ============================================

# ============================================
# Encryption/Decryption Functions
# ============================================

# Cache encryption key warning to avoid spam
_encryption_key_warning_shown = False

def get_encryption_key():
    """Get encryption key from file, environment variable, or use default"""
    global _encryption_key_warning_shown
    key = None
    
    # Try to read from encryption key file first
    key_file_paths = [
        Path(__file__).parent / '.encryption_key',
        Path(__file__).parent / 'encryption.key'
    ]
    
    for key_file_path in key_file_paths:
        if key_file_path.exists():
            try:
                with open(key_file_path, 'r', encoding='utf-8') as f:
                    key = f.read().strip()
                if key:
                    if not _encryption_key_warning_shown:
                        logger.info(f"Loaded encryption key from {key_file_path.name}")
                    break
            except Exception as e:
                if not _encryption_key_warning_shown:
                    logger.warning(f"Error reading encryption key file {key_file_path}: {e}")
    
    # Fallback to environment variable
    if not key:
        key = os.getenv('ENCRYPTION_KEY')
        if key:
            if not _encryption_key_warning_shown:
                logger.info("Loaded encryption key from environment variable")
    
    # Final fallback to default (not recommended for production)
    if not key:
        # More secure default key (still not recommended for production - use .encryption_key file)
        key = 'K8mN2pQ5rT9vW3xZ6bC1dF4gH7jL0nM5qR8sU2wY5aB8eG1hI4jK7lM0oP3qR6tU9vW2xZ5'
        if not _encryption_key_warning_shown:
            logger.warning("Using default encryption key. For production, create .encryption_key file with a secure key.")
            _encryption_key_warning_shown = True
    
    # Ensure key is exactly 32 bytes for AES-256
    key_bytes = key.encode('utf-8')[:32].ljust(32, b'0')
    return key_bytes

def encrypt_anonymized_data(data):
    """Encrypt anonymized log data using AES-GCM"""
    if not CRYPTOGRAPHY_AVAILABLE:
        # Fallback: return as JSON string (no encryption)
        return json.dumps(data)
    
    try:
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        
        # Convert data to JSON string
        json_string = json.dumps(data)
        plaintext = json_string.encode('utf-8')
        
        # Generate random nonce (12 bytes for GCM)
        import secrets
        nonce = secrets.token_bytes(12)
        
        # Encrypt
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        
        # Combine nonce + ciphertext and encode as base64
        combined = nonce + ciphertext
        return base64.b64encode(combined).decode('utf-8')
    except Exception as e:
        logger.error(f"Encryption error: {e}", exc_info=True)
        # Fallback: return as JSON string
        return json.dumps(data)

def decrypt_anonymized_data(encrypted_data):
    """Decrypt anonymized log data using AES-GCM"""
    if not CRYPTOGRAPHY_AVAILABLE:
        # Try to parse as JSON (backward compatibility)
        try:
            return json.loads(encrypted_data)
        except:
            return None
    
    try:
        # Check if data is already JSON (backward compatibility with unencrypted data)
        if isinstance(encrypted_data, dict):
            return encrypted_data
        if isinstance(encrypted_data, str):
            # Try parsing as JSON first
            try:
                parsed = json.loads(encrypted_data)
                if isinstance(parsed, dict):
                    return parsed  # Already decrypted/unencrypted
            except:
                pass
            
            # Decode from base64
            try:
                combined = base64.b64decode(encrypted_data)
            except:
                # Not base64, try JSON again
                try:
                    return json.loads(encrypted_data)
                except:
                    return None
            
            key = get_encryption_key()
            aesgcm = AESGCM(key)
            
            # Extract nonce (first 12 bytes) and ciphertext
            nonce = combined[:12]
            ciphertext = combined[12:]
            
            # Decrypt
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            # Convert back to JSON object
            json_string = plaintext.decode('utf-8')
            return json.loads(json_string)
    except Exception as e:
        logger.warning(f"Decryption error (trying JSON fallback): {e}")
        # Fallback: try to parse as JSON
        try:
            return json.loads(encrypted_data)
        except:
            return None

def init_supabase_client():
    """Initialize Supabase client"""
    global supabase_client
    
    # Try to import supabase (works even if SUPABASE_AVAILABLE was False at startup)
    global SUPABASE_AVAILABLE
    try:
        # First ensure the system supabase is available
        from supabase import create_client, Client
        SUPABASE_AVAILABLE = True
        logger.debug("Supabase library imported successfully from system Python")
    except ImportError as e:
        logger.warning(f"Could not import supabase from system Python: {e}")
        # Try local lib as fallback
        if LOCAL_LIB_DIR.exists() and str(LOCAL_LIB_DIR) not in sys.path:
            sys.path.insert(0, str(LOCAL_LIB_DIR))
            try:
                from supabase import create_client, Client
                SUPABASE_AVAILABLE = True
                logger.info("Supabase library imported from local lib directory")
            except ImportError:
                logger.error("Supabase library not found in system Python or local lib")
                return None
        else:
            logger.error("Supabase library not available and local lib not configured")
            return None
    except Exception as e:
        logger.error(f"Unexpected error importing supabase: {e}", exc_info=True)
        return None
    
    if supabase_client is None:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        logger.info("Supabase client initialized successfully")
    return supabase_client


def run_sql(sql):
    """Execute arbitrary SQL safely.

    Preference order:
    1. If `DATABASE_URL` is set and `psycopg2`/`psycopg` is available, connect directly to Postgres and execute.
    2. Otherwise, if `SUPABASE_SERVICE_KEY` is present, caller may create an RPC function in the DB
       (e.g. a pg function `exec_sql(text)`) and then call it via PostgREST `/rpc/exec_sql` with
       the service key. This code includes a helper to attempt direct RPC but the RPC must
       exist server-side and be security-reviewed.

    Returns query rows for SELECT, or {'status': 'ok'} for non-SELECT, or raises Exception.
    """
    # Try direct DB connection via DATABASE_URL
    if DATABASE_URL:
        try:
            try:
                import psycopg  # type: ignore[import-untyped]
                conn = psycopg.connect(DATABASE_URL)
                cur = conn.cursor()
            except Exception:
                import psycopg2  # type: ignore[import-untyped]
                conn = psycopg2.connect(DATABASE_URL)
                cur = conn.cursor()

            cur.execute(sql)
            if cur.description:
                rows = cur.fetchall()
            else:
                rows = None
            conn.commit()
            cur.close()
            conn.close()
            return rows if rows is not None else {'status': 'ok'}
        except Exception as e:
            logger.error(f"Direct SQL execution failed: {e}")
            raise

    # Fallback: attempt RPC call using SUPABASE_SERVICE_KEY (requires server-side RPC function)
    if SUPABASE_SERVICE_KEY:
        try:
            import requests
            rpc_url = SUPABASE_URL.rstrip('/') + '/rpc/exec_sql'
            headers = {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json'
            }
            payload = {'q': sql}
            resp = requests.post(rpc_url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"RPC SQL execution failed: {e}")
            raise

    raise RuntimeError('No method available to execute SQL. Set DATABASE_URL or SUPABASE_SERVICE_KEY and create a DB RPC.')

def search_supabase_data(condition=None, limit=100):
    """Search anonymized_data in Supabase"""
    client = init_supabase_client()
    if not client:
        return None
    
    try:
        query = client.table('anonymized_data').select('*')
        
        if condition:
            query = query.eq('medical_condition', condition)
        
        query = query.limit(limit).order('created_at', desc=True)
        
        response = query.execute()
        data = response.data
        
        # Decrypt anonymized_logs data if encrypted
        if data:
            for record in data:
                encrypted_log = record.get('anonymized_logs') or record.get('anonymized_log')
                if encrypted_log and isinstance(encrypted_log, str):
                    try:
                        decrypted_log = decrypt_anonymized_data(encrypted_log)
                        if decrypted_log:
                            # Store in both field names for compatibility
                            record['anonymized_logs'] = decrypted_log
                            record['anonymized_log'] = decrypted_log
                        else:
                            logger.debug(f"Decryption returned None for record {record.get('id')}")
                    except Exception as e:
                        logger.warning(f"Error decrypting record {record.get('id')}: {e}")
        
        return data
    except Exception as e:
        logger.error(f"Error searching Supabase: {e}", exc_info=True)
        return None


def export_supabase_data(output_path=None, condition=None):
    """Export Supabase data to CSV"""
    if output_path is None:
        script_dir = Path(__file__).parent.absolute()
        output_path = script_dir / f'supabase_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    data = search_supabase_data(condition=condition, limit=10000)
    if not data:
        return None
    
    try:
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            if not data:
                return None
            
            # Get headers from first record
            headers = ['id', 'medical_condition', 'created_at', 'updated_at']
            log_headers = []
            if data and len(data) > 0:
                first_log = data[0].get('anonymized_logs') or data[0].get('anonymized_log', {})
                if isinstance(first_log, dict):
                    log_headers = list(first_log.keys())
            
            all_headers = headers + log_headers
            
            writer = csv.DictWriter(csvfile, fieldnames=all_headers)
            writer.writeheader()
            
            for record in data:
                row = {
                    'id': record.get('id', ''),
                    'medical_condition': record.get('medical_condition', ''),
                    'created_at': record.get('created_at', ''),
                    'updated_at': record.get('updated_at', '')
                }
                
                # Add anonymized_logs fields (decrypt if needed)
                encrypted_log = record.get('anonymized_logs') or record.get('anonymized_log')
                log_data = decrypt_anonymized_data(encrypted_log) if encrypted_log else {}
                if isinstance(log_data, dict):
                    for key in log_headers:
                        value = log_data.get(key, '')
                        if isinstance(value, (list, dict)):
                            value = json.dumps(value)
                        row[key] = value
                
                writer.writerow(row)
        
        logger.info(f"Exported {len(data)} records to {output_path}")
        return str(output_path)
    except Exception as e:
        logger.error(f"Error exporting Supabase data: {e}", exc_info=True)
        return None

def generate_and_post_sample_data_to_supabase(num_days=90, medical_condition="Medical Condition", base_weight=75.0):
    """
    Generate randomized anonymized health data and post to Supabase.
    Returns number of records posted.
    """
    global SUPABASE_AVAILABLE
    SUPABASE_AVAILABLE = check_supabase_availability()
    if not SUPABASE_AVAILABLE:
        logger.error("Cannot post sample data: Supabase library not available")
        return 0
    
    client = init_supabase_client()
    if not client:
        logger.error("Cannot post sample data: Supabase client not initialized")
        return 0
    
    try:
        # Generate dates
        today = datetime.now()
        end_date = today - timedelta(days=1)
        start_date = end_date - timedelta(days=num_days - 1)
        
        # Food and exercise templates
        healthy_foods = [
            {'name': 'Grilled chicken, 200g', 'calories': 330, 'protein': 62},
            {'name': 'Brown rice, 150g', 'calories': 165, 'protein': 3.5},
            {'name': 'Steamed vegetables', 'calories': 50, 'protein': 2},
            {'name': 'Salmon fillet, 180g', 'calories': 360, 'protein': 50},
        ]
        exercise_templates = [
            'Walking, 30 minutes', 'Yoga, 20 minutes', 'Swimming, 25 minutes',
            'Cycling, 40 minutes', 'Stretching, 15 minutes'
        ]
        
        # Pre-generate random numbers in batches for better performance
        random_batch_size = 1000
        random_batch = [random.random() for _ in range(random_batch_size)]
        random_index = 0
        
        def get_random():
            nonlocal random_index, random_batch
            if random_index >= len(random_batch):
                random_batch = [random.random() for _ in range(random_batch_size)]
                random_index = 0
            result = random_batch[random_index]
            random_index += 1
            return result
        
        # State tracking
        current_weight = base_weight
        flare_state = False
        flare_duration = 0
        recovery_phase = 0
        baseline_health = 6.0
        
        posted_count = 0
        batch_size_db = 100  # Post in batches for better performance
        batch_data = []
        
        for day in range(num_days):
            date = start_date + timedelta(days=day)
            date_str = date.strftime('%Y-%m-%d')
            month = date.month - 1
            day_of_week = date.weekday()
            
            seasonal_factor = get_seasonal_factor(month)
            weekly_pattern = get_weekly_pattern(day_of_week)
            years_progress = day / 365.25
            baseline_health = min(7.5, 6.0 + (years_progress / 10) * 1.5)
            
            # Flare pattern (using optimized random)
            flare_chance = 0.12 + (seasonal_factor * 0.1)
            if flare_duration > 0:
                flare_duration -= 1
                if flare_duration == 0:
                    flare_state = False
                    recovery_phase = 1
            elif get_random() < flare_chance:
                flare_state = True
                flare_duration = random.randint(2, 5)
            else:
                recovery_phase += 1
            
            recovery_boost = min(0.3, recovery_phase * 0.05) if recovery_phase > 0 and recovery_phase < 7 else 0
            
            # Generate metrics (using optimized random - batch get multiple at once)
            r_vals = [get_random() for _ in range(10)]
            
            if flare_state:
                fatigue = max(1, min(10, round(baseline_health - 3 + (r_vals[0] * 3))))
                stiffness = max(1, min(10, round(baseline_health - 2.5 + (r_vals[1] * 3))))
                back_pain = max(1, min(10, round(baseline_health - 2 + (r_vals[2] * 3))))
                sleep = max(1, min(10, round(baseline_health - 4 + (r_vals[3] * 2))))
                mood = max(1, min(10, round(baseline_health - 3.5 + (r_vals[4] * 2))))
            else:
                sleep = max(1, min(10, round(baseline_health + (r_vals[0] * 2) + seasonal_factor + weekly_pattern + recovery_boost)))
                fatigue = max(1, min(10, round(baseline_health - (sleep - 5) * 0.8 + (r_vals[1] * 1.5))))
                stiffness = max(1, min(10, round(baseline_health - 2 - (seasonal_factor * 2) + (r_vals[2] * 1.5))))
                back_pain = max(1, min(10, round(stiffness + (r_vals[3] * 1) - 0.5)))
                mood = max(1, min(10, round(baseline_health + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (r_vals[4] * 1))))
            
            # Weight
            has_exercise = get_random() < 0.4
            current_weight += -0.02 if has_exercise else 0.01
            current_weight = max(70, min(80, current_weight))
            weight = round(current_weight, 1)
            
            # Food and exercise
            food_items = []
            exercise_items = []
            
            if get_random() < 0.65:
                num_food = random.randint(1, 3)
                for _ in range(num_food):
                    template = random.choice(healthy_foods)
                    food_items.append({
                        'name': template['name'],
                        'calories': round(template['calories'] * (1 + (get_random() - 0.5) * 0.15)),
                        'protein': round(template['protein'] * (1 + (get_random() - 0.5) * 0.15), 1)
                    })
            
            if get_random() < (0.15 if flare_state else 0.6):
                exercise_items = random.sample(exercise_templates, min(1 if flare_state else random.randint(1, 2), len(exercise_templates)))
            
            # Create anonymized_log JSON (using optimized random)
            r_extra = [get_random() for _ in range(5)]
            anonymized_log = {
                'date': date_str,
                'bpm': int(65 + (fatigue - 5) * 2 + (r_extra[0] * 8)),
                'weight': weight,
                'fatigue': fatigue,
                'stiffness': stiffness,
                'backPain': back_pain,
                'sleep': sleep,
                'jointPain': max(1, min(10, round(stiffness * 0.7 + (r_extra[1] * 1.2)))),
                'mobility': max(1, min(10, round(baseline_health + 1 - (stiffness - 5) * 0.5 + (r_extra[2] * 1)))),
                'dailyFunction': max(1, min(10, round(baseline_health + 0.5 + (r_extra[3] * 1)))),
                'swelling': max(1, min(10, round(baseline_health - 1 + (r_extra[4] * 1.5)))),
                'flare': 'Yes' if flare_state else 'No',
                'mood': mood,
                'irritability': max(1, min(10, round(baseline_health - 2 - (mood - 5) * 0.5 + (get_random() * 1.5)))),
                'weatherSensitivity': max(1, min(10, round(5 + (stiffness - 5) * 0.5))),
                'steps': max(1000, min(15000, round(6000 + (get_random() * 2000 - 1000)))),
                'hydration': round(6 + (get_random() * 2 - 1), 1),
                'food': food_items,
                'exercise': exercise_items
            }
            
            # Add to batch
            # Encrypt anonymized_log before adding to batch
            encrypted_log = encrypt_anonymized_data(anonymized_log)
            
            batch_data.append({
                'medical_condition': medical_condition,
                'anonymized_logs': encrypted_log
            })
            
            # Post batch when it reaches batch_size or at the end
            if len(batch_data) >= batch_size_db or day == num_days - 1:
                try:
                    response = client.table('anonymized_data').insert(batch_data).execute()
                    posted_count += len(batch_data)
                    logger.info(f"Posted batch: {posted_count}/{num_days} records to Supabase...")
                    batch_data = []  # Clear batch
                except Exception as e:
                    logger.error(f"Error posting batch to Supabase: {e}")
                    # Try individual inserts if batch fails
                    for record in batch_data:
                        try:
                            client.table('anonymized_data').insert(record).execute()
                            posted_count += 1
                        except Exception as e2:
                            logger.error(f"Error posting individual record: {e2}")
                    batch_data = []
        
        logger.info(f"Generated and posted {posted_count} sample records for {medical_condition} to Supabase")
        return posted_count
        
    except Exception as e:
        logger.error(f"Error generating and posting sample data: {e}", exc_info=True)
        return 0


# ============================================
# Sample Data Generation Functions
# ============================================

def get_seasonal_factor(month):
    """Calculate seasonal factor (winter worse, summer better)."""
    if month == 11 or month == 0 or month == 1:  # Dec, Jan, Feb
        return -0.3
    if 2 <= month <= 4:  # Mar, Apr, May
        return 0
    if 5 <= month <= 7:  # Jun, Jul, Aug
        return 0.2
    return 0  # Sep, Oct, Nov

def get_weekly_pattern(day_of_week):
    """Calculate day of week pattern (weekends better)."""
    if day_of_week == 6 or day_of_week == 5:  # Weekend boost
        return 0.15
    return -0.1  # Weekday stress


def generate_sample_csv_data(num_days=90, base_weight=75.0, output_path=None):
    """
    Generate randomized health data and save to CSV file (optimized for performance).
    Returns the path to the generated CSV file.
    Outputs to the same directory as server.py by default.
    """
    if output_path is None:
        script_dir = Path(__file__).parent.absolute()
        output_path = script_dir / f'health_data_sample_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    try:
        # Pre-calculate dates for better performance
        today = datetime.now()
        end_date = today - timedelta(days=1)
        start_date = end_date - timedelta(days=num_days - 1)
        
        # Pre-generate random numbers in batches for better performance
        batch_size = 1000
        random_batch = [random.random() for _ in range(batch_size)]
        random_index = 0
        
        def get_random():
            nonlocal random_index, random_batch
            if random_index >= len(random_batch):
                random_batch = [random.random() for _ in range(batch_size)]
                random_index = 0
            result = random_batch[random_index]
            random_index += 1
            return result
        
        # Food and exercise templates
        healthy_foods = [
            {'name': 'Grilled chicken, 200g', 'calories': 330, 'protein': 62},
            {'name': 'Brown rice, 150g', 'calories': 165, 'protein': 3.5},
            {'name': 'Steamed vegetables', 'calories': 50, 'protein': 2},
            {'name': 'Salmon fillet, 180g', 'calories': 360, 'protein': 50},
            {'name': 'Quinoa salad', 'calories': 220, 'protein': 8},
            {'name': 'Greek yogurt, 150g', 'calories': 130, 'protein': 11},
            {'name': 'Oatmeal with berries', 'calories': 200, 'protein': 5},
            {'name': 'Mixed nuts, 30g', 'calories': 180, 'protein': 5},
            {'name': 'Eggs, 2 large', 'calories': 140, 'protein': 12},
            {'name': 'Grilled fish, 200g', 'calories': 280, 'protein': 45}
        ]
        comfort_foods = [
            {'name': 'Pizza slice', 'calories': 280, 'protein': 12},
            {'name': 'Pasta, 200g', 'calories': 250, 'protein': 8},
            {'name': 'Bread, 2 slices', 'calories': 160, 'protein': 6},
            {'name': 'Chocolate bar', 'calories': 220, 'protein': 3}
        ]
        exercise_templates = [
            'Walking, 30 minutes', 'Yoga, 20 minutes', 'Swimming, 25 minutes',
            'Cycling, 40 minutes', 'Stretching, 15 minutes', 'Light jogging, 20 minutes',
            'Pilates, 30 minutes', 'Tai Chi, 25 minutes', 'Water aerobics, 30 minutes',
            'Physical therapy exercises, 20 minutes', 'Gentle strength training, 15 minutes',
            'Balance exercises, 10 minutes'
        ]
        
        # State tracking
        current_weight = base_weight
        flare_state = False
        flare_duration = 0
        recovery_phase = 0
        baseline_health = 6.0
        
        entries = []
        
        for day in range(num_days):
            date = start_date + timedelta(days=day)
            date_str = date.strftime('%Y-%m-%d')
            month = date.month - 1
            day_of_week = date.weekday()
            
            seasonal_factor = get_seasonal_factor(month)
            weekly_pattern = get_weekly_pattern(day_of_week)
            years_progress = day / 365.25
            baseline_health = min(7.5, 6.0 + (years_progress / 10) * 1.5)
            
            # Flare pattern (using optimized random)
            flare_chance = 0.12 + (seasonal_factor * 0.1)
            if flare_duration > 0:
                flare_duration -= 1
                if flare_duration == 0:
                    flare_state = False
                    recovery_phase = 1
            elif get_random() < flare_chance:
                flare_state = True
                flare_duration = random.randint(2, 5)
            else:
                recovery_phase += 1
            
            recovery_boost = min(0.3, recovery_phase * 0.05) if recovery_phase > 0 and recovery_phase < 7 else 0
            
            # Generate metrics (using optimized random)
            r1, r2, r3, r4, r5, r6, r7, r8, r9, r10 = [get_random() for _ in range(10)]
            
            if flare_state:
                fatigue = max(1, min(10, round(baseline_health - 3 + (r1 * 3))))
                stiffness = max(1, min(10, round(baseline_health - 2.5 + (r2 * 3))))
                back_pain = max(1, min(10, round(baseline_health - 2 + (r3 * 3))))
                joint_pain = max(1, min(10, round(baseline_health - 2.5 + (r4 * 2.5))))
                sleep = max(1, min(10, round(baseline_health - 4 + (r5 * 2))))
                mobility = max(1, min(10, round(baseline_health - 4 + (r6 * 2))))
                daily_function = max(1, min(10, round(baseline_health - 3.5 + (r7 * 2.5))))
                swelling = max(1, min(10, round(baseline_health - 3 + (r8 * 2.5))))
                mood = max(1, min(10, round(baseline_health - 3.5 + (r9 * 2))))
                irritability = max(1, min(10, round(baseline_health - 2 + (r10 * 3))))
                bpm = int(70 + (get_random() * 15))
            else:
                sleep = max(1, min(10, round(baseline_health + (r1 * 2) + seasonal_factor + weekly_pattern + recovery_boost)))
                fatigue = max(1, min(10, round(baseline_health - (sleep - 5) * 0.8 + (r2 * 1.5))))
                stiffness = max(1, min(10, round(baseline_health - 2 - (seasonal_factor * 2) + (r3 * 1.5) + recovery_boost)))
                back_pain = max(1, min(10, round(stiffness + (r4 * 1) - 0.5)))
                joint_pain = max(1, min(10, round(stiffness * 0.7 + (r5 * 1.2))))
                mobility = max(1, min(10, round(baseline_health + 1 - (stiffness - 5) * 0.5 - (fatigue - 5) * 0.3 + (r6 * 1) + recovery_boost)))
                daily_function = max(1, min(10, round(mobility * 0.9 + (r7 * 1))))
                swelling = max(1, min(10, round(joint_pain * 0.6 + (r8 * 1))))
                mood = max(1, min(10, round(baseline_health + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (r9 * 1) + weekly_pattern + recovery_boost)))
                irritability = max(1, min(10, round(baseline_health - 2 - (mood - 5) * 0.5 - (sleep - 5) * 0.3 + (r10 * 1.5))))
                bpm = int(65 + (fatigue - 5) * 2 + (get_random() * 8) + (seasonal_factor * 3))
            
            # Weight
            has_exercise = get_random() < 0.4
            current_weight += -0.02 if has_exercise else 0.01
            current_weight = max(70, min(80, current_weight))
            weight = round(current_weight, 1)
            
            # Food and exercise
            food_items = []
            exercise_items = []
            
            exercise_chance = 0.15 if flare_state else (0.6 if mood > 6 else 0.3)
            if get_random() < exercise_chance:
                num_exercise = 1 if flare_state else random.randint(1, 2)
                exercise_items = random.sample(exercise_templates, min(num_exercise, len(exercise_templates)))
            
            if get_random() < 0.65:
                num_food = random.randint(1, 3)
                food_pool = healthy_foods if (mood > 6 and not flare_state) else (healthy_foods + comfort_foods if flare_state else healthy_foods)
                for _ in range(num_food):
                    template = random.choice(food_pool)
                    food_items.append({
                        'name': template['name'],
                        'calories': round(template['calories'] * (1 + (get_random() - 0.5) * 0.15)),
                        'protein': round(template['protein'] * (1 + (get_random() - 0.5) * 0.15), 1)
                    })
            
            # Additional fields (using optimized random)
            weather_sensitivity = max(1, min(10, round(5 + (stiffness - 5) * 0.5 - seasonal_factor * 2)))
            steps = max(1000, min(15000, round(6000 + (mobility - 5) * 800 + (mood - 5) * 500 - (fatigue - 5) * 400 + (get_random() * 2000 - 1000))))
            hydration = round(6 + (1 if exercise_items else 0) + (get_random() * 2 - 1), 1)
            
            # Energy/Clarity
            energy_clarity_options = ["High Energy", "Moderate Energy", "Low Energy", "Mental Clarity", "Brain Fog", "Good Concentration", "Poor Concentration", "Mental Fatigue", "Focused", "Distracted"]
            energy_clarity = ""
            r_energy = get_random()
            if sleep >= 7 and mood >= 7:
                energy_clarity = random.choice(["High Energy", "Mental Clarity", "Good Concentration"]) if r_energy < 0.7 else random.choice(energy_clarity_options)
            elif sleep < 5 or mood < 5:
                energy_clarity = random.choice(["Low Energy", "Brain Fog", "Mental Fatigue"]) if r_energy < 0.6 else random.choice(energy_clarity_options)
            else:
                energy_clarity = random.choice(energy_clarity_options) if r_energy < 0.4 else ""
            
            # Notes
            notes = ""
            if get_random() < 0.12:
                if flare_state:
                    notes = "Flare-up day - increased symptoms"
                elif recovery_phase > 0 and recovery_phase < 3:
                    notes = "Recovering from flare - feeling better"
                elif seasonal_factor < -0.2:
                    notes = "Winter symptoms - more stiffness"
                elif sleep < 5:
                    notes = "Poor sleep last night"
                else:
                    notes_options = [
                        "Feeling better today", "Morning stiffness was manageable",
                        "Had a good night's sleep", "Some joint pain in the morning",
                        "Feeling tired", "Good day overall", "Minor flare symptoms",
                        "Exercised today, feeling good"
                    ]
                    notes = random.choice(notes_options)
            
            # Format food and exercise as JSON strings
            food_json = json.dumps(food_items) if food_items else ""
            exercise_json = json.dumps(exercise_items) if exercise_items else ""
            
            entry = {
                'Date': date_str,
                'BPM': str(bpm),
                'Weight': str(weight),
                'Fatigue': str(fatigue),
                'Stiffness': str(stiffness),
                'Back Pain': str(back_pain),
                'Sleep': str(sleep),
                'Joint Pain': str(joint_pain),
                'Mobility': str(mobility),
                'Daily Function': str(daily_function),
                'Swelling': str(swelling),
                'Flare': 'Yes' if flare_state else 'No',
                'Mood': str(mood),
                'Irritability': str(irritability),
                'Weather Sensitivity': str(weather_sensitivity),
                'Steps': str(steps),
                'Hydration': str(hydration),
                'Energy Clarity': energy_clarity,
                'Stressors': '',
                'Symptoms': '',
                'Pain Location': '',
                'Food': food_json,
                'Exercise': exercise_json,
                'Notes': notes
            }
            
            entries.append(entry)
        
        # Write CSV file
        headers = [
            'Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain',
            'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling',
            'Flare', 'Mood', 'Irritability', 'Weather Sensitivity', 'Steps', 'Hydration',
            'Energy Clarity', 'Stressors', 'Symptoms', 'Pain Location', 'Food', 'Exercise', 'Notes'
        ]
        
        def escape_csv_value(value):
            if value is None or value == '':
                return ''
            value_str = str(value)
            if ',' in value_str or '"' in value_str or '\n' in value_str:
                return '"' + value_str.replace('"', '""') + '"'
            return value_str
        
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            csvfile.write(','.join(headers) + '\n')
            for entry in entries:
                row = [escape_csv_value(entry.get(h, '')) for h in headers]
                csvfile.write(','.join(row) + '\n')
        
        logger.info(f"Generated {len(entries)} entries and saved to '{output_path}'")
        return str(output_path)
        
    except Exception as e:
        logger.error(f"Error generating CSV data: {e}", exc_info=True)
        return None

class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Threaded HTTP server that handles multiple concurrent connections"""
    daemon_threads = True
    allow_reuse_address = True
    timeout = 30  # Socket timeout in seconds
    
    def server_bind(self):
        """Override to set socket options for better connection handling"""
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        # Set TCP keepalive options (Linux/Unix)
        if hasattr(socket, 'TCP_KEEPIDLE'):
            self.socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 30)
        if hasattr(socket, 'TCP_KEEPINTVL'):
            self.socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)
        if hasattr(socket, 'TCP_KEEPCNT'):
            self.socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
        super().server_bind()

class HealthAppHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to set proper MIME types and handle SPA routing"""
    
    timeout = 30  # Request timeout
    
    def __init__(self, *args, **kwargs):
        self.connection_start_time = time.time()
        self.client_ip = None
        super().__init__(*args, **kwargs)
    
    def handle(self):
        """Override handle to track connections"""
        self.client_ip = self.client_address[0]
        thread_id = threading.current_thread().ident
        
        # Check connection limit per IP
        with connection_lock:
            ip_connections = active_connections.get(self.client_ip, set())
            if len(ip_connections) >= MAX_CONNECTIONS_PER_IP:
                logger.warning(f"Connection limit reached for IP {self.client_ip} ({len(ip_connections)} connections)")
                self.send_error(503, "Too many connections from this IP")
                return
            
            # Track this connection
            active_connections[self.client_ip].add(thread_id)
            last_activity[self.client_ip] = time.time()
            logger.debug(f"Connection opened: IP {self.client_ip}, Thread {thread_id}, Total connections for IP: {len(active_connections[self.client_ip])}")
        
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, OSError) as e:
            # These are normal when clients disconnect (page reload, tab close, etc.)
            # Only log at debug level to reduce noise
            logger.debug(f"Client disconnected: IP {self.client_ip}, Thread {thread_id}, Error: {type(e).__name__}")
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Unexpected error handling request: IP {self.client_ip}, Thread {thread_id}, Error: {e}", exc_info=True)
        finally:
            # Remove connection tracking
            with connection_lock:
                if self.client_ip in active_connections:
                    active_connections[self.client_ip].discard(thread_id)
                    if not active_connections[self.client_ip]:
                        del active_connections[self.client_ip]
                    logger.debug(f"Connection closed: IP {self.client_ip}, Thread {thread_id}, Remaining connections for IP: {len(active_connections.get(self.client_ip, set()))}")
    
    def log_message(self, format, *args):
        """Override to suppress 404 errors for optional files and log to file"""
        # Suppress 404 errors for source maps and Chrome DevTools files (they're optional)
        # log_message format: "code message" where code is like "404"
        if len(args) >= 2:
            status_code = str(args[1])
            path = str(args[0]) if args else ""
            if status_code == "404" and ('.map' in path or '.well-known' in path or 'devtools' in path.lower()):
                return  # Don't log these 404s
            # Log to file with detailed information
            client_ip = self.client_address[0]
            # Update last activity timestamp
            with connection_lock:
                last_activity[client_ip] = time.time()
            log_msg = f"HTTP {status_code} | {path} | Client: {client_ip}"
            if status_code.startswith('4') or status_code.startswith('5'):
                logger.warning(log_msg)
            else:
                logger.info(log_msg)
            # Force flush to ensure log is written immediately
            file_handler.flush()
        # Log all other messages normally
        super().log_message(format, *args)
    
    def log_request(self, code='-', size='-'):
        """Override to log all requests with details"""
        client_ip = self.client_address[0]
        method = self.command
        path = self.path
        user_agent = self.headers.get('User-Agent', 'Unknown')
        referer = self.headers.get('Referer', 'None')
        
        # Update last activity timestamp
        with connection_lock:
            last_activity[client_ip] = time.time()
        
        log_msg = f"REQUEST | {method} {path} | Status: {code} | Size: {size} | Client: {client_ip} | UA: {user_agent[:50]}"
        logger.info(log_msg)
        # Force flush to ensure log is written immediately
        file_handler.flush()
    
    def log_error(self, format, *args):
        """Override to log errors to file"""
        error_msg = format % args
        
        # Suppress common connection errors that are normal (client disconnects)
        if 'ConnectionAbortedError' in error_msg or 'ConnectionResetError' in error_msg or 'BrokenPipeError' in error_msg:
            # These are normal when clients disconnect - only log at debug level
            client_ip = getattr(self, 'client_address', ['Unknown'])[0] if hasattr(self, 'client_address') else 'Unknown'
            path = getattr(self, 'path', 'Unknown')
            logger.debug(f"Client disconnect (normal): {error_msg} | Client: {client_ip} | Path: {path}")
            file_handler.flush()
            return  # Don't call super().log_error() to suppress the exception traceback
        
        # Log other errors normally
        client_ip = getattr(self, 'client_address', ['Unknown'])[0] if hasattr(self, 'client_address') else 'Unknown'
        # self.path might not exist if request timed out before parsing
        path = getattr(self, 'path', 'Unknown')
        logger.error(f"ERROR | {error_msg} | Client: {client_ip} | Path: {path}")
        # Force flush to ensure log is written immediately
        file_handler.flush()
        super().log_error(format, *args)
    
    def do_GET(self):
        """Override to handle optional files gracefully and log client events"""
        parsed_path = urlparse(self.path)
        
        # Handle Server-Sent Events endpoint for auto-refresh
        if parsed_path.path == '/api/reload':
            self.handle_sse_reload()
            return
        
        # Handle client-side logging endpoint
        if parsed_path.path == '/api/log':
            self.handle_client_log()
            return
        
        # Handle Supabase status endpoint
        if parsed_path.path == '/api/supabase-status':
            self.handle_supabase_status()
            return
        
        # Handle encryption key endpoint (for client-server key sync)
        if parsed_path.path == '/api/encryption-key':
            self.handle_encryption_key()
            return
        
        # Handle anonymized training data endpoint
        if parsed_path.path.startswith('/api/anonymized-data'):
            self.handle_anonymized_data()
            return
        
        # Serve tutorial test page at /tutorial (same app, tutorial auto-opens for demo/testing)
        if parsed_path.path.rstrip('/') == '/tutorial':
            self.handle_tutorial_page()
            return
        # Return 204 (No Content) for optional files instead of 404
        optional_files = ['.map', '.well-known', 'devtools']
        if any(opt in self.path.lower() for opt in optional_files):
            self.send_response(204)  # No Content - file is optional
            self.end_headers()
            return
        # Handle normal requests
        super().do_GET()
    
    def do_POST(self):
        """Handle POST requests for client-side logging and Supabase"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/log':
            self.handle_client_log()
            return
        
        if parsed_path.path == '/api/sync-log':
            self.handle_sync_log()
            return
        
        # For other POST requests, return 405 Method Not Allowed
        self.send_response(405)
        self.end_headers()
    
    def handle_tutorial_page(self):
        """Serve index.html for /tutorial so the app loads with the tutorial auto-opened for testing."""
        try:
            # Prefer cwd (set by main()), fallback to directory containing this script
            index_path = Path.cwd() / 'index.html'
            if not index_path.is_file():
                index_path = APP_DIR / 'index.html'
            if not index_path.is_file():
                self.send_error(404, 'index.html not found')
                return
            with open(index_path, 'rb') as f:
                body = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            logger.exception('Error serving tutorial page')
            self.send_error(500, str(e))
    
    def handle_supabase_status(self):
        """Handle Supabase status check endpoint"""
        try:
            # Re-check Supabase availability
            global SUPABASE_AVAILABLE
            current_available = check_supabase_availability()
            if current_available != SUPABASE_AVAILABLE:
                SUPABASE_AVAILABLE = current_available
                if current_available:
                    logger.info("Supabase availability updated: now available")
            
            client = init_supabase_client()
            status = {
                'connected': client is not None,
                'available': SUPABASE_AVAILABLE
            }
            
            # Try a simple query to verify connection
            if client:
                try:
                    test_response = client.table('anonymized_data').select('id').limit(1).execute()
                    status['connection_test'] = 'success'
                except Exception as e:
                    status['connection_test'] = 'failed'
                    status['error'] = str(e)[:100]
            else:
                status['connection_test'] = 'not_available'
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            origin = self.headers.get('Origin', '')
            allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
            if origin in allowed_origins:
                self.send_header('Access-Control-Allow-Origin', origin)
            self.end_headers()
            self.wfile.write(json.dumps(status).encode('utf-8'))
        except Exception as e:
            logger.error(f"Error handling supabase status: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def handle_encryption_key(self):
        """Handle encryption key endpoint for client-server synchronization"""
        try:
            key = get_encryption_key()
            # Convert bytes back to hex string for transmission
            key_hex = key.hex()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            origin = self.headers.get('Origin', '')
            allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
            if origin in allowed_origins:
                self.send_header('Access-Control-Allow-Origin', origin)
            self.end_headers()
            
            response = {
                'success': True,
                'key': key_hex,
                'algorithm': 'AES-256-GCM'
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            logger.debug("Encryption key served to client")
        except Exception as e:
            logger.error(f"Error handling encryption key request: {e}", exc_info=True)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def handle_sse_reload(self):
        """Handle Server-Sent Events for auto-refresh on file changes"""
        try:
            # Set up SSE headers
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('X-Accel-Buffering', 'no')  # Disable buffering in nginx if present
            # CORS for SSE
            origin = self.headers.get('Origin', '')
            allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
            if origin in allowed_origins or not origin:
                self.send_header('Access-Control-Allow-Origin', origin if origin else '*')
            self.end_headers()
            
            client_ip = self.client_address[0]
            logger.info(f"SSE client connected: {client_ip}")
            
            # Add client to list
            with sse_lock:
                sse_clients.append((client_ip, self.wfile))
                logger.debug(f"SSE clients: {len(sse_clients)}")
            
            # Send initial connection message
            try:
                self.wfile.write(b'data: {"type":"connected"}\n\n')
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                # Client disconnected - normal when page reloads
                logger.debug(f"SSE client disconnected during initial connection: {client_ip}")
                with sse_lock:
                    sse_clients[:] = [(ip, w) for ip, w in sse_clients if w != self.wfile]
                return
            
            # Keep connection alive and wait for file change events
            while True:
                try:
                    # Wait for file change event (with short timeout to allow quick recovery)
                    if file_change_event.wait(timeout=5):
                        # File changed - send reload message
                        message = json.dumps({"type": "reload", "timestamp": time.time()})
                        self.wfile.write(f'data: {message}\n\n'.encode('utf-8'))
                        self.wfile.flush()
                        file_change_event.clear()
                        logger.info(f"Sent reload signal to SSE client: {client_ip}")
                    else:
                        # Timeout - send keepalive ping to detect dead connections
                        self.wfile.write(b': keepalive\n\n')
                        self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError) as e:
                    # Client disconnected - normal when page reloads or tab closes
                    error_code = getattr(e, 'winerror', None) or getattr(e, 'errno', None)
                    if error_code == 10053:  # Windows: Connection aborted
                        logger.debug(f"SSE client disconnected (normal): {client_ip}")
                    else:
                        logger.debug(f"SSE client disconnected: {client_ip}, Error: {type(e).__name__}")
                    break
                except Exception as e:
                    # Unexpected error - log and break
                    logger.error(f"Unexpected error in SSE loop: {client_ip}, Error: {e}", exc_info=True)
                    break
        except Exception as e:
            logger.error(f"Error in SSE handler: {e}", exc_info=True)
        finally:
            # Remove client from list
            with sse_lock:
                sse_clients[:] = [(ip, w) for ip, w in sse_clients if w != self.wfile]
            logger.debug(f"SSE client removed: {client_ip}, remaining: {len(sse_clients)}")
    
    def handle_client_log(self):
        """Handle client-side log submissions"""
        try:
            # Security: Limit content length to prevent DoS
            MAX_CONTENT_LENGTH = 1024 * 10  # 10KB max
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > MAX_CONTENT_LENGTH:
                self.send_response(413)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Payload too large'}).encode('utf-8'))
                logger.warning(f"Request rejected: Content-Length {content_length} exceeds {MAX_CONTENT_LENGTH}")
                return
            
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    log_data = json.loads(post_data.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError) as e:
                    logger.warning(f"Invalid JSON in log request: {e}")
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode('utf-8'))
                    return
                
                # Extract and validate log information
                level = log_data.get('level', 'INFO').upper()
                # Security: Validate level is one of allowed values
                allowed_levels = ['INFO', 'WARN', 'WARNING', 'ERROR', 'DEBUG']
                if level not in allowed_levels:
                    level = 'INFO'
                
                message = log_data.get('message', '')
                # Security: Limit message length and sanitize
                message = message[:500] if len(message) > 500 else message
                message = message.replace('\n', ' ').replace('\r', '')  # Remove newlines
                
                timestamp = log_data.get('timestamp', datetime.now().isoformat())
                # Security: Validate timestamp format (basic check)
                if len(timestamp) > 50:
                    timestamp = datetime.now().isoformat()
                
                source = log_data.get('source', 'client')
                # Security: Limit source length
                source = source[:20] if len(source) > 20 else source
                
                details = log_data.get('details', {})
                # Security: Limit details size (convert to string and check length)
                if isinstance(details, dict):
                    details_str = json.dumps(details)
                    if len(details_str) > 1000:
                        details = {'error': 'Details too large'}
                else:
                    details = {}
                
                client_ip = self.client_address[0]
                
                # Update last activity timestamp
                with connection_lock:
                    last_activity[client_ip] = time.time()
                
                # Format log message
                log_msg = f"CLIENT | {level} | {message}"
                if details:
                    log_msg += f" | Details: {json.dumps(details)}"
                log_msg += f" | IP: {client_ip} | Time: {timestamp}"
                
                # Log based on level
                if level == 'ERROR':
                    logger.error(log_msg)
                elif level == 'WARN' or level == 'WARNING':
                    logger.warning(log_msg)
                elif level == 'DEBUG':
                    logger.debug(log_msg)
                else:
                    logger.info(log_msg)
                
                # Force flush to ensure log is written immediately
                file_handler.flush()
                
                # Security: Validate and sanitize input
                level = level[:10] if len(level) > 10 else level  # Limit length
                message = message[:500] if len(message) > 500 else message  # Limit message length
                
                # Send success response with security headers
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                # Security: Restrict CORS to localhost for development
                origin = self.headers.get('Origin', '')
                allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
                if origin in allowed_origins:
                    self.send_header('Access-Control-Allow-Origin', origin)
                else:
                    self.send_header('Access-Control-Allow-Origin', 'null')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('X-Content-Type-Options', 'nosniff')
                self.send_header('X-Frame-Options', 'DENY')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'logged'}).encode('utf-8'))
            else:
                # GET request to /api/log - return status
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'logging_endpoint_active'}).encode('utf-8'))
        except Exception as e:
            logger.error(f"Error handling client log: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def handle_sync_log(self):
        """Handle sync event logging from client"""
        try:
            # Security: Limit content length
            MAX_CONTENT_LENGTH = 1024 * 5  # 5KB max
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > MAX_CONTENT_LENGTH:
                self.send_response(413)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Payload too large'}).encode('utf-8'))
                return
            
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    sync_data = json.loads(post_data.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError) as e:
                    logger.warning(f"Invalid JSON in sync log request: {e}")
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode('utf-8'))
                    return
                
                # Extract sync information (support both field names)
                records_synced = sync_data.get('records_synced', sync_data.get('synced_count', 0))
                condition = sync_data.get('condition', 'Unknown')
                timestamp = sync_data.get('timestamp', datetime.now().isoformat())
                client_ip = self.client_address[0]
                
                # Log sync event
                logger.info(f"SYNC | Anonymized data synced to Supabase | Condition: {condition} | Records: {records_synced} | IP: {client_ip} | Time: {timestamp}")
                print(f"[SYNC] {records_synced} record(s) synced to Supabase anonymized_data for condition: {condition}")
                
                # Update last activity
                with connection_lock:
                    last_activity[client_ip] = time.time()
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                origin = self.headers.get('Origin', '')
                allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
                if origin in allowed_origins:
                    self.send_header('Access-Control-Allow-Origin', origin)
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'logged'}).encode('utf-8'))
            else:
                # GET request to /api/sync-log - return status
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'sync_logging_endpoint_active'}).encode('utf-8'))
        except Exception as e:
            logger.error(f"Error handling sync log: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def handle_anonymized_data(self):
        """Handle fetching decrypted anonymized training data"""
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            # Extract condition parameter
            condition = None
            if 'condition' in query_params:
                condition = unquote(query_params['condition'][0]).strip()
            
            # Security: Validate condition parameter length
            if condition and len(condition) > 200:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Condition parameter too long'}).encode('utf-8'))
                return
            
            # Get limit parameter (default 1000)
            limit = 1000
            if 'limit' in query_params:
                try:
                    limit = min(int(query_params['limit'][0]), 10000)  # Max 10000
                except (ValueError, IndexError):
                    pass
            
            global SUPABASE_AVAILABLE
            SUPABASE_AVAILABLE = check_supabase_availability()
            if not SUPABASE_AVAILABLE:
                self.send_response(503)
                self.send_header('Content-Type', 'application/json')
                origin = self.headers.get('Origin', '')
                allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
                if origin in allowed_origins:
                    self.send_header('Access-Control-Allow-Origin', origin)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Supabase not available'}).encode('utf-8'))
                return
            
            # Fetch and decrypt anonymized data
            data = search_supabase_data(condition=condition, limit=limit)
            
            # Transform data for training: extract only anonymized_logs fields
            training_data = []
            if data:
                for record in data:
                    log_data = record.get('anonymized_logs') or record.get('anonymized_log', {})
                    if isinstance(log_data, dict):
                        training_data.append(log_data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            origin = self.headers.get('Origin', '')
            allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
            if origin in allowed_origins:
                self.send_header('Access-Control-Allow-Origin', origin)
            self.end_headers()
            
            response = {
                'success': True,
                'condition': condition,
                'count': len(training_data),
                'data': training_data
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            logger.info(f"Anonymized training data fetched: condition={condition}, records={len(training_data)}")
        
        except Exception as e:
            logger.error(f"Error handling anonymized data request: {e}", exc_info=True)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, Prefer')
        self.end_headers()
    
    def end_headers(self):
        # Security: Add security headers to all responses
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        # Permissions-Policy: Restrict browser features for security
        # Note: Removed 'ambient-light-sensor' and 'document-domain' as they are not recognized features
        permissions_policy = (
            'accelerometer=(), '
            'autoplay=(), '
            'camera=(), '
            'display-capture=(), '
            'encrypted-media=(), '
            'fullscreen=(self), '
            'geolocation=(), '
            'gyroscope=(), '
            'magnetometer=(), '
            'microphone=(), '
            'midi=(), '
            'payment=(), '
            'picture-in-picture=(), '
            'publickey-credentials-get=(self), '
            'screen-wake-lock=(), '
            'sync-xhr=(), '
            'usb=(), '
            'web-share=(self), '
            'xr-spatial-tracking=()'
        )
        self.send_header('Permissions-Policy', permissions_policy)
        
        # CORS: Only allow localhost for security
        origin = self.headers.get('Origin', '')
        allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
        if origin in allowed_origins:
            self.send_header('Access-Control-Allow-Origin', origin)
        elif not origin:  # Same-origin request
            pass  # Don't add CORS header
        else:
            self.send_header('Access-Control-Allow-Origin', 'null')
        
        # Cache Transformers.js file aggressively (it's a large library)
        if self.path.endswith('transformers.js'):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            self.send_header('Pragma', 'public')
        else:
            # No cache for other files
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        super().end_headers()
    
    def guess_type(self, path):
        """Override to set correct MIME types"""
        # Ensure JavaScript files are served with correct MIME type
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.json'):
            return 'application/json'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.html'):
            return 'text/html'
        
        # For other files, use parent's guess_type
        return super().guess_type(path)

def notify_sse_clients():
    """Notify all SSE clients to reload by waking their handler threads.
    Each handler writes to its own wfile (same thread as the socket), avoiding
    cross-thread write failures (e.g. on Windows) that caused "Notified 0" despite active clients.
    """
    global last_file_change_time
    last_file_change_time = time.time()
    with sse_lock:
        n = len(sse_clients)
    file_change_event.set()
    logger.info(f"Notified {n} SSE client(s) to reload")

# FileChangeHandler class - only defined if watchdog is available
if WATCHDOG_AVAILABLE:
    class FileChangeHandler(FileSystemEventHandler):
        """Handler for file system events"""
        
        def __init__(self):
            super().__init__()
            self.last_modified = {}
            # Files/directories to ignore
            self.ignore_patterns = [
                '.git', '__pycache__', '.pyc', '.log', 'logs',
                '.DS_Store', 'Thumbs.db', '.swp', '.tmp'
            ]
        
        def should_ignore(self, path):
            """Check if path should be ignored"""
            path_str = str(path).lower()
            return any(pattern.lower() in path_str for pattern in self.ignore_patterns)
        
        def on_modified(self, event):
            """Called when a file or directory is modified"""
            if event.is_directory:
                return
            
            if self.should_ignore(event.src_path):
                return
            
            # Only watch relevant file types
            if not any(event.src_path.endswith(ext) for ext in ['.html', '.js', '.css', '.json', '.py']):
                return
            
            # Debounce rapid changes (same file modified multiple times)
            current_time = time.time()
            if event.src_path in self.last_modified:
                if current_time - self.last_modified[event.src_path] < 0.5:
                    return  # Ignore if modified less than 0.5s ago
            
            self.last_modified[event.src_path] = current_time
            
            logger.info(f"File changed: {event.src_path}")
            logger.info("Notifying all connected clients to reload...")
            notify_sse_clients()
        
        def on_created(self, event):
            """Called when a file or directory is created"""
            if event.is_directory or self.should_ignore(event.src_path):
                return
            logger.info(f"File created: {event.src_path}")
            notify_sse_clients()
        
        def on_deleted(self, event):
            """Called when a file or directory is deleted"""
            if event.is_directory or self.should_ignore(event.src_path):
                return
            logger.info(f"File deleted: {event.src_path}")
            notify_sse_clients()
else:
    # Dummy class when watchdog is not available
    class FileChangeHandler:
        """Dummy handler when watchdog is not available"""
        pass

def cleanup_inactive_connections():
    """Periodically clean up inactive connections"""
    while True:
        try:
            time.sleep(CLEANUP_INTERVAL)
            current_time = time.time()
            inactive_ips = []
            
            with connection_lock:
                for ip, last_time in list(last_activity.items()):
                    if current_time - last_time > CONNECTION_TIMEOUT:
                        inactive_ips.append(ip)
                        # Clean up inactive IPs
                        if ip in active_connections:
                            connection_count = len(active_connections[ip])
                            if connection_count > 0:
                                logger.info(f"Cleaning up inactive connections for IP {ip} ({connection_count} connections inactive for {int(current_time - last_time)}s)")
                            del active_connections[ip]
                        if ip in last_activity:
                            del last_activity[ip]
                
                if inactive_ips:
                    logger.info(f"Cleaned up {len(inactive_ips)} inactive IP(s)")
        except Exception as e:
            logger.error(f"Error in cleanup thread: {e}", exc_info=True)

def start_server_thread():
    """Start the HTTP server in a separate thread"""
    global server_instance, server_thread
    
    def server_worker():
        global server_instance
        try:
            with server_lock:
                server_instance = ThreadingHTTPServer((HOST, PORT), HealthAppHandler)
                logger.info("Server socket created successfully")
            
            logger.info("Server entering serve_forever() loop")
            server_instance.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e) or "Only one usage" in str(e):
                logger.error(f"Port {PORT} is already in use")
                raise
            else:
                logger.error(f"Error in server thread: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Error in server thread: {e}", exc_info=True)
    
    # Stop existing server if running
    if server_instance is not None:
        try:
            logger.info("Shutting down existing server...")
            server_instance.shutdown()
            if server_thread and server_thread.is_alive():
                server_thread.join(timeout=2)
            server_instance = None
        except Exception as e:
            logger.warning(f"Error shutting down existing server: {e}")
    
    # Start new server thread
    server_thread = threading.Thread(target=server_worker, daemon=True)
    server_thread.start()
    logger.info("Server thread started")
    # Give it a moment to initialize
    time.sleep(0.5)
    return server_instance

def create_server_dashboard():
    """Create Tkinter dashboard for server controls"""
    if not TKINTER_AVAILABLE:
        return None
    
    root = tk.Tk()
    root.title("Health App Server Dashboard")
    root.geometry("900x700")
    root.configure(bg='#1e1e1e')
    
    # Style
    style = ttk.Style()
    style.theme_use('clam')
    # Title: gray text, no explicit background (will inherit from parent frame)
    style.configure('Title.TLabel', font=('Arial', 16, 'bold'), foreground='#808080')
    # Status labels: gray text, no explicit background (will inherit from parent frame)
    style.configure('Status.TLabel', font=('Arial', 10), foreground='#808080')
    style.configure('Toggle.TCheckbutton', background='#1e1e1e', foreground='#e0f2f1')
    
    # Main frame
    main_frame = ttk.Frame(root, padding="10")
    main_frame.pack(fill=tk.BOTH, expand=True)
    
    # Title
    title_label = ttk.Label(main_frame, text="Health App Server Control Panel", style='Title.TLabel')
    title_label.pack(pady=10)
    
    # Status frame
    status_frame = ttk.LabelFrame(main_frame, text="Server Status", padding="10")
    status_frame.pack(fill=tk.X, pady=5)
    
    server_status = ttk.Label(status_frame, text=f"Server: http://localhost:{PORT}", style='Status.TLabel')
    server_status.pack(anchor=tk.W)
    
    
    # Supabase Database Controls
    supabase_frame = ttk.LabelFrame(main_frame, text="Supabase Database", padding="10")
    supabase_frame.pack(fill=tk.X, pady=5)
    
    # Connection status frame
    connection_frame = ttk.Frame(supabase_frame)
    connection_frame.pack(fill=tk.X, pady=(0, 5))
    
    connection_status = ttk.Label(connection_frame, text="Status: Not Connected", style='Status.TLabel')
    connection_status.pack(side=tk.LEFT, anchor=tk.W)
    
    def check_connection():
        """Check Supabase connection"""
        # Re-check if supabase is available at runtime (in case it was installed after server started)
        global SUPABASE_AVAILABLE
        supabase_available = check_supabase_availability()
        if supabase_available and not SUPABASE_AVAILABLE:
            SUPABASE_AVAILABLE = True
            logger.info("Supabase library found at runtime (was not available at startup)")
        elif not supabase_available:
            SUPABASE_AVAILABLE = False
        
        if not supabase_available:
            connection_status.config(text="Status: Not Connected (Install: pip install supabase)", foreground='#ff9800')
            return False
        
        client = init_supabase_client()
        if not client:
            connection_status.config(text="Status: Not Connected (Failed to initialize)", foreground='#ff9800')
            return False
        
        # Test actual connection by making a simple query
        try:
            # Try to fetch one record to verify connection works
            test_response = client.table('anonymized_data').select('id').limit(1).execute()
            connection_status.config(text="Status: Connected", foreground='#4caf50')
            return True
        except Exception as e:
            logger.error(f"Supabase connection test failed: {e}")
            connection_status.config(text=f"Status: Not Connected (Error: {str(e)[:50]})", foreground='#ff9800')
            return False
    # Refresh connection button
    refresh_connection_btn = ttk.Button(connection_frame, text="Refresh Connection", command=check_connection)
    refresh_connection_btn.pack(side=tk.LEFT, padx=(10, 0))
    
    def install_requirements_ui():
        """Install requirements from UI"""
        connection_status.config(text="Status: Installing requirements...", foreground='#ff9800')
        root.update()
        
        def install_thread():
            try:
                success = install_requirements()
                if success:
                    root.after(0, lambda: connection_status.config(text="Status: Requirements installed - Click Refresh", foreground='#4caf50'))
                    root.after(0, lambda: messagebox.showinfo("Success", "Requirements installed successfully!\n\nClick 'Refresh Connection' to test the connection."))
                    # Auto-refresh connection after a short delay
                    root.after(2000, check_connection)
                else:
                    root.after(0, lambda: connection_status.config(text="Status: Installation failed - Check logs", foreground='#ff9800'))
                    root.after(0, lambda: messagebox.showerror("Error", "Failed to install requirements.\n\nCheck the server logs for details."))
            except Exception as e:
                logger.error(f"Error in install_requirements_ui: {e}", exc_info=True)
                root.after(0, lambda: connection_status.config(text="Status: Installation error", foreground='#ff9800'))
                root.after(0, lambda: messagebox.showerror("Error", f"Error installing requirements: {e}"))
        
        threading.Thread(target=install_thread, daemon=True).start()
    
    # Install requirements button
    install_requirements_btn = ttk.Button(connection_frame, text="Install Requirements", command=install_requirements_ui)
    install_requirements_btn.pack(side=tk.LEFT, padx=(10, 0))
    
    check_connection()
    
    # Search frame
    search_frame = ttk.Frame(supabase_frame)
    search_frame.pack(fill=tk.X, pady=5)
    
    ttk.Label(search_frame, text="Search by Condition:", style='Status.TLabel').pack(side=tk.LEFT, padx=5)
    search_var = tk.StringVar()
    search_dropdown = ttk.Combobox(search_frame, textvariable=search_var, width=25, state='readonly')
    search_dropdown.pack(side=tk.LEFT, padx=5)
    
    search_results = []
    
    def load_available_conditions():
        """Load all unique conditions from Supabase and populate dropdown"""
        global SUPABASE_AVAILABLE
        SUPABASE_AVAILABLE = check_supabase_availability()
        if not SUPABASE_AVAILABLE:
            search_dropdown['values'] = []
            return

        client = init_supabase_client()
        if not client:
            search_dropdown['values'] = []
            return
        
        # Fetch all unique conditions
        all_conditions = []
        from_range = 0
        page_size = 1000
        has_more = True
        while has_more:
            try:
                response = client.table('anonymized_data').select('medical_condition').range(from_range, from_range + page_size - 1).execute()
                if response.data:
                    conditions = [d['medical_condition'] for d in response.data if d.get('medical_condition')]
                    all_conditions.extend(conditions)
                    if len(response.data) < page_size:
                        has_more = False
                    else:
                        from_range += page_size
                else:
                    has_more = False
            except Exception as e:
                logger.error(f"Error fetching conditions: {e}")
                has_more = False
        
        # Get unique conditions and sort
        unique_conditions = sorted(list(set(all_conditions)))
        try:
            search_dropdown['values'] = [''] + unique_conditions  # Add empty option for "all"
            logger.info(f"Loaded {len(unique_conditions)} unique conditions for dropdown")
        except Exception as e:
            logger.error(f"Error loading conditions: {e}", exc_info=True)
            search_dropdown['values'] = []
    load_available_conditions()
    
    def perform_search():
        """Search Supabase data"""
        global SUPABASE_AVAILABLE
        SUPABASE_AVAILABLE = check_supabase_availability()
        if not SUPABASE_AVAILABLE:
            messagebox.showerror("Error", "Supabase library not installed.\nInstall with: pip install supabase")
            return
        
        condition = search_var.get().strip()
        condition_filter = condition if condition else None
        
        try:
            results = search_supabase_data(condition=condition_filter, limit=100)
            if results is None:
                messagebox.showerror("Error", "Failed to search Supabase. Check connection.")
                return
            
            search_results.clear()
            search_results.extend(results)
            
            # Update viewer
            refresh_db_viewer()
            
            # Show result count in status or silently update (no popup)
            logger.info(f"Search complete: Found {len(results)} record(s) for condition: {condition_filter or 'All'}")
        except Exception as e:
            logger.error(f"Error searching Supabase: {e}", exc_info=True)
            messagebox.showerror("Error", f"Search failed: {e}")
    
    search_btn = ttk.Button(search_frame, text="Search", command=perform_search)
    search_btn.pack(side=tk.LEFT, padx=5)
    
    # Add refresh button to reload conditions
    refresh_conditions_btn = ttk.Button(search_frame, text="Refresh Conditions", command=load_available_conditions)
    refresh_conditions_btn.pack(side=tk.LEFT, padx=5)
    
    # Action frame (renamed from delete_frame, contains export and generate buttons)
    action_frame = ttk.Frame(supabase_frame)
    action_frame.pack(fill=tk.X, pady=5)
    
    # Export frame
    def export_data():
        """Export Supabase data to CSV"""
        global SUPABASE_AVAILABLE
        SUPABASE_AVAILABLE = check_supabase_availability()
        if not SUPABASE_AVAILABLE:
            messagebox.showerror("Error", "Supabase library not installed.\nInstall with: pip install supabase")
            return
        
        # Ask for export options
        dialog = tk.Toplevel(root)
        dialog.title("Export Data")
        dialog.geometry("400x150")
        dialog.configure(bg='#1e1e1e')
        dialog.transient(root)
        dialog.grab_set()
        
        condition_var = tk.StringVar()
        ttk.Label(dialog, text="Filter by condition (leave empty for all):", 
                 background='#1e1e1e', foreground='#e0f2f1').pack(pady=5)
        ttk.Entry(dialog, textvariable=condition_var, width=30).pack(pady=5)
        
        def do_export():
            condition = condition_var.get().strip() if condition_var.get().strip() else None

            def export_thread():
                try:
                    output_path = export_supabase_data(condition=condition)
                    if output_path:
                        root.after(0, lambda: messagebox.showinfo(
                            "Success",
                            f"Data exported successfully!\n\nSaved to:\n{output_path}"
                        ))
                    else:
                        root.after(0, lambda: messagebox.showerror("Error", "Export failed"))
                except Exception as e:
                    logger.error(f"Error exporting: {e}", exc_info=True)
                    root.after(0, lambda: messagebox.showerror("Error", f"Export failed: {e}"))
                finally:
                    dialog.destroy()
            
            threading.Thread(target=export_thread, daemon=True).start()
        
        ttk.Button(dialog, text="Export CSV", command=do_export).pack(pady=10)
        ttk.Button(dialog, text="Cancel", command=dialog.destroy).pack()
    
    export_btn = ttk.Button(action_frame, text="Export to CSV", command=export_data)
    export_btn.pack(side=tk.LEFT, padx=5)
    
    # Wipe database function
    def wipe_database():
        """Wipe all data from anonymized_data table"""
        global SUPABASE_AVAILABLE
        SUPABASE_AVAILABLE = check_supabase_availability()
        if not SUPABASE_AVAILABLE:
            messagebox.showerror("Error", "Supabase library not installed.")
            return
        
        # Confirmation dialog
        if not messagebox.askyesno("Confirm Wipe", 
            "WARNING: This will delete ALL data from the database!\n\n"
            "Are you sure you want to continue?"):
            return
        
        try:
            client = init_supabase_client()
            if not client:
                messagebox.showerror("Error", "Supabase client not initialized")
                return
            
            logger.info("Wiping database: deleting all records from anonymized_data...")

            # Prefer using the Supabase service key to perform a server-side delete in one request.
            # This avoids slow client-side loops and bypasses RLS when using the SERVICE KEY.
            if SUPABASE_SERVICE_KEY:
                try:
                    from supabase import create_client as create_service_client
                    svc = create_service_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
                    # Delete all rows where id != 0 (serial IDs start at 1) to remove all records
                    resp = svc.table('anonymized_data').delete().neq('id', 0).execute()
                    # resp may contain error info depending on client version
                    deleted = 0
                    if hasattr(resp, 'error') and resp.error:
                        logger.error(f"Service-key delete returned error: {resp.error}")
                        raise Exception(resp.error)
                    if hasattr(resp, 'count') and resp.count is not None:
                        deleted = resp.count
                    elif getattr(resp, 'data', None) is not None:
                        deleted = len(resp.data)
                    logger.info(f"Successfully deleted {deleted} records using service key")
                    messagebox.showinfo("Success", f"Database wiped!\nDeleted {deleted} records\n\n"
                        "Note: To fully reset the ID counter, run in Supabase SQL Editor:\n"
                        "ALTER SEQUENCE anonymized_data_id_seq RESTART WITH 1;")
                except Exception as e:
                    logger.warning(f"Service-key delete failed, falling back to client-side deletes: {e}")
                    # Fall through to client-side deletion below

            # If service-key path not used or failed, fall back to fetching IDs and deleting one-by-one
            all_records = client.table('anonymized_data').select('id').execute()
            if all_records and all_records.data:
                record_count = len(all_records.data)
                logger.info(f"Found {record_count} records to delete (client-side)")
                deleted = 0
                for record in all_records.data:
                    try:
                        client.table('anonymized_data').delete().eq('id', record['id']).execute()
                        deleted += 1
                    except Exception as e:
                        logger.warning(f"Failed to delete record {record.get('id')}: {e}")
                logger.info(f"Successfully deleted {deleted}/{record_count} records")
                messagebox.showinfo("Success", f"Database wiped!\nDeleted {deleted} records\n\n"
                    "Note: To fully reset the ID counter, run in Supabase SQL Editor:\n"
                    "ALTER SEQUENCE anonymized_data_id_seq RESTART WITH 1;")
            else:
                logger.info("Database already empty")
                messagebox.showinfo("Info", "Database is already empty")
            
            # Refresh the viewer
            search_results.clear()
            refresh_db_viewer()
            perform_search()
            logger.info("Database wipe complete")
            
        except Exception as e:
            logger.error(f"Error wiping database: {e}", exc_info=True)
            messagebox.showerror("Error", f"Failed to wipe database:\n{str(e)[:100]}")
    
    wipe_btn = ttk.Button(action_frame, text="Wipe Database", command=wipe_database)
    wipe_btn.pack(side=tk.LEFT, padx=5)
    
    # Generate and post sample data frame
    def generate_sample_data():
        """Generate sample data and post to Supabase"""
        global SUPABASE_AVAILABLE
        SUPABASE_AVAILABLE = check_supabase_availability()
        if not SUPABASE_AVAILABLE:
            messagebox.showerror("Error", "Supabase library not installed.\nInstall with: pip install supabase")
            return
        
        # Ask for parameters
        dialog = tk.Toplevel(root)
        dialog.title("Generate Sample Data to Supabase")
        dialog.geometry("550x360")
        dialog.configure(bg='#1e1e1e')
        dialog.transient(root)
        dialog.grab_set()
        
        # Title frame
        title_frame = ttk.Frame(dialog)
        title_frame.pack(fill=tk.X, padx=20, pady=(20, 10))
        ttk.Label(title_frame, text="Sample Data Generation", background='#1e1e1e', foreground='#4caf50', font=('Arial', 12, 'bold')).pack(anchor=tk.W)
        ttk.Label(title_frame, text="Configure parameters for generating realistic health data", background='#1e1e1e', foreground='#999999', font=('Arial', 9)).pack(anchor=tk.W)
        
        # Input frame
        input_frame = ttk.Frame(dialog)
        input_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Days row
        days_label_frame = ttk.Frame(input_frame)
        days_label_frame.pack(fill=tk.X, pady=10)
        ttk.Label(days_label_frame, text="Number of days:", background='#1e1e1e', foreground='#e0f2f1', width=18).pack(side=tk.LEFT, anchor=tk.W)
        days_var = tk.StringVar(value="90")
        days_entry = ttk.Entry(days_label_frame, textvariable=days_var, width=25)
        days_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
        ttk.Label(days_label_frame, text="(1-3650)", background='#1e1e1e', foreground='#666666', font=('Arial', 9)).pack(side=tk.LEFT, padx=5)
        
        # Condition row
        condition_label_frame = ttk.Frame(input_frame)
        condition_label_frame.pack(fill=tk.X, pady=10)
        ttk.Label(condition_label_frame, text="Medical Condition:", background='#1e1e1e', foreground='#e0f2f1', width=18).pack(side=tk.LEFT, anchor=tk.W)
        condition_var = tk.StringVar(value="Medical Condition")
        condition_entry = ttk.Entry(condition_label_frame, textvariable=condition_var, width=25)
        condition_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
        
        # Weight row
        weight_label_frame = ttk.Frame(input_frame)
        weight_label_frame.pack(fill=tk.X, pady=10)
        ttk.Label(weight_label_frame, text="Base Weight (kg):", background='#1e1e1e', foreground='#e0f2f1', width=18).pack(side=tk.LEFT, anchor=tk.W)
        weight_var = tk.StringVar(value="75.0")
        weight_entry = ttk.Entry(weight_label_frame, textvariable=weight_var, width=25)
        weight_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
        
        def do_generate():
            try:
                num_days = int(days_var.get())
                condition = condition_var.get().strip()
                weight = float(weight_var.get())
                
                if num_days <= 0 or num_days > 3650:
                    messagebox.showerror("Error", "Number of days must be between 1 and 3650")
                    return
                
                if not condition:
                    messagebox.showerror("Error", "Medical condition cannot be empty")
                    return
                
                # Start generation immediately without confirmation
                # Disable buttons and show progress
                for widget in dialog.winfo_children():
                    if isinstance(widget, ttk.Button) and widget.cget('text') in ['Generate & Post', 'Cancel']:
                        widget.config(state='disabled')
                
                progress_label = ttk.Label(dialog, text="Generating data...", background='#1e1e1e', foreground='#4caf50')
                progress_label.pack(pady=5)
                
                # Generate in background thread to avoid blocking UI
                def generate_thread():
                    def safe_update_progress(text):
                        try:
                            if dialog.winfo_exists():
                                progress_label.config(text=text)
                        except Exception:
                            pass

                    try:
                        root.after(0, lambda: safe_update_progress("Generating and posting data..."))
                        count = generate_and_post_sample_data_to_supabase(num_days, condition, weight)
                        root.after(0, lambda: safe_update_progress(f"Complete! Posted {count} records."))
                        root.after(0, perform_search)  # Refresh search
                        root.after(0, refresh_db_viewer)  # Refresh viewer
                        root.after(1000, dialog.destroy)  # Auto-close after 1 second
                    except Exception as e:
                        logger.error(f"Error in generate thread: {e}", exc_info=True)
                        root.after(0, lambda: safe_update_progress(f"Error: {str(e)[:50]}"))
                        root.after(2000, dialog.destroy)  # Auto-close after error
                
                threading.Thread(target=generate_thread, daemon=True).start()
                
            except ValueError:
                messagebox.showerror("Error", "Please enter valid numbers")
        
        # Button frame
        button_frame = ttk.Frame(dialog)
        button_frame.pack(fill=tk.X, padx=20, pady=(10, 20))
        ttk.Button(button_frame, text="Generate & Post", command=do_generate).pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)
    
    generate_btn = ttk.Button(action_frame, text="Generate Sample Data", command=generate_sample_data)
    generate_btn.pack(side=tk.LEFT, padx=5)
    
    # Generate CSV sample data
    def generate_csv_sample():
        """Generate sample CSV data"""
        # Ask for parameters
        dialog = tk.Toplevel(root)
        dialog.title("Generate CSV Sample Data")
        dialog.geometry("400x200")
        dialog.configure(bg='#1e1e1e')
        dialog.transient(root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Number of days:", background='#1e1e1e', foreground='#e0f2f1').pack(pady=5)
        days_var = tk.StringVar(value="90")
        days_entry = ttk.Entry(dialog, textvariable=days_var, width=20)
        days_entry.pack(pady=5)
        
        ttk.Label(dialog, text="Base Weight (kg):", background='#1e1e1e', foreground='#e0f2f1').pack(pady=5)
        weight_var = tk.StringVar(value="75.0")
        weight_entry = ttk.Entry(dialog, textvariable=weight_var, width=20)
        weight_entry.pack(pady=5)
    
        def do_generate_csv():
            try:
                num_days = int(days_var.get())
                weight = float(weight_var.get())
                
                if num_days <= 0 or num_days > 3650:
                    messagebox.showerror("Error", "Number of days must be between 1 and 3650")
                    return
                
                # Disable buttons and show progress
                for widget in dialog.winfo_children():
                    if isinstance(widget, ttk.Button) and widget.cget('text') in ['Generate CSV', 'Cancel']:
                        widget.config(state='disabled')
                
                progress_label = ttk.Label(dialog, text="Generating CSV data...", background='#1e1e1e', foreground='#4caf50')
                progress_label.pack(pady=5)
                
                def generate_csv_thread():
                    try:
                        def safe_update_progress(text):
                            try:
                                if dialog.winfo_exists():
                                    progress_label.config(text=text)
                            except Exception:
                                pass
                        
                        root.after(0, lambda: safe_update_progress("Generating data..."))
                        script_dir = Path(__file__).parent.absolute()
                        output_path = script_dir / f'health_data_sample_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                        result = generate_sample_csv_data(num_days, weight, output_path)
                        if result:
                            root.after(0, lambda: safe_update_progress(f"Complete! Saved to:\n{Path(result).name}"))
                            logger.info(f"CSV generated: {result}")
                        else:
                            root.after(0, lambda: safe_update_progress("Error generating CSV!"))
                        root.after(1500, dialog.destroy)  # Auto-close after showing completion
                    except Exception as e:
                        logger.error(f"Error generating CSV: {e}", exc_info=True)
                        root.after(0, lambda: safe_update_progress(f"Error: {str(e)[:50]}"))
                        root.after(2000, dialog.destroy)  # Auto-close after error
                
                threading.Thread(target=generate_csv_thread, daemon=True).start()
                
            except ValueError:
                messagebox.showerror("Error", "Please enter valid numbers")
        
        ttk.Button(dialog, text="Generate CSV", command=do_generate_csv).pack(pady=10)
        ttk.Button(dialog, text="Cancel", command=dialog.destroy).pack()
    
    generate_csv_btn = ttk.Button(action_frame, text="Generate CSV File", command=generate_csv_sample)
    generate_csv_btn.pack(side=tk.LEFT, padx=5)
    
    # Database Viewer
    db_viewer_frame = ttk.LabelFrame(main_frame, text="Database Viewer", padding="10")
    db_viewer_frame.pack(fill=tk.BOTH, expand=True, pady=5)
    
    # Treeview for database records (with multi-select enabled)
    viewer_tree = ttk.Treeview(db_viewer_frame, columns=('id', 'condition', 'date', 'bpm', 'weight', 'fatigue', 'stiffness', 'sleep', 'mood', 'steps', 'flare'), show='headings', height=8, selectmode='extended')
    viewer_tree.heading('id', text='ID')
    viewer_tree.heading('condition', text='Condition')
    viewer_tree.heading('date', text='Date')
    viewer_tree.heading('bpm', text='BPM')
    viewer_tree.heading('weight', text='Weight')
    viewer_tree.heading('fatigue', text='Fatigue')
    viewer_tree.heading('stiffness', text='Stiffness')
    viewer_tree.heading('sleep', text='Sleep')
    viewer_tree.heading('mood', text='Mood')
    viewer_tree.heading('steps', text='Steps')
    viewer_tree.heading('flare', text='Flare')
    viewer_tree.column('id', width=40)
    viewer_tree.column('condition', width=140)
    viewer_tree.column('date', width=90)
    viewer_tree.column('bpm', width=50)
    viewer_tree.column('weight', width=60)
    viewer_tree.column('fatigue', width=60)
    viewer_tree.column('stiffness', width=70)
    viewer_tree.column('sleep', width=50)
    viewer_tree.column('mood', width=50)
    viewer_tree.column('steps', width=60)
    viewer_tree.column('flare', width=50)
    
    viewer_scroll = ttk.Scrollbar(db_viewer_frame, orient=tk.VERTICAL, command=viewer_tree.yview)
    viewer_tree.configure(yscrollcommand=viewer_scroll.set)
    
    viewer_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    viewer_scroll.pack(side=tk.RIGHT, fill=tk.Y)
    
    def refresh_db_viewer():
        """Refresh database viewer with search results"""
        try:
            # Clear existing items
            for item in viewer_tree.get_children():
                viewer_tree.delete(item)
            
            # Clear selection count if label exists
            try:
                selection_count_label.config(text="0 selected")
            except (NameError, AttributeError):
                pass  # Label not created yet
            
            global SUPABASE_AVAILABLE
            SUPABASE_AVAILABLE = check_supabase_availability()
            if not SUPABASE_AVAILABLE:
                return
            
            # Use search results if available, otherwise fetch all
            data_to_show = search_results if search_results else search_supabase_data(limit=100)
            
            if not data_to_show:
                logger.info("No data to display in database viewer")
                return
            
            logger.info(f"Database viewer: Loading {len(data_to_show)} records")
            
            for record in data_to_show[:100]:  # Limit to 100 for display
                try:
                    log_data = record.get('anonymized_logs') or record.get('anonymized_log', {})
                    
                    # If log_data is a string (encrypted), decrypt it
                    if isinstance(log_data, str) and log_data:
                        try:
                            # Try to decrypt if it looks encrypted (base64 encoded)
                            decrypted = decrypt_anonymized_data(log_data)
                            if decrypted and isinstance(decrypted, dict):
                                log_data = decrypted
                            else:
                                # Try JSON parse as fallback
                                log_data = json.loads(log_data)
                        except json.JSONDecodeError:
                            logger.debug(f"Could not parse log_data for record {record.get('id')}")
                            log_data = {}
                        except Exception as e:
                            logger.warning(f"Decryption error for record {record.get('id')}: {e}")
                            log_data = {}
                    
                    # Extract values with better error handling
                    if isinstance(log_data, dict):
                        date = log_data.get('date', 'N/A')
                        bpm = log_data.get('bpm', 'N/A')
                        weight = log_data.get('weight', 'N/A')
                        fatigue = log_data.get('fatigue', 'N/A')
                        stiffness = log_data.get('stiffness', 'N/A')
                        sleep = log_data.get('sleep', 'N/A')
                        mood = log_data.get('mood', 'N/A')
                        steps = log_data.get('steps', 'N/A')
                        flare = log_data.get('flare', 'N/A')
                    else:
                        logger.warning(f"anonymized_logs is not a dict for record {record.get('id')}: {type(log_data)}")
                        date = 'N/A'
                        bpm = 'N/A'
                        weight = 'N/A'
                        fatigue = 'N/A'
                        stiffness = 'N/A'
                        sleep = 'N/A'
                        mood = 'N/A'
                        steps = 'N/A'
                        flare = 'N/A'
                    
                    viewer_tree.insert('', 'end', values=(
                        record.get('id', 'N/A'),
                        record.get('medical_condition', 'N/A'),
                        date,
                        bpm,
                        weight,
                        fatigue,
                        stiffness,
                        sleep,
                        mood,
                        steps,
                        flare
                    ))
                except Exception as e:
                    logger.error(f"Error processing record {record.get('id', 'unknown')}: {e}")
                    viewer_tree.insert('', 'end', values=(
                        record.get('id', 'N/A'),
                        record.get('medical_condition', 'N/A'),
                        'Error',
                        'N/A',
                        'N/A',
                        'N/A',
                        'N/A',
                        'N/A',
                        'N/A',
                        'N/A',
                        'N/A'
                    ))
            
            logger.info(f"Database viewer: Displayed {min(len(data_to_show), 100)} records successfully")
        except Exception as e:
            logger.error(f"Error refreshing database viewer: {e}", exc_info=True)
    
    # Viewer control buttons frame
    viewer_controls_frame = ttk.Frame(db_viewer_frame)
    viewer_controls_frame.pack(fill=tk.X, pady=5)
    
    refresh_viewer_btn = ttk.Button(viewer_controls_frame, text="Refresh View", command=refresh_db_viewer)
    refresh_viewer_btn.pack(side=tk.LEFT, padx=5)
    
    
    # Label showing selection count
    selection_count_label = ttk.Label(viewer_controls_frame, text="0 selected", style='Status.TLabel')
    selection_count_label.pack(side=tk.LEFT, padx=10)
    
    def update_selection_count(event=None):
        """Update the selection count label"""
        selected_count = len(viewer_tree.selection())
        selection_count_label.config(text=f"{selected_count} selected")
    
    # Bind selection events to update count
    viewer_tree.bind('<<TreeviewSelect>>', update_selection_count)
    viewer_tree.bind('<<TreeviewDeselect>>', update_selection_count)
    
    
    # Logs display
    logs_frame = ttk.LabelFrame(main_frame, text="Server Logs", padding="10")
    logs_frame.pack(fill=tk.BOTH, expand=True, pady=5)
    
    logs_text = scrolledtext.ScrolledText(
        logs_frame, 
        height=15, 
        bg='#2d2d2d', 
        fg='#e0f2f1',
        font=('Consolas', 9),
        wrap=tk.WORD
    )
    logs_text.pack(fill=tk.BOTH, expand=True)
    
    # Configure color tags for different parts of log messages (partial highlighting)
    logs_text.tag_config('TIMESTAMP', foreground='#808080', font=('Consolas', 9))  # Gray for timestamps
    logs_text.tag_config('DEBUG', foreground='#808080', font=('Consolas', 9))  # Gray
    logs_text.tag_config('INFO', foreground='#4caf50', font=('Consolas', 9))  # Green for INFO level
    logs_text.tag_config('WARNING', foreground='#ff9800', font=('Consolas', 9))  # Orange
    logs_text.tag_config('WARN', foreground='#ff9800', font=('Consolas', 9))  # Orange (alias)
    logs_text.tag_config('ERROR', foreground='#f44336', font=('Consolas', 9, 'bold'))  # Red, bold
    logs_text.tag_config('CRITICAL', foreground='#e91e63', font=('Consolas', 9, 'bold'))  # Pink, bold
    logs_text.tag_config('SYNC', foreground='#2196f3', font=('Consolas', 9))  # Blue for sync keywords
    logs_text.tag_config('REQUEST', foreground='#9c27b0', font=('Consolas', 9))  # Purple for HTTP methods
    logs_text.tag_config('PATH', foreground='#00bcd4', font=('Consolas', 9))  # Cyan for paths
    logs_text.tag_config('DEFAULT', foreground='#e0f2f1', font=('Consolas', 9))  # Default color
    
    # Custom log handler to update text widget with color coding
    class TextHandler(logging.Handler):
        def __init__(self, text_widget, root_window):
            super().__init__()
            self.text_widget = text_widget
            self.root = root_window
        
        def emit(self, record):
            msg = self.format(record)
            # Schedule update on main thread to avoid threading issues
            try:
                if self.root and self.root.winfo_exists():
                    self.root.after(0, self._update_widget, msg, record.levelname)
            except:
                # If root doesn't exist or is destroyed, skip widget update
                pass
        
        def _update_widget(self, msg, levelname):
            """Update widget on main thread with partial color coding"""
            try:
                if self.text_widget.winfo_exists():
                    # Insert message with default color first
                    start_pos = self.text_widget.index(tk.END)
                    self.text_widget.insert(tk.END, msg + '\n', 'DEFAULT')
                    
                    # Apply partial highlighting to specific parts
                    self._apply_partial_highlighting(start_pos, msg, levelname)
                    
                    self.text_widget.see(tk.END)
                    
                    # Limit log size to prevent memory issues (keep last 1000 lines)
                    line_count = int(self.text_widget.index('end-1c').split('.')[0])
                    if line_count > 1000:
                        self.text_widget.delete('1.0', f'{line_count - 1000}.0')
            except:
                # Widget may have been destroyed
                pass
        
        def _apply_partial_highlighting(self, start_pos, msg, levelname):
            """Apply color tags to specific parts of the log message"""
            import re
            
            # Parse the log format: "YYYY-MM-DD HH:MM:SS | LEVEL | Name | Message"
            # Example: "2026-01-03 03:10:02 | INFO | HealthApp | SYNC | Anonymized data synced..."
            
            # Find timestamp (format: YYYY-MM-DD HH:MM:SS)
            timestamp_pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'
            timestamp_match = re.search(timestamp_pattern, msg)
            if timestamp_match:
                ts_start = start_pos + f"+{timestamp_match.start()}c"
                ts_end = start_pos + f"+{timestamp_match.end()}c"
                self.text_widget.tag_add('TIMESTAMP', ts_start, ts_end)
            
            # Find log level (format: | LEVEL |)
            level_pattern = r'\|\s*(\w+)\s*\|'
            level_matches = list(re.finditer(level_pattern, msg))
            if level_matches:
                # Usually the second match is the log level
                for i, match in enumerate(level_matches):
                    level_text = match.group(1).upper()
                    level_start = start_pos + f"+{match.start()}c"
                    level_end = start_pos + f"+{match.end()}c"
                    
                    # Apply color based on level
                    if level_text == 'DEBUG':
                        self.text_widget.tag_add('DEBUG', level_start, level_end)
                    elif level_text == 'INFO':
                        self.text_widget.tag_add('INFO', level_start, level_end)
                    elif level_text in ('WARNING', 'WARN'):
                        self.text_widget.tag_add('WARNING', level_start, level_end)
                    elif level_text == 'ERROR':
                        self.text_widget.tag_add('ERROR', level_start, level_end)
                    elif level_text == 'CRITICAL':
                        self.text_widget.tag_add('CRITICAL', level_start, level_end)
            
            # Highlight SYNC keywords
            sync_pattern = r'\b(SYNC|synced|sync)\b'
            for match in re.finditer(sync_pattern, msg, re.IGNORECASE):
                sync_start = start_pos + f"+{match.start()}c"
                sync_end = start_pos + f"+{match.end()}c"
                self.text_widget.tag_add('SYNC', sync_start, sync_end)
            
            # Highlight HTTP methods (GET, POST, PUT, DELETE, etc.)
            http_pattern = r'\b(GET|POST|PUT|DELETE|PATCH|OPTIONS)\b'
            for match in re.finditer(http_pattern, msg, re.IGNORECASE):
                http_start = start_pos + f"+{match.start()}c"
                http_end = start_pos + f"+{match.end()}c"
                self.text_widget.tag_add('REQUEST', http_start, http_end)
            
            # Highlight paths (e.g., /api/sync-log, /index.html)
            path_pattern = r'(/[a-zA-Z0-9_\-./]+)'
            for match in re.finditer(path_pattern, msg):
                path_text = match.group(1)
                # Only highlight actual file paths, not parts of other text
                if '/' in path_text and (path_text.startswith('/api/') or path_text.endswith('.html') or path_text.endswith('.js') or path_text.endswith('.css')):
                    path_start = start_pos + f"+{match.start()}c"
                    path_end = start_pos + f"+{match.end()}c"
                    self.text_widget.tag_add('PATH', path_start, path_end)
        
        def _get_tag_for_message(self, msg, levelname):
            """Determine the appropriate color tag based on message content and level"""
            msg_upper = msg.upper()
            
            # Check for specific message types first
            if 'SYNC' in msg_upper or 'synced' in msg_upper.lower():
                return 'SYNC'
            elif 'REQUEST' in msg_upper or 'GET' in msg_upper or 'POST' in msg_upper:
                return 'REQUEST'
            
            # Then check log level
            levelname_upper = levelname.upper()
            if levelname_upper == 'DEBUG':
                return 'DEBUG'
            elif levelname_upper == 'INFO':
                return 'INFO'
            elif levelname_upper in ('WARNING', 'WARN'):
                return 'WARNING'
            elif levelname_upper == 'ERROR':
                return 'ERROR'
            elif levelname_upper == 'CRITICAL':
                return 'CRITICAL'
            else:
                return 'DEFAULT'
    
    text_handler = TextHandler(logs_text, root)
    text_handler.setFormatter(formatter)
    text_handler.setLevel(logging.INFO)
    logger.addHandler(text_handler)
    
    # Initial viewer refresh
    refresh_db_viewer()
    
    # Handle window close - terminate server
    def on_closing():
        """Handle window close event - shutdown server and exit"""
        logger.info("Dashboard window closed - shutting down server...")
        try:
            # Shutdown the server
            with server_lock:
                if server_instance:
                    logger.info("Shutting down HTTP server...")
                    server_instance.shutdown()
                    server_instance.server_close()
                    logger.info("HTTP server shut down")
            
            # Close the window
            root.destroy()
            
            # Exit the process
            logger.info("Server terminated by user")
            os._exit(0)  # Force exit all threads
        
        except Exception as e:
            logger.error(f"Error during shutdown: {e}", exc_info=True)
            root.destroy()
            os._exit(0)
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    
    return root


def main():
    """Start the web server"""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Check if local lib directory exists and has packages, if not, install them
    global SUPABASE_AVAILABLE
    if not SUPABASE_AVAILABLE and not (LOCAL_LIB_DIR.exists() and any(LOCAL_LIB_DIR.iterdir())):
        logger.info("Required packages not found. Installing to local lib directory...")
        print("Installing required packages to local lib directory (first time only)...")
        try:
            if install_requirements_local():
                logger.info("Packages installed to local lib directory. Restarting imports...")
                # Re-import after installation
                # Re-check availability using the function
                SUPABASE_AVAILABLE = check_supabase_availability()
                if SUPABASE_AVAILABLE:
                    logger.info("Supabase now available after local installation")
                else:
                    logger.warning("Supabase still not available after installation")
        except Exception as e:
            logger.error(f"Error during automatic package installation: {e}", exc_info=True)
            print(f"Warning: Could not auto-install packages. Use 'Install Requirements' button in dashboard.")
    
    # Use localhost explicitly for browser opening
    server_url = f"http://localhost:{PORT}"
    
    # Initialize Supabase client
    init_supabase_client()
    
    logger.info("Starting Health App Server")
    logger.info(f"Server directory: {script_dir}")
    logger.info(f"Port: {PORT}")
    logger.info(f"Max connections per IP: {MAX_CONNECTIONS_PER_IP}")
    logger.info(f"Connection timeout: {CONNECTION_TIMEOUT}s")
    logger.info(f"Supabase: {'CONNECTED' if supabase_client else 'NOT AVAILABLE (install: pip install supabase)'}")
    
    # Start cleanup thread for inactive connections
    cleanup_thread = threading.Thread(target=cleanup_inactive_connections, daemon=True)
    cleanup_thread.start()
    logger.info("Connection cleanup thread started")
    
    # Start file watcher if watchdog is available
    file_observer = None
    if WATCHDOG_AVAILABLE:
        try:
            event_handler = FileChangeHandler()
            file_observer = Observer()
            file_observer.schedule(event_handler, str(script_dir), recursive=True)
            file_observer.start()
            logger.info(f"File watcher started for: {script_dir}")
            print(f"File watcher active - changes will trigger auto-reload on all connected devices")
        except Exception as e:
            logger.error(f"Failed to start file watcher: {e}", exc_info=True)
            print(f"Warning: File watcher failed to start: {e}")
    else:
        logger.warning("File watcher not available (watchdog not installed)")
        print("Note: Install 'watchdog' package for auto-reload on file changes:")
        print("  pip install watchdog")
    
    # Start server in background thread with error handling
    try:
        start_server_thread()
    except OSError as e:
        error_msg = f"Error: Port {PORT} is already in use."
        logger.error(f"{error_msg} | Exception: {e}")
        if "Address already in use" in str(e) or "Only one usage" in str(e):
            print(f"Error: Port {PORT} is already in use.")
            print(f"Please close the application using port {PORT} or change the PORT in server.py")
            sys.exit(1)
        else:
            print(f"Error starting server: {e}")
            sys.exit(1)
    except Exception as e:
        error_msg = f"Unexpected error starting server: {e}"
        logger.error(error_msg, exc_info=True)
        print(error_msg)
        sys.exit(1)
    
    # Create and start dashboard in separate thread
    dashboard = None
    if TKINTER_AVAILABLE:
        def run_dashboard():
            global dashboard
            dashboard = create_server_dashboard()
            if dashboard:
                dashboard.mainloop()
        
        dashboard_thread = threading.Thread(target=run_dashboard, daemon=False)
        dashboard_thread.start()
        # Give the dashboard time to initialize
        time.sleep(0.5)
        logger.info("Server dashboard started")
    
    # Server options are set in ThreadingHTTPServer class
    logger.info("Server configured for concurrent connections")
    
    # Get local IP addresses for LAN access
    def get_local_ip():
        """Get the local IP address of this machine"""
        try:
            # Connect to a remote address to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            logger.info(f"Local IP determined: {ip}")
            return ip
        except Exception as e:
            logger.warning(f"Could not determine local IP: {e}")
            return "Unable to determine"
    
    local_ip = get_local_ip()
    lan_url = f"http://{local_ip}:{PORT}"
    
    print("=" * 60)
    print("Health App Web Server")
    print("=" * 60)
    print(f"Server running at: {server_url}")
    if local_ip != "Unable to determine":
        print(f"LAN access: {lan_url}")
        print(f"  (Use this URL from other devices on your network)")
    print(f"Serving directory: {script_dir}")
    print(f"Log file: {LOG_FILE}")
    print(f"Supabase: {'CONNECTED' if supabase_client else 'NOT AVAILABLE (install: pip install supabase)'}")
    print("=" * 60)
    if TKINTER_AVAILABLE:
        print("Server Dashboard window opened - use it to control the server")
    print("\nPress Ctrl+C to stop the server\n")
    
    logger.info("=" * 60)
    logger.info("Server ready to accept connections")
    logger.info(f"Server URL: {server_url}")
    if local_ip != "Unable to determine":
        logger.info(f"LAN URL: {lan_url}")
    logger.info("=" * 60)
    
    # Try to open browser automatically
    # Use new=0 to open in existing tab if available, otherwise new tab
    try:
        # Open in existing tab if URL is already open, otherwise new tab
        webbrowser.open(server_url, new=0)
        logger.info(f"Browser opened at {server_url}")
        print(f"Opening browser at {server_url}...")
    except Exception as e:
        logger.warning(f"Could not open browser automatically: {e}")
        print(f"Could not open browser automatically: {e}")
        print(f"Please open {server_url} manually in your browser")
    
    # Wait for server thread (or keep main thread alive)
    try:
        # Keep main thread alive - server runs in background thread
        while True:
            time.sleep(1)
            # Check if server thread is still alive
            if server_thread and not server_thread.is_alive():
                logger.warning("Server thread died, attempting restart...")
                time.sleep(2)
                start_server_thread()
    except KeyboardInterrupt:
        logger.info("Server shutdown initiated by user (Ctrl+C)")
        print("\n\nServer stopped by user")
        print("Goodbye!")
        
        # Stop file watcher if running
        if file_observer and file_observer.is_alive():
            file_observer.stop()
            file_observer.join()
            logger.info("File watcher stopped")
        
        # Close all SSE connections
        with sse_lock:
            for client_ip, wfile in sse_clients:
                try:
                    wfile.close()
                except:
                    pass
            sse_clients.clear()
        
        # Shutdown server
        if server_instance:
            server_instance.shutdown()
        logger.info("Server shutdown complete")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
        print(f"\n\nUnexpected error: {e}")
        if server_instance:
            server_instance.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    main()