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

# Try to import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
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

# Setup logging first (needed for environment variable loading messages)
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
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://tcoynycktablxankyriw.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'sb_publishable_nXggVFr8IphXxgOWQFlz4A_Ot79HO4e')
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

def init_supabase_client():
    """Initialize Supabase client"""
    global supabase_client
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase library not available")
        return None
    
    try:
        if supabase_client is None:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            logger.info("Supabase client initialized")
        return supabase_client
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {e}", exc_info=True)
        return None

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
        return response.data
    except Exception as e:
        logger.error(f"Error searching Supabase: {e}", exc_info=True)
        return None

def delete_supabase_data(ids=None, condition=None):
    """Delete data from Supabase"""
    client = init_supabase_client()
    if not client:
        return False
    
    try:
        if ids:
            # Delete specific IDs
            for record_id in ids:
                client.table('anonymized_data').delete().eq('id', record_id).execute()
            logger.info(f"Deleted {len(ids)} record(s) from Supabase")
            return True
        elif condition:
            # Delete by condition
            response = client.table('anonymized_data').delete().eq('medical_condition', condition).execute()
            logger.info(f"Deleted records for condition: {condition}")
            return True
        else:
            logger.warning("No IDs or condition provided for deletion")
            return False
    except Exception as e:
        logger.error(f"Error deleting from Supabase: {e}", exc_info=True)
        return False

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
                first_log = data[0].get('anonymized_log', {})
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
                
                # Add anonymized_log fields
                log_data = record.get('anonymized_log', {})
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
    Generate randomized health data and save to CSV file.
    Returns the path to the generated CSV file.
    """
    if output_path is None:
        script_dir = Path(__file__).parent.absolute()
        output_path = script_dir / 'health_data_sample.csv'
    
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
            
            # Flare pattern
            flare_chance = 0.12 + (seasonal_factor * 0.1)
            if flare_duration > 0:
                flare_duration -= 1
                if flare_duration == 0:
                    flare_state = False
                    recovery_phase = 1
            elif random.random() < flare_chance:
                flare_state = True
                flare_duration = random.randint(2, 5)
            else:
                recovery_phase += 1
            
            recovery_boost = min(0.3, recovery_phase * 0.05) if recovery_phase > 0 and recovery_phase < 7 else 0
            
            # Generate metrics
            if flare_state:
                fatigue = max(1, min(10, round(baseline_health - 3 + (random.random() * 3))))
                stiffness = max(1, min(10, round(baseline_health - 2.5 + (random.random() * 3))))
                back_pain = max(1, min(10, round(baseline_health - 2 + (random.random() * 3))))
                joint_pain = max(1, min(10, round(baseline_health - 2.5 + (random.random() * 2.5))))
                sleep = max(1, min(10, round(baseline_health - 4 + (random.random() * 2))))
                mobility = max(1, min(10, round(baseline_health - 4 + (random.random() * 2))))
                daily_function = max(1, min(10, round(baseline_health - 3.5 + (random.random() * 2.5))))
                swelling = max(1, min(10, round(baseline_health - 3 + (random.random() * 2.5))))
                mood = max(1, min(10, round(baseline_health - 3.5 + (random.random() * 2))))
                irritability = max(1, min(10, round(baseline_health - 2 + (random.random() * 3))))
                bpm = int(70 + (random.random() * 15))
            else:
                sleep = max(1, min(10, round(baseline_health + (random.random() * 2) + seasonal_factor + weekly_pattern + recovery_boost)))
                fatigue = max(1, min(10, round(baseline_health - (sleep - 5) * 0.8 + (random.random() * 1.5))))
                stiffness = max(1, min(10, round(baseline_health - 2 - (seasonal_factor * 2) + (random.random() * 1.5) + recovery_boost)))
                back_pain = max(1, min(10, round(stiffness + (random.random() * 1) - 0.5)))
                joint_pain = max(1, min(10, round(stiffness * 0.7 + (random.random() * 1.2))))
                mobility = max(1, min(10, round(baseline_health + 1 - (stiffness - 5) * 0.5 - (fatigue - 5) * 0.3 + (random.random() * 1) + recovery_boost)))
                daily_function = max(1, min(10, round(mobility * 0.9 + (random.random() * 1))))
                swelling = max(1, min(10, round(joint_pain * 0.6 + (random.random() * 1))))
                mood = max(1, min(10, round(baseline_health + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (random.random() * 1) + weekly_pattern + recovery_boost)))
                irritability = max(1, min(10, round(baseline_health - 2 - (mood - 5) * 0.5 - (sleep - 5) * 0.3 + (random.random() * 1.5))))
                bpm = int(65 + (fatigue - 5) * 2 + (random.random() * 8) + (seasonal_factor * 3))
            
            # Weight
            has_exercise = random.random() < 0.4
            current_weight += -0.02 if has_exercise else 0.01
            current_weight = max(70, min(80, current_weight))
            weight = round(current_weight, 1)
            
            # Food and exercise
            food_items = []
            exercise_items = []
            
            exercise_chance = 0.15 if flare_state else (0.6 if mood > 6 else 0.3)
            if random.random() < exercise_chance:
                num_exercise = 1 if flare_state else random.randint(1, 2)
                exercise_items = random.sample(exercise_templates, min(num_exercise, len(exercise_templates)))
            
            if random.random() < 0.65:
                num_food = random.randint(1, 3)
                food_pool = healthy_foods if (mood > 6 and not flare_state) else (healthy_foods + comfort_foods if flare_state else healthy_foods)
                for _ in range(num_food):
                    template = random.choice(food_pool)
                    food_items.append({
                        'name': template['name'],
                        'calories': round(template['calories'] * (1 + (random.random() - 0.5) * 0.15)),
                        'protein': round(template['protein'] * (1 + (random.random() - 0.5) * 0.15), 1)
                    })
            
            # Additional fields
            weather_sensitivity = max(1, min(10, round(5 + (stiffness - 5) * 0.5 - seasonal_factor * 2)))
            steps = max(1000, min(15000, round(6000 + (mobility - 5) * 800 + (mood - 5) * 500 - (fatigue - 5) * 400 + (random.random() * 2000 - 1000))))
            hydration = round(6 + (1 if exercise_items else 0) + (random.random() * 2 - 1), 1)
            
            # Energy/Clarity
            energy_clarity_options = ["High Energy", "Moderate Energy", "Low Energy", "Mental Clarity", "Brain Fog", "Good Concentration", "Poor Concentration", "Mental Fatigue", "Focused", "Distracted"]
            energy_clarity = ""
            if sleep >= 7 and mood >= 7:
                energy_clarity = random.choice(["High Energy", "Mental Clarity", "Good Concentration"]) if random.random() < 0.7 else random.choice(energy_clarity_options)
            elif sleep < 5 or mood < 5:
                energy_clarity = random.choice(["Low Energy", "Brain Fog", "Mental Fatigue"]) if random.random() < 0.6 else random.choice(energy_clarity_options)
            else:
                energy_clarity = random.choice(energy_clarity_options) if random.random() < 0.4 else ""
            
            # Notes
            notes = ""
            if random.random() < 0.12:
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
        
        
        # For other POST requests, return 405 Method Not Allowed
        self.send_response(405)
        self.end_headers()
    
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
                    # Wait for file change event (with timeout to send keepalive)
                    if file_change_event.wait(timeout=30):
                        # File changed - send reload message
                        message = json.dumps({"type": "reload", "timestamp": time.time()})
                        self.wfile.write(f'data: {message}\n\n'.encode('utf-8'))
                        self.wfile.flush()
                        file_change_event.clear()
                        logger.info(f"Sent reload signal to SSE client: {client_ip}")
                    else:
                        # Timeout - send keepalive ping
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
    """Notify all SSE clients to reload"""
    global last_file_change_time
    last_file_change_time = time.time()
    file_change_event.set()
    
    # Clean up dead connections first, then notify
    with sse_lock:
        alive_clients = []
        for client_ip, wfile in sse_clients:
            try:
                # Try to write a keepalive to check if connection is alive
                wfile.write(b': keepalive\n\n')
                wfile.flush()
                alive_clients.append((client_ip, wfile))
            except (BrokenPipeError, ConnectionResetError, OSError):
                logger.debug(f"Removed dead SSE connection: {client_ip}")
        sse_clients[:] = alive_clients
        logger.info(f"Notifying {len(sse_clients)} SSE client(s) to reload")

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
    style.configure('Title.TLabel', font=('Arial', 16, 'bold'), background='#1e1e1e', foreground='#4caf50')
    style.configure('Status.TLabel', font=('Arial', 10), background='#1e1e1e', foreground='#e0f2f1')
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
    
    def restart_server():
        """Restart the server without terminating the process"""
        try:
            logger.info("Server restart requested from dashboard")
            
            # Save window position
            window_geometry = root.geometry()
            window_x = root.winfo_x()
            window_y = root.winfo_y()
            
            # Update status
            server_status.config(text="Server: Restarting...")
            root.update()
            
            # Restart server in background thread
            def restart_thread():
                global server_instance
                try:
                    # Shutdown existing server
                    if server_instance is not None:
                        logger.info("Shutting down server...")
                        server_instance.shutdown()
                        time.sleep(0.5)  # Brief pause for cleanup
                    
                    
                    # Start new server
                    logger.info("Starting new server instance...")
                    start_server_thread()
                    
                    # Wait a moment for server to be ready
                    time.sleep(0.5)
                    
                    # Open browser tab with served page
                    server_url = f"http://localhost:{PORT}"
                    try:
                        webbrowser.open(server_url, new=0)
                        logger.info(f"Browser opened at {server_url} after restart")
                    except Exception as e:
                        logger.warning(f"Could not open browser automatically after restart: {e}")
                    
                    # Update status and restore window position on main thread
                    root.after(0, lambda: server_status.config(text=f"Server: http://localhost:{PORT}"))
                    root.after(0, lambda: root.geometry(window_geometry))
                    root.after(0, lambda: root.update_idletasks())
                    logger.info("Server restarted successfully")
                except Exception as e:
                    logger.error(f"Error restarting server: {e}", exc_info=True)
                    root.after(0, lambda: messagebox.showerror("Error", f"Failed to restart server: {e}"))
                    root.after(0, lambda: server_status.config(text=f"Server: http://localhost:{PORT} (Error)"))
            
            threading.Thread(target=restart_thread, daemon=True).start()
            
        except Exception as e:
            logger.error(f"Error in restart function: {e}", exc_info=True)
            messagebox.showerror("Error", f"Failed to restart server: {e}")
            server_status.config(text=f"Server: http://localhost:{PORT}")
    
    restart_btn = ttk.Button(status_frame, text="Restart Server", command=restart_server)
    restart_btn.pack(side=tk.LEFT, padx=5, pady=5)
    
    # Supabase Database Controls
    supabase_frame = ttk.LabelFrame(main_frame, text="Supabase Database", padding="10")
    supabase_frame.pack(fill=tk.X, pady=5)
    
    # Connection status
    connection_status = ttk.Label(supabase_frame, text="Status: Not Connected", style='Status.TLabel')
    connection_status.pack(anchor=tk.W, pady=(0, 5))
    
    def check_connection():
        """Check Supabase connection"""
        client = init_supabase_client()
        if client:
            connection_status.config(text="Status: Connected", foreground='#4caf50')
            return True
        else:
            connection_status.config(text="Status: Not Connected (Install: pip install supabase)", foreground='#ff9800')
            return False
    
    check_connection()
    
    # Search frame
    search_frame = ttk.Frame(supabase_frame)
    search_frame.pack(fill=tk.X, pady=5)
    
    ttk.Label(search_frame, text="Search by Condition:", style='Status.TLabel').pack(side=tk.LEFT, padx=5)
    search_var = tk.StringVar()
    search_entry = ttk.Entry(search_frame, textvariable=search_var, width=20)
    search_entry.pack(side=tk.LEFT, padx=5)
    
    search_results = []
    
    def perform_search():
        """Search Supabase data"""
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
            
            messagebox.showinfo("Search Complete", f"Found {len(results)} record(s)")
        except Exception as e:
            logger.error(f"Error searching Supabase: {e}", exc_info=True)
            messagebox.showerror("Error", f"Search failed: {e}")
    
    search_btn = ttk.Button(search_frame, text="Search", command=perform_search)
    search_btn.pack(side=tk.LEFT, padx=5)
    
    # Delete frame
    delete_frame = ttk.Frame(supabase_frame)
    delete_frame.pack(fill=tk.X, pady=5)
    
    def delete_data():
        """Delete data from Supabase"""
        if not SUPABASE_AVAILABLE:
            messagebox.showerror("Error", "Supabase library not installed.\nInstall with: pip install supabase")
            return
        
        # Ask what to delete
        dialog = tk.Toplevel(root)
        dialog.title("Delete Data")
        dialog.geometry("400x200")
        dialog.configure(bg='#1e1e1e')
        dialog.transient(root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Delete by:", background='#1e1e1e', foreground='#e0f2f1').pack(pady=5)
        
        delete_option = tk.StringVar(value="condition")
        ttk.Radiobutton(dialog, text="All data", variable=delete_option, value="all", 
                       background='#1e1e1e', foreground='#e0f2f1').pack(anchor=tk.W, padx=20)
        ttk.Radiobutton(dialog, text="By condition", variable=delete_option, value="condition",
                       background='#1e1e1e', foreground='#e0f2f1').pack(anchor=tk.W, padx=20)
        ttk.Radiobutton(dialog, text="Selected IDs", variable=delete_option, value="ids",
                       background='#1e1e1e', foreground='#e0f2f1').pack(anchor=tk.W, padx=20)
        
        condition_var = tk.StringVar()
        ttk.Label(dialog, text="Condition name (if applicable):", background='#1e1e1e', foreground='#e0f2f1').pack(pady=5)
        ttk.Entry(dialog, textvariable=condition_var, width=30).pack(pady=5)
        
        ids_var = tk.StringVar()
        ttk.Label(dialog, text="IDs (comma-separated):", background='#1e1e1e', foreground='#e0f2f1').pack(pady=5)
        ttk.Entry(dialog, textvariable=ids_var, width=30).pack(pady=5)
        
        def do_delete():
            option = delete_option.get()
            try:
                if option == "all":
                    if messagebox.askyesno("Confirm", "Delete ALL data from Supabase? This cannot be undone!"):
                        # Get all records first
                        all_data = search_supabase_data(limit=10000)
                        if all_data:
                            ids = [r['id'] for r in all_data]
                            if delete_supabase_data(ids=ids):
                                dialog.destroy()
                                messagebox.showinfo("Success", f"Deleted {len(ids)} record(s)")
                                perform_search()  # Refresh
                            else:
                                messagebox.showerror("Error", "Failed to delete data")
                        else:
                            messagebox.showinfo("Info", "No data to delete")
                elif option == "condition":
                    condition = condition_var.get().strip()
                    if not condition:
                        messagebox.showerror("Error", "Please enter a condition name")
                        return
                    if messagebox.askyesno("Confirm", f"Delete all data for condition '{condition}'?"):
                        if delete_supabase_data(condition=condition):
                            dialog.destroy()
                            messagebox.showinfo("Success", f"Deleted data for condition: {condition}")
                            perform_search()  # Refresh
                        else:
                            messagebox.showerror("Error", "Failed to delete data")
                elif option == "ids":
                    ids_str = ids_var.get().strip()
                    if not ids_str:
                        messagebox.showerror("Error", "Please enter IDs")
                        return
                    try:
                        ids = [int(id.strip()) for id in ids_str.split(',')]
                        if messagebox.askyesno("Confirm", f"Delete {len(ids)} record(s)?"):
                            if delete_supabase_data(ids=ids):
                                dialog.destroy()
                                messagebox.showinfo("Success", f"Deleted {len(ids)} record(s)")
                                perform_search()  # Refresh
                            else:
                                messagebox.showerror("Error", "Failed to delete data")
                    except ValueError:
                        messagebox.showerror("Error", "Invalid ID format. Use comma-separated numbers.")
            except Exception as e:
                logger.error(f"Error deleting data: {e}", exc_info=True)
                messagebox.showerror("Error", f"Delete failed: {e}")
        
        ttk.Button(dialog, text="Delete", command=do_delete).pack(pady=10)
        ttk.Button(dialog, text="Cancel", command=dialog.destroy).pack()
    
    delete_btn = ttk.Button(delete_frame, text="Delete Data", command=delete_data)
    delete_btn.pack(side=tk.LEFT, padx=5)
    
    # Export frame
    def export_data():
        """Export Supabase data to CSV"""
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
            
            dialog.destroy()
            threading.Thread(target=export_thread, daemon=True).start()
        
        ttk.Button(dialog, text="Export CSV", command=do_export).pack(pady=10)
        ttk.Button(dialog, text="Cancel", command=dialog.destroy).pack()
    
    export_btn = ttk.Button(delete_frame, text="Export to CSV", command=export_data)
    export_btn.pack(side=tk.LEFT, padx=5)
    
    
    # Database Viewer
    db_viewer_frame = ttk.LabelFrame(main_frame, text="Database Viewer", padding="10")
    db_viewer_frame.pack(fill=tk.BOTH, expand=True, pady=5)
    
    # Treeview for database records
    viewer_tree = ttk.Treeview(db_viewer_frame, columns=('id', 'condition', 'date', 'bpm', 'weight'), show='headings', height=8)
    viewer_tree.heading('id', text='ID')
    viewer_tree.heading('condition', text='Condition')
    viewer_tree.heading('date', text='Date')
    viewer_tree.heading('bpm', text='BPM')
    viewer_tree.heading('weight', text='Weight')
    viewer_tree.column('id', width=50)
    viewer_tree.column('condition', width=200)
    viewer_tree.column('date', width=100)
    viewer_tree.column('bpm', width=60)
    viewer_tree.column('weight', width=70)
    
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
            
            if not SUPABASE_AVAILABLE:
                return
            
            # Use search results if available, otherwise fetch all
            data_to_show = search_results if search_results else search_supabase_data(limit=100)
            
            if not data_to_show:
                return
            
            for record in data_to_show[:100]:  # Limit to 100 for display
                try:
                    log_data = record.get('anonymized_log', {})
                    if isinstance(log_data, str):
                        log_data = json.loads(log_data)
                    
                    date = log_data.get('date', 'N/A') if isinstance(log_data, dict) else 'N/A'
                    bpm = log_data.get('bpm', 'N/A') if isinstance(log_data, dict) else 'N/A'
                    weight = log_data.get('weight', 'N/A') if isinstance(log_data, dict) else 'N/A'
                    
                    viewer_tree.insert('', 'end', values=(
                        record.get('id', 'N/A'),
                        record.get('medical_condition', 'N/A'),
                        date,
                        bpm,
                        weight
                    ))
                except Exception as e:
                    viewer_tree.insert('', 'end', values=(
                        record.get('id', 'N/A'),
                        record.get('medical_condition', 'N/A'),
                        'Error',
                        'N/A',
                        'N/A'
                    ))
        except Exception as e:
            logger.error(f"Error refreshing database viewer: {e}")
    
    refresh_viewer_btn = ttk.Button(db_viewer_frame, text="Refresh View", command=refresh_db_viewer)
    refresh_viewer_btn.pack(pady=5)
    
    
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
    
    # Custom log handler to update text widget
    class TextHandler(logging.Handler):
        def __init__(self, text_widget):
            super().__init__()
            self.text_widget = text_widget
        
        def emit(self, record):
            msg = self.format(record)
            self.text_widget.insert(tk.END, msg + '\n')
            self.text_widget.see(tk.END)
    
    text_handler = TextHandler(logs_text)
    text_handler.setFormatter(formatter)
    text_handler.setLevel(logging.INFO)
    logger.addHandler(text_handler)
    
    # Initial viewer refresh
    refresh_db_viewer()
    
    return root


def main():
    """Start the web server"""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
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
        
        dashboard_thread = threading.Thread(target=run_dashboard, daemon=True)
        dashboard_thread.start()
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