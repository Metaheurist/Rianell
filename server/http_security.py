"""
HTTP security helpers: loopback checks, CORS, simple rate limiting.
"""
from __future__ import annotations

import ipaddress
import time
from collections import defaultdict
from threading import Lock
from typing import Optional, Tuple


def is_loopback_ip(ip: str) -> bool:
    """True if ip is IPv4/IPv6 loopback (handles ::ffff:127.0.0.1 style)."""
    if not ip:
        return False
    s = ip.strip()
    if s.startswith("::ffff:"):
        s = s.split("::ffff:", 1)[1]
    if "%" in s:
        s = s.split("%", 1)[0]
    try:
        return ipaddress.ip_address(s).is_loopback
    except ValueError:
        return False


def client_may_access_sensitive_apis(client_ip: str, sensitive_apis_on_lan: bool) -> bool:
    if is_loopback_ip(client_ip):
        return True
    return bool(sensitive_apis_on_lan)


def cors_allow_origin_value(
    origin: Optional[str],
    port: int,
    host_header: Optional[str] = None,
) -> Optional[str]:
    """
    Value for Access-Control-Allow-Origin.
    None = omit header (typical same-origin navigation).
    'null' = explicit null origin for disallowed cross-origin.
    Otherwise echo a single allowed origin string.

    When the browser loads the app via a LAN IP or hostname (Host header), same-origin
    requests send Origin matching http(s)://<Host>; we allow that echo so dev works on phones.
    """
    if not origin:
        return None
    allowed = (
        f"http://localhost:{port}",
        f"http://127.0.0.1:{port}",
        f"http://[::1]:{port}",
    )
    if origin in allowed:
        return origin
    if host_header:
        h = host_header.strip()
        for scheme in ("http", "https"):
            base = f"{scheme}://{h}"
            if origin == base or origin.rstrip("/") == base:
                return origin
    return "null"


class SimpleRateLimiter:
    """Fixed window rate limiter per key (e.g. client IP)."""

    def __init__(self, max_events: int = 120, window_seconds: float = 60.0):
        self.max_events = max_events
        self.window_seconds = window_seconds
        self._times: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            times = self._times[key]
            cutoff = now - self.window_seconds
            times[:] = [t for t in times if t > cutoff]
            if len(times) >= self.max_events:
                return False
            times.append(now)
            return True


# Shared limiters (imported by main)
sensitive_api_limiter = SimpleRateLimiter(max_events=60, window_seconds=60.0)
client_log_limiter = SimpleRateLimiter(max_events=300, window_seconds=60.0)
bug_report_limiter = SimpleRateLimiter(max_events=5, window_seconds=86400.0)
