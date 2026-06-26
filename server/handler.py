"""Rianell HTTP request handler."""
import http.server
import socket
import socketserver
import threading
import time
from urllib.parse import urlparse

from . import config
from .routes.api import ApiRoutesMixin
from .routes.fhir import FhirRoutesMixin
from .routes.static import StaticRoutesMixin

logger = config.logger
file_handler = config.file_handler
connection_lock = config.connection_lock
active_connections = config.active_connections
last_activity = config.last_activity
MAX_CONNECTIONS_PER_IP = config.MAX_CONNECTIONS_PER_IP

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


class RianellHttpHandler(StaticRoutesMixin, ApiRoutesMixin, FhirRoutesMixin, http.server.SimpleHTTPRequestHandler):
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
            if file_handler:
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
        if file_handler:
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
            if file_handler:
                file_handler.flush()
            return  # Don't call super().log_error() to suppress the exception traceback
        
        # Log other errors normally
        client_ip = getattr(self, 'client_address', ['Unknown'])[0] if hasattr(self, 'client_address') else 'Unknown'
        # self.path might not exist if request timed out before parsing
        path = getattr(self, 'path', 'Unknown')
        logger.error(f"ERROR | {error_msg} | Client: {client_ip} | Path: {path}")
        if file_handler:
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

        # Plan 20 SH3 — FHIR R4 lite export (self-hosted)
        if parsed_path.path.rstrip('/') == '/fhir/R4/Bundle' or parsed_path.path.rstrip('/') == '/api/fhir/bundle':
            self.handle_fhir_bundle()
            return
        
        if parsed_path.path.startswith('/fhir/r4'):
            self.handle_fhir_r4(method='GET')
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
        if self.try_gzip_static_get():
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

        if parsed_path.path == '/api/bug-report':
            self.handle_bug_report()
            return

        if parsed_path.path.startswith('/fhir/r4'):
            self.handle_fhir_r4(method='POST')
            return
        
        # For other POST requests, return 405 Method Not Allowed
        self.send_response(405)
        self.end_headers()
    
