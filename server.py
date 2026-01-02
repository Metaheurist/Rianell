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
from collections import defaultdict
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# Try to import watchdog for file watching
try:
    from watchdog.observers import Observer  # type: ignore
    from watchdog.events import FileSystemEventHandler  # type: ignore
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("Warning: watchdog library not installed. File watching disabled.")
    print("Install with: pip install watchdog")

# Configuration
PORT = 8080
HOST = ""  # Empty string means bind to all interfaces (0.0.0.0), accessible over LAN

# Setup logging
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / f"health_app_{datetime.now().strftime('%Y%m%d')}.log"

# Configure logger
logger = logging.getLogger('HealthApp')
logger.setLevel(logging.DEBUG)

# File handler for persistent logging (unbuffered for immediate writes)
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8', mode='a', delay=False)  # 'a' for append mode
file_handler.setLevel(logging.DEBUG)
# Make the stream unbuffered for immediate writes
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
        """Handle POST requests for client-side logging"""
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
            except (BrokenPipeError, ConnectionResetError, OSError):
                # Client disconnected
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
                except (BrokenPipeError, ConnectionResetError, OSError):
                    # Client disconnected
                    logger.debug(f"SSE client disconnected: {client_ip}")
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
    
    def end_headers(self):
        # Security: Add security headers to all responses
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
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

def main():
    """Start the web server"""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Use localhost explicitly for browser opening
    server_url = f"http://localhost:{PORT}"
    
    logger.info("Starting Health App Server")
    logger.info(f"Server directory: {script_dir}")
    logger.info(f"Port: {PORT}")
    logger.info(f"Max connections per IP: {MAX_CONNECTIONS_PER_IP}")
    logger.info(f"Connection timeout: {CONNECTION_TIMEOUT}s")
    
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
    
    # Create server with error handling
    try:
        httpd = ThreadingHTTPServer((HOST, PORT), HealthAppHandler)
        logger.info("Server socket created successfully")
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
    print("=" * 60)
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
    
    # Start serving
    try:
        logger.info("Server entering serve_forever() loop")
        httpd.serve_forever()
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
        
        httpd.shutdown()
        logger.info("Server shutdown complete")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error in serve_forever: {e}", exc_info=True)
        print(f"\n\nUnexpected error: {e}")
        httpd.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    main()
