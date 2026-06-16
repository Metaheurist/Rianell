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

# Server package (config, encryption, requirements, sample_data, supabase)
from . import config
from . import encryption
from . import http_security
from . import requirements_check
from . import sample_data
from . import supabase_client

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
    """Create Tkinter dashboard for server controls"""
    if not TKINTER_AVAILABLE:
        return None
    
    root = tk.Tk()
    root.title("Rianell Server Dashboard")
    root.geometry("1040x820")
    root.configure(bg='#070807')
    
    # Style
    style = ttk.Style()
    style.theme_use('clam')
    panel_bg = '#070807'
    surface_bg = '#121416'
    card_bg = '#0c1011'
    text_main = '#e0f2f1'
    text_muted = '#9bb0a8'
    accent = '#7bdf8c'
    accent_hover = '#95e8a4'
    border = '#1f3528'

    style.configure('.', background=panel_bg, foreground=text_main, fieldbackground=card_bg)
    style.configure('TFrame', background=panel_bg)
    style.configure('TLabelframe', background=surface_bg, foreground=accent, bordercolor=border, borderwidth=1, relief='solid')
    style.configure('TLabelframe.Label', background=surface_bg, foreground=accent, font=('Segoe UI', 10, 'bold'))
    style.configure('TLabel', background=panel_bg, foreground=text_main)
    style.configure('Title.TLabel', font=('Segoe UI', 16, 'bold'), foreground=accent)
    style.configure('Status.TLabel', font=('Segoe UI', 10), foreground=text_muted, background=panel_bg)
    style.configure('Toggle.TCheckbutton', background=panel_bg, foreground=text_main)
    style.configure(
        'TButton',
        font=('Segoe UI', 9, 'bold'),
        padding=(10, 6),
        foreground=text_main,
        background='#151a1d',
        bordercolor='#2c5b42',
        lightcolor='#1d2d23',
        darkcolor='#0c1011',
        relief='flat'
    )
    style.map(
        'TButton',
        background=[('active', '#1e2b24'), ('pressed', '#16211b')],
        foreground=[('active', '#f2fff5')]
    )
    style.configure('TEntry', fieldbackground=card_bg, foreground=text_main, insertcolor=accent)
    style.configure('TCombobox', fieldbackground=card_bg, foreground=text_main, arrowsize=13)
    style.map('TCombobox', fieldbackground=[('readonly', card_bg)], foreground=[('readonly', text_main)])
    style.configure(
        'Treeview',
        background=card_bg,
        fieldbackground=card_bg,
        foreground=text_main,
        bordercolor=border,
        rowheight=24,
        relief='flat'
    )
    style.map('Treeview', background=[('selected', '#1f4a35')], foreground=[('selected', '#f3fff6')])
    style.configure(
        'Treeview.Heading',
        background='#141a1d',
        foreground=accent_hover,
        bordercolor=border,
        font=('Segoe UI', 9, 'bold')
    )
    
    # Main frame
    main_frame = ttk.Frame(root, padding="10")
    main_frame.pack(fill=tk.BOTH, expand=True)
    
    # Title
    title_label = ttk.Label(main_frame, text="Rianell Server Tinker", style='Title.TLabel')
    title_label.pack(pady=10)

    def _app_url_for_browser():
        """URL that opens the served web app in the default browser (loopback when bound to all interfaces)."""
        h = HOST.strip()
        if h in ('0.0.0.0', '::', '[::]'):
            return f'http://127.0.0.1:{PORT}'
        if ':' in h and not h.startswith('['):
            return f'http://[{h}]:{PORT}'
        return f'http://{h}:{PORT}'

    def open_app_in_browser():
        url = _app_url_for_browser()
        try:
            webbrowser.open(url, new=2)
            logger.info(f"Opened app in browser: {url}")
        except Exception as e:
            logger.warning(f"Could not open browser: {e}")
            messagebox.showerror("Browser", f"Could not open the app URL:\n{url}\n\n{e}")
    
    # Status frame
    status_frame = ttk.LabelFrame(main_frame, text="Server Status", padding="10")
    status_frame.pack(fill=tk.X, pady=5)

    status_top = ttk.Frame(status_frame)
    status_top.pack(fill=tk.X)
    app_url = _app_url_for_browser()
    server_status = ttk.Label(status_top, text=f"Server: {app_url}", style='Status.TLabel')
    server_status.pack(side=tk.LEFT, anchor=tk.W)
    open_app_btn = ttk.Button(status_top, text="🌐 Open app in browser", command=open_app_in_browser)
    open_app_btn.pack(side=tk.LEFT, padx=(12, 0))

    # Live reload: watchdog + manual push to devices (SSE)
    reload_row = ttk.Frame(status_frame)
    reload_row.pack(fill=tk.X, pady=(10, 0))

    watchdog_lbl = ttk.Label(reload_row, text=watchdog_status_label(), style='Status.TLabel')
    watchdog_lbl.pack(side=tk.LEFT, anchor=tk.W)

    def refresh_watchdog_label():
        watchdog_lbl.config(text=watchdog_status_label())

    def on_pause_watch():
        ok, msg = pause_file_observer()
        refresh_watchdog_label()
        if not ok:
            messagebox.showwarning("File watch", msg)

    def on_start_watch():
        ok, msg = resume_file_observer()
        refresh_watchdog_label()
        if not ok:
            messagebox.showerror("File watch", msg)

    def on_push_reload():
        signal_clients_reload()
        messagebox.showinfo(
            "Devices",
            "Reload signal sent to connected browsers.\n"
            "Open tabs / devices using live reload will refresh.",
        )

    pause_watch_btn = ttk.Button(reload_row, text="⏸ Pause file watch", command=on_pause_watch)
    pause_watch_btn.pack(side=tk.LEFT, padx=(12, 4))
    start_watch_btn = ttk.Button(reload_row, text="▶ Start file watch", command=on_start_watch)
    start_watch_btn.pack(side=tk.LEFT, padx=4)
    push_reload_btn = ttk.Button(reload_row, text="📡 Push reload to devices", command=on_push_reload)
    push_reload_btn.pack(side=tk.LEFT, padx=(16, 0))
    if not WATCHDOG_AVAILABLE:
        pause_watch_btn.config(state='disabled')
        start_watch_btn.config(state='disabled')

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
    refresh_connection_btn = ttk.Button(connection_frame, text="🔄 Refresh Connection", command=check_connection)
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
    install_requirements_btn = ttk.Button(connection_frame, text="📦 Install Requirements", command=install_requirements_ui)
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
    
    search_btn = ttk.Button(search_frame, text="🔍 Search", command=perform_search)
    search_btn.pack(side=tk.LEFT, padx=5)
    
    # Add refresh button to reload conditions
    refresh_conditions_btn = ttk.Button(search_frame, text="♻ Refresh Conditions", command=load_available_conditions)
    refresh_conditions_btn.pack(side=tk.LEFT, padx=5)

    # Data tools: destructive / bulk actions grouped
    data_tools = ttk.LabelFrame(supabase_frame, text="Data tools", padding="8")
    data_tools.pack(fill=tk.X, pady=(8, 4))
    action_frame = ttk.Frame(data_tools)
    action_frame.pack(fill=tk.X)
    
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
    
    export_btn = ttk.Button(action_frame, text="📤 Export to CSV", command=export_data)
    export_btn.pack(side=tk.LEFT, padx=4, pady=2)
    
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

            deleted = 0
            service_delete_ok = False

            # Prefer using the Supabase service key to perform a server-side delete in one request.
            # This avoids slow client-side loops and bypasses RLS when using the SERVICE KEY.
            if SUPABASE_SERVICE_KEY:
                try:
                    svc = get_supabase_service_client()
                    if not svc:
                        raise Exception("Supabase service client not available")
                    # Delete all rows where id != 0 (serial IDs start at 1) to remove all records
                    resp = svc.table('anonymized_data').delete().neq('id', 0).execute()
                    # resp may contain error info depending on client version
                    if hasattr(resp, 'error') and resp.error:
                        logger.error(f"Service-key delete returned error: {resp.error}")
                        raise Exception(resp.error)
                    if hasattr(resp, 'count') and resp.count is not None:
                        deleted = resp.count
                    elif getattr(resp, 'data', None) is not None:
                        deleted = len(resp.data)
                    logger.info(f"Successfully deleted {deleted} records using service key")
                    service_delete_ok = True
                except Exception as e:
                    logger.warning(f"Service-key delete failed, falling back to client-side deletes: {e}")
                    # Fall through to client-side deletion below

            # If service-key path not used or failed, fall back to fetching IDs and deleting one-by-one
            if not service_delete_ok:
                all_records = client.table('anonymized_data').select('id').execute()
                if all_records and all_records.data:
                    record_count = len(all_records.data)
                    logger.info(f"Found {record_count} records to delete (client-side)")
                    for record in all_records.data:
                        try:
                            client.table('anonymized_data').delete().eq('id', record['id']).execute()
                            deleted += 1
                        except Exception as e:
                            logger.warning(f"Failed to delete record {record.get('id')}: {e}")
                    logger.info(f"Successfully deleted {deleted}/{record_count} records")
                else:
                    logger.info("Database already empty")

            seq_reset = try_restart_anonymized_data_id_sequence()
            seq_note = (
                "\n\nID sequence reset: next row will use id = 1."
                if seq_reset
                else "\n\nNote: Could not reset the id sequence automatically. Add DATABASE_URL "
                "(Supabase → Settings → Database → URI, use the pooled or direct connection string) to "
                "security/.env - service_role alone is not enough unless you added an exec_sql RPC. "
                "Or run in SQL Editor:\n"
                "ALTER SEQUENCE public.anonymized_data_id_seq RESTART WITH 1;"
            )

            if deleted == 0:
                headline = "Database was already empty."
            else:
                headline = f"Database wiped!\nDeleted {deleted} records."
            messagebox.showinfo("Success", headline + seq_note)
            
            # Refresh the viewer
            search_results.clear()
            refresh_db_viewer()
            perform_search()
            logger.info("Database wipe complete")
            
        except Exception as e:
            logger.error(f"Error wiping database: {e}", exc_info=True)
            messagebox.showerror("Error", f"Failed to wipe database:\n{str(e)[:100]}")
    
    wipe_btn = ttk.Button(action_frame, text="🗑 Wipe Database", command=wipe_database)
    wipe_btn.pack(side=tk.LEFT, padx=4, pady=2)
    
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
    
    generate_btn = ttk.Button(action_frame, text="🧪 Generate Sample Data", command=generate_sample_data)
    generate_btn.pack(side=tk.LEFT, padx=4, pady=2)
    
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
                        output_path = config.PROJECT_ROOT / f'health_data_sample_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
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
    
    generate_csv_btn = ttk.Button(action_frame, text="📝 Generate CSV File", command=generate_csv_sample)
    generate_csv_btn.pack(side=tk.LEFT, padx=4, pady=2)

    # Database Viewer
    db_viewer_frame = ttk.LabelFrame(main_frame, text="Database Viewer", padding="10")
    db_viewer_frame.pack(fill=tk.BOTH, expand=True, pady=5)

    viewer_toolbar = ttk.Frame(db_viewer_frame)
    viewer_toolbar.pack(fill=tk.X, pady=(0, 6))

    viewer_body = ttk.Frame(db_viewer_frame)
    viewer_body.pack(fill=tk.BOTH, expand=True)

    # Treeview for database records (with multi-select enabled)
    viewer_tree = ttk.Treeview(viewer_body, columns=('id', 'condition', 'date', 'bpm', 'weight', 'fatigue', 'stiffness', 'sleep', 'mood', 'steps', 'flare'), show='headings', height=8, selectmode='extended')
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
    
    viewer_scroll = ttk.Scrollbar(viewer_body, orient=tk.VERTICAL, command=viewer_tree.yview)
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
    
    refresh_viewer_btn = ttk.Button(viewer_toolbar, text="🔄 Refresh View", command=refresh_db_viewer)
    refresh_viewer_btn.pack(side=tk.LEFT, padx=(0, 8))

    selection_count_label = ttk.Label(viewer_toolbar, text="0 selected", style='Status.TLabel')
    selection_count_label.pack(side=tk.LEFT, padx=4)
    selection_hint_label = ttk.Label(viewer_toolbar, text="Tip: Ctrl/Shift for multi-select, Ctrl+A select all", style='Status.TLabel')
    selection_hint_label.pack(side=tk.LEFT, padx=(12, 0))
    
    def update_selection_count(event=None):
        """Update the selection count label"""
        selected_count = len(viewer_tree.selection())
        selection_count_label.config(text=f"{selected_count} selected")
    
    # Bind selection events to update count
    viewer_tree.bind('<<TreeviewSelect>>', update_selection_count)
    viewer_tree.bind('<<TreeviewDeselect>>', update_selection_count)

    def select_all_rows(event=None):
        items = viewer_tree.get_children()
        if items:
            viewer_tree.selection_set(items)
            update_selection_count()
        return "break"

    viewer_tree.bind('<Control-a>', select_all_rows)
    viewer_tree.bind('<Command-a>', select_all_rows)
    
    
    # Logs display: bracket prefix [LEVEL] via BracketLevelFormatter (console/file keep emoji)
    logs_frame = ttk.LabelFrame(main_frame, text="Server Logs", padding="10")
    logs_frame.pack(fill=tk.BOTH, expand=True, pady=5)

    log_view_font = ('Consolas', 9)
    log_view_font_bold = ('Consolas', 9, 'bold')

    logs_text = scrolledtext.ScrolledText(
        logs_frame,
        height=15,
        bg='#2d2d2d',
        fg='#e0f2f1',
        font=log_view_font,
        wrap=tk.WORD
    )
    logs_text.pack(fill=tk.BOTH, expand=True)

    # Configure color tags for different parts of log messages (partial highlighting)
    logs_text.tag_config('TIMESTAMP', foreground='#808080', font=log_view_font)  # Gray for timestamps
    logs_text.tag_config('DEBUG', foreground='#808080', font=log_view_font)  # Gray
    logs_text.tag_config('INFO', foreground='#2196f3', font=log_view_font)  # Blue for | INFO | segment
    logs_text.tag_config('WARNING', foreground='#ff9800', font=log_view_font)  # Orange
    logs_text.tag_config('WARN', foreground='#ff9800', font=log_view_font)  # Orange (alias)
    logs_text.tag_config('ERROR', foreground='#f44336', font=log_view_font_bold)  # Red, bold
    logs_text.tag_config('CRITICAL', foreground='#e91e63', font=log_view_font_bold)  # Pink, bold
    logs_text.tag_config('BRACKET_DEBUG', foreground='#808080', font=log_view_font)
    logs_text.tag_config('BRACKET_INFO', foreground='#2196f3', font=log_view_font)  # Blue leading [INFO]
    logs_text.tag_config('BRACKET_WARNING', foreground='#ff9800', font=log_view_font)
    logs_text.tag_config('BRACKET_ERROR', foreground='#f44336', font=log_view_font_bold)
    logs_text.tag_config('BRACKET_CRITICAL', foreground='#e91e63', font=log_view_font_bold)
    logs_text.tag_config('BRACKET_OTHER', foreground='#b0bec5', font=log_view_font)
    logs_text.tag_config('SYNC', foreground='#42a5f5', font=log_view_font)  # Lighter blue (distinct from INFO)
    logs_text.tag_config('REQUEST', foreground='#9c27b0', font=log_view_font)  # Purple for HTTP methods
    logs_text.tag_config('PATH', foreground='#00bcd4', font=log_view_font)  # Cyan for paths
    logs_text.tag_config('DEFAULT', foreground='#e0f2f1', font=log_view_font)  # Default color
    # Full-line base color by level (console-like)
    logs_text.tag_config('LINE_DEBUG', foreground='#9aa0a6', font=log_view_font)
    logs_text.tag_config('LINE_INFO', foreground='#7ec8ff', font=log_view_font)
    logs_text.tag_config('LINE_WARNING', foreground='#ffb74d', font=log_view_font)
    logs_text.tag_config('LINE_ERROR', foreground='#ff6b6b', font=log_view_font_bold)
    logs_text.tag_config('LINE_CRITICAL', foreground='#ff4da6', font=log_view_font_bold)
    # Ensure DEFAULT never overrides more specific tags
    logs_text.tag_lower('DEFAULT')
    
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
                    start_pos = self.text_widget.index(tk.END)
                    self.text_widget.insert(tk.END, msg + '\n')
                    line_end = self.text_widget.index(tk.END + '-1c')

                    level_key = str(levelname or '').upper()
                    base_tag = {
                        'DEBUG': 'LINE_DEBUG',
                        'INFO': 'LINE_INFO',
                        'WARNING': 'LINE_WARNING',
                        'WARN': 'LINE_WARNING',
                        'ERROR': 'LINE_ERROR',
                        'CRITICAL': 'LINE_CRITICAL',
                    }.get(level_key, 'DEFAULT')
                    self.text_widget.tag_add(base_tag, start_pos, line_end)
                    
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

            # Leading [LEVEL] prefix (Tkinter dashboard formatter only)
            bracket_match = re.match(r'^\[([^\]]+)\]\s*', msg)
            if bracket_match:
                lvl = bracket_match.group(1).upper()
                b0 = bracket_match.start()
                b1 = bracket_match.end()
                bs = start_pos + f'+{b0}c'
                be = start_pos + f'+{b1}c'
                bracket_tag = {
                    'DEBUG': 'BRACKET_DEBUG',
                    'INFO': 'BRACKET_INFO',
                    'WARNING': 'BRACKET_WARNING',
                    'WARN': 'BRACKET_WARNING',
                    'ERROR': 'BRACKET_ERROR',
                    'CRITICAL': 'BRACKET_CRITICAL',
                }.get(lvl, 'BRACKET_OTHER')
                self.text_widget.tag_add(bracket_tag, bs, be)

            # Parse the log format: "YYYY-MM-DD HH:MM:SS | LEVEL | Name | Message"
            # Example: "2026-01-03 03:10:02 | INFO | Rianell | SYNC | Anonymized data synced..."
            
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
    text_handler.setFormatter(dashboard_log_formatter)
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