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

        def handle_visual_gallery_page(self):
            """Serve current visual gallery HTML (scripts/dev/visual-current-gallery.html)."""
            try:
                from .. import visual_gallery
                body = visual_gallery.gallery_html_with_skin()
                if not body:
                    self.send_error(404, 'visual-current-gallery.html not found')
                    return
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                logger.exception('Error serving visual gallery page')
                self.send_error(500, str(e))

        def handle_visual_gallery_skin(self):
            """Serve shared gallery CSS (scripts/dev/visual-gallery-skin.css)."""
            try:
                from .. import visual_gallery
                css_path = visual_gallery.gallery_skin_css_path()
                if not css_path.is_file():
                    self.send_error(404, 'visual-gallery-skin.css not found')
                    return
                with open(css_path, 'rb') as f:
                    body = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/css; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                logger.exception('Error serving visual gallery skin')
                self.send_error(500, str(e))

        def handle_visual_gallery_api(self):
            """JSON gallery of current register icons/animations (Node dump + Python slice)."""
            try:
                from .. import visual_gallery
                parsed = urlparse(self.path)
                opts = visual_gallery.parse_gallery_query(parsed.query)
                data = visual_gallery.slice_gallery(
                    limit=opts['limit'],
                    offset=opts['offset'],
                    id_filter=opts['id_filter'],
                )
                body = json.dumps(data).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                logger.exception('Error serving visual gallery API')
                err_body = json.dumps({'error': str(e), 'counts': {}, 'items': []}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(err_body)))
                self.end_headers()
                self.wfile.write(err_body)

        def _agentic_forbidden(self, message='loopback only'):
            from .. import agentic_console
            body = json.dumps(agentic_console.envelope(
                False, None, {'code': 403, 'message': message},
            )).encode('utf-8')
            self.send_response(403)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _agentic_json(self, status, payload):
            body = json.dumps(payload).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _agentic_guard(self, method='GET'):
            client_ip = self.client_address[0] if self.client_address else ''
            host = self.headers.get('Host', '')
            if not http_security.client_may_access_agentic_apis(client_ip):
                self._agentic_forbidden('agentic API is loopback-only')
                return False
            if not http_security.host_is_loopback(host):
                self._agentic_forbidden('Host must be localhost')
                return False
            if method == 'POST':
                origin = self.headers.get('Origin') or ''
                referer = self.headers.get('Referer') or ''
                if origin:
                    allowed = http_security.cors_allow_origin_value(
                        origin, getattr(config, 'PORT', 8080), host,
                    )
                    if allowed in (None, 'null'):
                        self._agentic_forbidden('Origin must be same-origin loopback')
                        return False
                elif referer:
                    if not (referer.startswith('http://127.0.0.1') or referer.startswith('http://localhost')):
                        self._agentic_forbidden('Referer must be loopback')
                        return False
            if not http_security.agentic_api_limiter.allow(client_ip or 'unknown'):
                from .. import agentic_console
                self._agentic_json(429, agentic_console.envelope(
                    False, None, {'code': 429, 'message': 'rate limited'},
                ))
                return False
            return True

        def handle_agentic_page(self):
            """Serve AIO console at /dev/agentic."""
            try:
                from .. import agentic_console
                body = agentic_console.console_html()
                if not body:
                    self.send_error(404, 'agentic console not found')
                    return
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                logger.exception('Error serving agentic console')
                self.send_error(500, str(e))

        def handle_agentic_asset(self):
            """Serve static assets under /dev/agentic/* (safe client, etc.)."""
            try:
                from .. import agentic_console
                parsed = urlparse(self.path)
                rel = parsed.path[len('/dev/agentic'):].lstrip('/')
                asset = agentic_console.console_asset(rel)
                if not asset:
                    self.send_error(404, 'agentic asset not found')
                    return
                body, ctype = asset
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                logger.exception('Error serving agentic asset')
                self.send_error(500, str(e))

        def handle_agentic_api(self, method='GET'):
            """Dispatch /api/agentic/* control plane."""
            if not self._agentic_guard(method=method):
                return
            from .. import agentic_console
            parsed = urlparse(self.path)
            path = parsed.path.rstrip('/') or '/'
            prefix = '/api/agentic'
            rel = path[len(prefix):] if path.startswith(prefix) else path
            rel = rel or '/'

            try:
                body_obj = None
                if method == 'POST':
                    length = int(self.headers.get('Content-Length') or 0)
                    if length > 1_000_000:
                        self._agentic_json(413, agentic_console.envelope(
                            False, None, {'code': 413, 'message': 'body too large'},
                        ))
                        return
                    raw = self.rfile.read(length) if length else b'{}'
                    ctype = (self.headers.get('Content-Type') or '').split(';')[0].strip()
                    if length and ctype != 'application/json':
                        self._agentic_json(415, agentic_console.envelope(
                            False, None, {'code': 415, 'message': 'application/json required'},
                        ))
                        return
                    body_obj = json.loads(raw.decode('utf-8') or '{}')

                if method == 'GET' and rel in ('/health', 'health'):
                    self._agentic_json(200, agentic_console.envelope(True, {
                        'service': 'agentic',
                        'packs': list(agentic_console.PACK_IDS),
                    }))
                    return

                if method == 'GET' and rel in ('/catalog', 'catalog'):
                    self._agentic_json(200, agentic_console.envelope(True, agentic_console.load_catalog()))
                    return

                if method == 'GET' and rel in ('/gpus', 'gpus'):
                    result = agentic_console.hw_profile()
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'GET' and rel in ('/status', 'status'):
                    result = agentic_console.global_status()
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'GET' and rel in ('/mode', 'mode'):
                    self._agentic_json(200, agentic_console.envelope(True, agentic_console.get_mode()))
                    return

                if method == 'POST' and rel in ('/mode', 'mode'):
                    mode = (body_obj or {}).get('mode') or 'serial'
                    result = agentic_console.set_mode(mode)
                    self._agentic_json(200 if result['ok'] else 400, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/models/load', 'models/load'):
                    model = (body_obj or {}).get('model') or ''
                    result = agentic_console.ollama_model_action('load', model)
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/models/unload', 'models/unload'):
                    model = (body_obj or {}).get('model') or ''
                    result = agentic_console.ollama_model_action('unload', model)
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/pause-all', 'pause-all'):
                    result = agentic_console._node([
                        'scripts/dev/agentic-pipeline/cli-state.mjs', '--pause-all',
                    ])
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/resume-all', 'resume-all'):
                    result = agentic_console._node([
                        'scripts/dev/agentic-pipeline/cli-state.mjs', '--resume-all',
                    ])
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'GET' and rel in ('/run-all', 'run-all'):
                    result = agentic_console._node(['scripts/ci/agentic-run-all.mjs', '--status'])
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/run-all', 'run-all'):
                    dry = bool((body_obj or {}).get('dryRun'))
                    skip = (body_obj or {}).get('skip') or []
                    result = agentic_console.run_all(dry_run=dry, skip=skip)
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/run-all/pause', 'run-all/pause'):
                    result = agentic_console._node(['scripts/ci/agentic-run-all.mjs', '--pause'])
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/run-all/resume', 'run-all/resume'):
                    result = agentic_console._node(['scripts/ci/agentic-run-all.mjs', '--resume'])
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                if method == 'POST' and rel in ('/run-all/cancel', 'run-all/cancel'):
                    result = agentic_console._node(['scripts/ci/agentic-run-all.mjs', '--cancel'])
                    self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                        result['ok'], result.get('data'), result.get('error'),
                    ))
                    return

                parts = [p for p in rel.split('/') if p]
                if len(parts) >= 1 and parts[0] in agentic_console.PACK_IDS:
                    pack = parts[0]
                    action = parts[1] if len(parts) > 1 else 'status'
                    if method == 'GET' and pack == 'visual' and action == 'live':
                        self._agentic_json(200, agentic_console.envelope(
                            True, agentic_console.visual_live_status(), None, 'visual',
                        ))
                        return
                    if method == 'GET' and action == 'status':
                        result = agentic_console.pack_status(pack)
                        self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                            result['ok'], result.get('data'), result.get('error'), pack,
                        ))
                        return
                    if method == 'GET' and action == 'report':
                        rp = Path(agentic_console.REPO_ROOT) / 'artifacts' / 'agentic' / pack / 'report.json'
                        data = json.loads(rp.read_text(encoding='utf-8')) if rp.is_file() else None
                        self._agentic_json(200, agentic_console.envelope(True, data, None, pack))
                        return
                    if method == 'POST' and action == 'start':
                        dry = bool((body_obj or {}).get('dryRun') or (body_obj or {}).get('mode') == 'dry-run')
                        result = agentic_console.run_pack(pack, dry_run=dry)
                        self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                            result['ok'], result.get('data'), result.get('error'), pack,
                        ))
                        return
                    if method == 'POST' and action in ('pause', 'resume'):
                        flag = '--pause' if action == 'pause' else '--resume'
                        result = agentic_console._node([
                            'scripts/dev/agentic-pipeline/cli-state.mjs', flag, f'--pack={pack}',
                        ])
                        self._agentic_json(200 if result['ok'] else 500, agentic_console.envelope(
                            result['ok'], result.get('data'), result.get('error'), pack,
                        ))
                        return
                    if method == 'POST' and action == 'model':
                        self._agentic_json(200, agentic_console.envelope(True, {
                            'pack': pack,
                            'model': (body_obj or {}).get('model'),
                            'note': 'selector preference recorded client-side; catalog recommended remains default',
                        }, None, pack))
                        return

                self._agentic_json(404, agentic_console.envelope(
                    False, None, {'code': 404, 'message': f'unknown route {rel}'},
                ))
            except Exception as e:
                logger.exception('agentic API error')
                self._agentic_json(500, agentic_console.envelope(
                    False, None, {'code': 500, 'message': str(e)[:300]},
                ))
    
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
                        '(see docs/security/SECURITY.md). If HEALTH_APP_SENSITIVE_APIS_LAN_SECRET is set, send header X-Rianell-LAN-Secret.'
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

        def handle_client_error(self):
            """Receive scrubbed, automatic client-side error reports and log them.

            Companion to the client `error-reporting.js` suite. Unlike /api/bug-report
            (manual, Supabase-backed, loopback-only), this endpoint only writes to the
            server log so it can run in local/dev mode without any external dependency.
            The client already scrubs health data; we defensively re-sanitise here and
            never persist screening (PHQ-9/GAD-7) or health-log values.
            """
            try:
                client_ip = self.client_address[0]
                MAX_CONTENT_LENGTH = 1024 * 8  # 8KB max
                content_length = int(self.headers.get('Content-Length', 0) or 0)

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

                if not http_security.client_error_limiter.allow(client_ip):
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Too many error reports'}).encode('utf-8'))
                    return

                post_data = self.rfile.read(content_length)
                try:
                    payload = json.loads(post_data.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError) as e:
                    logger.warning(f"Invalid JSON in client-error request: {e}")
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode('utf-8'))
                    return

                if not isinstance(payload, dict):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Expected JSON object'}).encode('utf-8'))
                    return

                def _clean(value, limit, single_line=True):
                    text = str(value or '')
                    if single_line:
                        text = text.replace('\n', ' ').replace('\r', ' ')
                    return http_security.scrub_health_terms(text)[:limit]

                kind = _clean(payload.get('kind', 'error'), 40)
                name = _clean(payload.get('name', ''), 120)
                message = _clean(payload.get('message', ''), 500)
                source = _clean(payload.get('source', ''), 300)
                line = _clean(payload.get('line', ''), 12)
                col = _clean(payload.get('col', ''), 12)
                url = _clean(payload.get('url', ''), 300)
                user_agent = _clean(payload.get('user_agent', ''), 300)
                stack = http_security.scrub_health_terms(str(payload.get('stack', '') or ''))[:2000]
                count = payload.get('count', 1)
                try:
                    count = max(1, min(int(count), 10000))
                except (ValueError, TypeError):
                    count = 1

                with connection_lock:
                    last_activity[client_ip] = time.time()

                location = source or url
                if line:
                    location = f"{location}:{line}" + (f":{col}" if col else "")
                summary = f"CLIENT_ERROR | {kind} | {name}: {message}".strip()
                if location:
                    summary += f" | at {location}"
                if count > 1:
                    summary += f" | x{count}"
                summary += f" | IP: {client_ip} | UA: {user_agent[:80]}"
                logger.error(summary)
                if stack:
                    logger.debug(f"CLIENT_ERROR_STACK | {stack}")
                if config.file_handler:
                    config.file_handler.flush()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('X-Content-Type-Options', 'nosniff')
                self.send_header('X-Frame-Options', 'DENY')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'reported'}).encode('utf-8'))
            except Exception as e:
                logger.error(f"Error handling client error report: {e}")
                try:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Failed to record error'}).encode('utf-8'))
                except Exception:
                    pass

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
                        '(see docs/security/SECURITY.md). If HEALTH_APP_SENSITIVE_APIS_LAN_SECRET is set, send header X-Rianell-LAN-Secret.'
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
    
