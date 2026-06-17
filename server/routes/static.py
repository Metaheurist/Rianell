"""Static file serving helpers for Rianell HTTP handler."""
import gzip
import os
from pathlib import Path
from urllib.parse import urlparse

from .. import config
from .. import http_security


class StaticRoutesMixin:
        def try_gzip_static_get(self):
            """Serve text-like static files with gzip when the compressed body is smaller."""
            enc = self.headers.get('Accept-Encoding', '')
            if 'gzip' not in enc or self.command not in ('GET', 'HEAD'):
                return False
            parsed_path = urlparse(self.path)
            path_only = parsed_path.path
            if path_only.startswith('/api/'):
                return False
            ext = Path(path_only).suffix.lower()
            if ext not in ('.js', '.mjs', '.css', '.html', '.json', '.svg'):
                return False
            try:
                fs_path = self.translate_path(self.path)
            except Exception:
                return False
            if not os.path.isfile(fs_path):
                return False
            try:
                with open(fs_path, 'rb') as f:
                    data = f.read()
            except OSError:
                return False
            if len(data) < 1024:
                return False
            gz = gzip.compress(data, compresslevel=6)
            if len(gz) >= len(data) - 50:
                return False
            ctype = self.guess_type(path_only)
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(gz)))
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Vary', 'Accept-Encoding')
            self._static_long_cache = True
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(gz)
            return True
    
        def do_OPTIONS(self):
            """Handle CORS preflight requests"""
            self.send_response(200)
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
        
            # CORS: echo allowed dev origins for this server PORT (see http_security.cors_allow_origin_value)
            origin = self.headers.get('Origin', '')
            cval = http_security.cors_allow_origin_value(
                origin if origin else None,
                config.PORT,
                self.headers.get('Host'),
            )
            if cval is not None:
                self.send_header('Access-Control-Allow-Origin', cval)
        
            # Cache Transformers.js file aggressively (it's a large library)
            if getattr(self, '_static_long_cache', False):
                self.send_header('Cache-Control', 'public, max-age=86400, must-revalidate')
                self._static_long_cache = False
            elif self.path.endswith('transformers.js'):
                self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
                self.send_header('Pragma', 'public')
            else:
                parsed = urlparse(self.path)
                p = parsed.path.split('?')[0].lower()
                if p.endswith(('.js', '.mjs', '.css', '.png', '.svg', '.ico', '.webp', '.woff', '.woff2', '.json', '.wasm')) and not p.endswith('index.html'):
                    self.send_header('Cache-Control', 'public, max-age=86400, must-revalidate')
                else:
                    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    self.send_header('Pragma', 'no-cache')
                    self.send_header('Expires', '0')
        
            super().end_headers()
    
        def guess_type(self, path):
            """Override to set correct MIME types"""
            # Ensure JavaScript files are served with correct MIME type
            if path.endswith('.mjs'):
                return 'application/javascript'
            if path.endswith('.js'):
                return 'application/javascript'
            if path.endswith('.wasm'):
                return 'application/wasm'
            if path.endswith('.json'):
                return 'application/json'
            if path.endswith('.css'):
                return 'text/css'
            if path.endswith('.html'):
                return 'text/html'
        
            # For other files, use parent's guess_type
            return super().guess_type(path)

