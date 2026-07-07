#!/usr/bin/env python3
"""
Simple HTTP Server for Rianell
Serves the Rianell web app on http://localhost:8080
Also accessible over LAN using your computer's local IP address
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import socket
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
import logging
import gzip
import shutil

# Server package (config, encryption, requirements, sample_data, supabase)
from . import config
from . import encryption
from . import http_security
from . import requirements_check
from . import sample_data
from . import supabase_client
from . import chromium_dev

# Aliases for rest of this file
logger = config.logger
PORT = config.PORT
HOST = config.HOST
active_connections = config.active_connections
connection_lock = config.connection_lock
last_activity = config.last_activity
CONNECTION_TIMEOUT = config.CONNECTION_TIMEOUT
CLEANUP_INTERVAL = config.CLEANUP_INTERVAL
MAX_CONNECTIONS_PER_IP = config.MAX_CONNECTIONS_PER_IP
sse_clients = config.sse_clients
sse_lock = config.sse_lock
file_change_event = config.file_change_event
last_file_change_time = config.last_file_change_time
server_instance = config.server_instance
server_thread = config.server_thread
server_lock = config.server_lock
LOG_FILE = config.LOG_FILE

# Watchdog file observer (started in main(); controlled from Tk dashboard)
file_observer = None  # type: ignore[var-annotated]
watchdog_watch_path = None  # str | None — directory watched for live reload

get_encryption_key = encryption.get_encryption_key
encrypt_anonymized_data = encryption.encrypt_anonymized_data
decrypt_anonymized_data = encryption.decrypt_anonymized_data

check_requirements = requirements_check.check_requirements
install_requirements = requirements_check.install_requirements
install_requirements_local = requirements_check.install_requirements_local
LOCAL_LIB_DIR = config.LOCAL_LIB_DIR

generate_sample_csv_data = sample_data.generate_sample_csv_data

supabase_client.check_supabase_availability()
supabase_client.warn_if_supabase_url_unreachable()
SUPABASE_AVAILABLE = supabase_client.SUPABASE_AVAILABLE
init_supabase_client = supabase_client.init_supabase_client
run_sql = supabase_client.run_sql
try_restart_anonymized_data_id_sequence = supabase_client.try_restart_anonymized_data_id_sequence
search_supabase_data = supabase_client.search_supabase_data
export_supabase_data = supabase_client.export_supabase_data
generate_and_post_sample_data_to_supabase = supabase_client.generate_and_post_sample_data_to_supabase
get_supabase_service_client = supabase_client.get_supabase_service_client
supabase_client_ref = supabase_client.supabase_client  # module-level client reference
check_supabase_availability = supabase_client.check_supabase_availability
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_SERVICE_KEY = config.SUPABASE_SERVICE_KEY
file_handler = config.file_handler
formatter = config.log_formatter
dashboard_log_formatter = config.dashboard_log_formatter

if not SUPABASE_AVAILABLE:
    print("Warning: supabase library not installed. Supabase features will be disabled.")
    print("Install with: pip install supabase")

try:
    import tkinter as tk
    from tkinter import ttk, scrolledtext, messagebox
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False
    print("Warning: tkinter not available. Dashboard will be disabled.")
    print("On Linux, install with: sudo apt-get install python3-tk")

try:
    from watchdog.observers import Observer  # type: ignore
    from watchdog.events import FileSystemEventHandler  # type: ignore
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("Warning: watchdog library not installed. File watching disabled.")
    print("Install with: pip install watchdog")

logger.info("=" * 60)
logger.info("Health App Server - Logging Initialized")
logger.info(f"Log file: {LOG_FILE}")
logger.info("Note: Client-side logs are only sent when demo mode is enabled")
if config.HOST in ('0.0.0.0', '::', '[::]'):
    logger.warning(
        "HOST is bound to all interfaces - only use on trusted networks; "
        "see docs/SECURITY.md. Default is 127.0.0.1 for loopback-only access."
    )
logger.info("=" * 60)

from .handler import RianellHttpHandler, ThreadingHTTPServer
from . import dashboard_ui

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


def signal_clients_reload():
    """Tell connected browsers/devices to reload (same mechanism as live-reload after file edits)."""
    notify_sse_clients()


def pause_file_observer():
    """Stop the watchdog Observer (pauses auto-reload on file changes)."""
    global file_observer
    if not WATCHDOG_AVAILABLE:
        return False, "Watchdog library not installed (pip install watchdog)."
    if not file_observer:
        return False, "File observer was not started."
    if not file_observer.is_alive():
        return True, "File watch is already paused."
    try:
        file_observer.stop()
        file_observer.join(timeout=10)
        logger.info("File watcher paused from dashboard")
        return True, "File watch paused. Auto-reload on save is off until you start again."
    except Exception as e:
        logger.error(f"pause_file_observer: {e}", exc_info=True)
        return False, str(e)


def resume_file_observer():
    """Start or restart the watchdog Observer (must create a new Observer after stop)."""
    global file_observer
    if not WATCHDOG_AVAILABLE:
        return False, "Watchdog library not installed (pip install watchdog)."
    if not watchdog_watch_path:
        return False, "Watch path not set (internal error)."
    if file_observer and file_observer.is_alive():
        return True, "File watch is already running."
    try:
        event_handler = FileChangeHandler()
        obs = Observer()
        obs.schedule(event_handler, watchdog_watch_path, recursive=True)
        obs.start()
        file_observer = obs
        logger.info("File watcher resumed from dashboard")
        return True, "File watch started. Changes under apps/pwa-webapp/ will trigger reload on devices."
    except Exception as e:
        logger.error(f"resume_file_observer: {e}", exc_info=True)
        return False, str(e)


def watchdog_status_label():
    """Short status string for the dashboard."""
    if not WATCHDOG_AVAILABLE:
        return "File watch: not available (install watchdog)"
    if not file_observer:
        return "File watch: not started"
    if file_observer.is_alive():
        return "File watch: active"
    return "File watch: paused"


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
                server_instance = ThreadingHTTPServer((HOST, PORT), RianellHttpHandler)
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
    """Create Tkinter dashboard for server controls."""
    if not TKINTER_AVAILABLE:
        return None

    def _get_supabase_available():
        return SUPABASE_AVAILABLE

    def _set_supabase_available(val: bool):
        global SUPABASE_AVAILABLE
        SUPABASE_AVAILABLE = val

    callbacks = dashboard_ui.DashboardCallbacks(
        pause_file_observer=pause_file_observer,
        resume_file_observer=resume_file_observer,
        signal_clients_reload=signal_clients_reload,
        watchdog_status_label=watchdog_status_label,
        watchdog_available=WATCHDOG_AVAILABLE,
        server_lock=server_lock,
        get_server_instance=lambda: server_instance,
        get_supabase_available=_get_supabase_available,
        set_supabase_available=_set_supabase_available,
    )
    return dashboard_ui.create_dashboard(
        callbacks,
        log_formatter=dashboard_log_formatter,
        logger=logger,
    )


def main():
    """Start the web server"""
    global SUPABASE_AVAILABLE
    global file_observer
    global watchdog_watch_path

    script_dir = config.WEB_DIR  # web app root for serving and file watch
    os.chdir(script_dir)

    watchdog_watch_path = str(script_dir)
    if not SUPABASE_AVAILABLE and not (LOCAL_LIB_DIR.exists() and any(LOCAL_LIB_DIR.iterdir())):
        logger.info("Required packages not found. Installing to local lib directory...")
        print("Installing required packages to local lib directory (first time only)...")
        try:
            if install_requirements_local():
                logger.info("Packages installed to local lib directory. Restarting imports...")
                supabase_client.check_supabase_availability()
                SUPABASE_AVAILABLE = supabase_client.SUPABASE_AVAILABLE
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
    
    logger.info("Starting Rianell server")
    logger.info(f"Server directory: {script_dir}")
    logger.info(f"Port: {PORT}")
    logger.info(f"Max connections per IP: {MAX_CONNECTIONS_PER_IP}")
    logger.info(f"Connection timeout: {CONNECTION_TIMEOUT}s")
    logger.info(f"Supabase: {'CONNECTED' if supabase_client.supabase_client else 'NOT AVAILABLE (install: pip install supabase)'}")
    
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
            file_observer.schedule(event_handler, watchdog_watch_path, recursive=True)
            file_observer.start()
            logger.info(f"File watcher started for: {watchdog_watch_path}")
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
            print(f"Please close the application using port {PORT} or change the PORT in security/.env (or legacy .env) or server config")
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
    print("Rianell web server")
    print("=" * 60)
    print(f"Server running at: {server_url}")
    if local_ip != "Unable to determine":
        print(f"LAN access: {lan_url}")
        print(f"  (Use this URL from other devices on your network)")
    print(f"Serving directory: {script_dir}")
    print(f"Log file: {LOG_FILE}")
    print(f"Supabase: {'CONNECTED' if supabase_client.supabase_client else 'NOT AVAILABLE (install: pip install supabase)'}")
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
    
    # Open browser — prefer isolated Chromium when configured
    app_url = f'http://127.0.0.1:{PORT}' if HOST in ('0.0.0.0', '::', '[::]') else server_url
    if config.OPEN_CLEAN_CHROMIUM_ON_START:
        ok, msg = chromium_dev.launch_clean_chromium(app_url)
        if ok:
            logger.info(msg)
            print(f'Opening clean Chromium at {app_url}…')
        else:
            logger.warning('Clean Chromium launch failed: %s', msg)
            print(f'Clean Chromium: {msg}')
            if not config.SKIP_DEFAULT_BROWSER_ON_START:
                try:
                    webbrowser.open(server_url, new=0)
                except Exception as e:
                    logger.warning(f'Could not open browser automatically: {e}')
    elif not config.SKIP_DEFAULT_BROWSER_ON_START:
        try:
            webbrowser.open(server_url, new=0)
            logger.info(f'Browser opened at {server_url}')
            print(f'Opening browser at {server_url}…')
        except Exception as e:
            logger.warning(f'Could not open browser automatically: {e}')
            print(f'Could not open browser automatically: {e}')
            print(f'Please open {server_url} manually in your browser')
    else:
        logger.info('Browser auto-open skipped (RIANELL_SKIP_DEFAULT_BROWSER)')
        print(f'App URL: {app_url} (use dashboard or clean Chromium to open)')
    
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