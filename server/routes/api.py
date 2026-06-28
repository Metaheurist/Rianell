"""API route handlers for Rianell HTTP server."""
import json
import threading
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from .. import config
from .. import encryption
from .. import http_security
from .. import supabase_client

logger = config.logger
connection_lock = config.connection_lock
last_activity = config.last_activity
sse_clients = config.sse_clients
sse_lock = config.sse_lock
file_change_event = config.file_change_event

get_encryption_key = encryption.get_encryption_key
check_supabase_availability = supabase_client.check_supabase_availability
init_supabase_client = supabase_client.init_supabase_client
search_supabase_data = supabase_client.search_supabase_data
get_supabase_service_client = supabase_client.get_supabase_service_client


class ApiRoutesMixin:
        def _client_may_sensitive_api(self, client_ip):
            """Loopback always; otherwise only if LAN mode on and X-Rianell-LAN-Secret matches."""
            if http_security.is_loopback_ip(client_ip):
                return True
            if not config.SENSITIVE_APIS_ON_LAN:
                return False
            secret = getattr(config, 'SENSITIVE_APIS_LAN_SECRET', None) or ''
            if not secret:
                return False
            supplied = (
                self.headers.get('X-Rianell-LAN-Secret') or self.headers.get('x-rianell-lan-secret') or ''
            ).strip()
            return supplied == secret

        def handle_tutorial_page(self):
            """Serve index.html for /tutorial so the app loads with the tutorial auto-opened for testing."""
            try:
                # Prefer cwd (set by main()), fallback to directory containing this script
                index_path = config.WEB_DIR / 'index.html'
                if not index_path.is_file():
                    index_path = Path.cwd() / 'index.html'
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
                current_available = check_supabase_availability()
                if current_available != supabase_client.SUPABASE_AVAILABLE:
                    supabase_client.SUPABASE_AVAILABLE = current_available
                    if current_available:
                        logger.info("Supabase availability updated: now available")

                client = init_supabase_client()
                status = {
                    'connected': client is not None,
                    'available': supabase_client.SUPABASE_AVAILABLE
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
                self.end_headers()
                self.wfile.write(json.dumps(status).encode('utf-8'))
            except Exception as e:
                logger.error(f"Error handling supabase status: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
        def handle_encryption_key(self):
            """Handle encryption key endpoint for client-server synchronization"""
            try:
                client_ip = self.client_address[0]
                if not http_security.sensitive_api_limiter.allow(client_ip):
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Too many requests'}).encode('utf-8'))
                    return
                if not self._client_may_sensitive_api(client_ip):
                    self.send_response(403)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    detail = (
                        'Encryption key API is only reachable from loopback. Set HEALTH_APP_SENSITIVE_APIS_ON_LAN=1 to allow LAN clients '
                        '(see docs/SECURITY.md). If HEALTH_APP_SENSITIVE_APIS_LAN_SECRET is set, send header X-Rianell-LAN-Secret.'
                    )
                    self.wfile.write(json.dumps({
                        'error': 'Forbidden',
                        'detail': detail,
                    }).encode('utf-8'))
                    logger.warning(f"Blocked encryption-key request from non-loopback IP {client_ip}")
                    return

                key = get_encryption_key()
                # Convert bytes back to hex string for transmission
                key_hex = key.hex()
            
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
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
                # CORS: handled in end_headers() (uses PORT from config)
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
                client_ip = self.client_address[0]
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
                    if not http_security.client_log_limiter.allow(client_ip):
                        self.send_response(429)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Too many requests'}).encode('utf-8'))
                        return
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
                
                    if file_handler:
                        file_handler.flush()

                    # Security: Validate and sanitize input
                    level = level[:10] if len(level) > 10 else level  # Limit length
                    message = message[:500] if len(message) > 500 else message  # Limit message length
                
                    # Send success response (CORS + security headers via end_headers)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
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
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'logging_endpoint_active'}).encode('utf-8'))
            except Exception as e:
                logger.error(f"Error handling client log: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
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
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'logged'}).encode('utf-8'))
                else:
                    # GET request to /api/sync-log - return status
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'sync_logging_endpoint_active'}).encode('utf-8'))
            except Exception as e:
                logger.error(f"Error handling sync log: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        def handle_bug_report(self):
            """Handle bug report submissions and insert into Supabase."""
            try:
                client_ip = self.client_address[0]
                if not self._client_may_sensitive_api(client_ip):
                    self.send_response(403)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Bug report API is only available on loopback or trusted LAN with secret.'}).encode('utf-8'))
                    return
                MAX_CONTENT_LENGTH = 1024 * 100  # 100KB
                content_length = int(self.headers.get('Content-Length', 0))

                if content_length <= 0:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Empty request body'}).encode('utf-8'))
                    return

                if content_length > MAX_CONTENT_LENGTH:
                    self.send_response(413)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Payload too large'}).encode('utf-8'))
                    return

                if not http_security.bug_report_limiter.allow(client_ip):
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Rate limit exceeded. Max 5 bug reports per day per IP.'}).encode('utf-8'))
                    return

                post_data = self.rfile.read(content_length)
                try:
                    payload = json.loads(post_data.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode('utf-8'))
                    return

                description = str(payload.get('description', '')).strip()
                if not description:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'description is required'}).encode('utf-8'))
                    return

                supabase_client.SUPABASE_AVAILABLE = check_supabase_availability()
                client = get_supabase_service_client() or init_supabase_client()
                if not supabase_client.SUPABASE_AVAILABLE or not client:
                    self.send_response(503)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Supabase not available'}).encode('utf-8'))
                    return

                report_row = {
                    'client_ip': client_ip[:100],
                    'title': str(payload.get('title', '')).strip()[:160] or None,
                    'description': description[:4000],
                    'steps_to_reproduce': str(payload.get('steps', '')).strip()[:4000] or None,
                    'expected_behavior': str(payload.get('expected_behavior', '')).strip()[:2000] or None,
                    'actual_behavior': str(payload.get('actual_behavior', '')).strip()[:2000] or None,
                    'console_output': str(payload.get('console_output', '')).strip()[:32000] or None,
                    'app_theme': str(payload.get('app_theme', '')).strip()[:64] or None,
                    'user_agent': str(payload.get('user_agent', '')).strip()[:512] or None,
                    'page_url': str(payload.get('url') or payload.get('page_url', '')).strip()[:1000] or None,
                    'client_timestamp': payload.get('client_timestamp'),
                }
                client.table('bug_reports').insert(report_row).execute()

                logger.info(f"BUG_REPORT | Received from {client_ip} | title={report_row['title'] or ''}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            except Exception as e:
                logger.error(f"Error handling bug report: {e}", exc_info=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Failed to submit bug report'}).encode('utf-8'))
    
        def handle_anonymized_data(self):
            """Handle fetching decrypted anonymized training data"""
            try:
                client_ip = self.client_address[0]
                if not http_security.sensitive_api_limiter.allow(client_ip):
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Too many requests'}).encode('utf-8'))
                    return
                if not self._client_may_sensitive_api(client_ip):
                    self.send_response(403)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    detail = (
                        'anonymized-data API is only reachable from loopback. Set HEALTH_APP_SENSITIVE_APIS_ON_LAN=1 for LAN '
                        '(see docs/SECURITY.md). If HEALTH_APP_SENSITIVE_APIS_LAN_SECRET is set, send header X-Rianell-LAN-Secret.'
                    )
                    self.wfile.write(json.dumps({
                        'error': 'Forbidden',
                        'detail': detail,
                    }).encode('utf-8'))
                    logger.warning(f"Blocked anonymized-data request from non-loopback IP {client_ip}")
                    return

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
            
                supabase_client.SUPABASE_AVAILABLE = check_supabase_availability()
                if not supabase_client.SUPABASE_AVAILABLE:
                    self.send_response(503)
                    self.send_header('Content-Type', 'application/json')
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

        def handle_fhir_bundle(self):
            """Plan 20 SH3 — return minimal FHIR R4 Bundle JSON for self-hosted clients."""
            try:
                body = {
                    'resourceType': 'Bundle',
                    'type': 'collection',
                    'entry': [],
                }
                payload = json.dumps(body).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/fhir+json')
                self.send_header('Content-Length', str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as e:
                logger.error(f"FHIR bundle error: {e}", exc_info=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
