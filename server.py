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
from pathlib import Path

# Configuration
PORT = 8080
HOST = ""  # Empty string means bind to all interfaces (0.0.0.0), accessible over LAN

class HealthAppHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to set proper MIME types and handle SPA routing"""
    
    def end_headers(self):
        # Add CORS headers if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        
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

def main():
    """Start the web server"""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    server_url = f"http://{HOST}:{PORT}"
    
    # Create server with error handling
    try:
        httpd = socketserver.TCPServer((HOST, PORT), HealthAppHandler)
    except OSError as e:
        if "Address already in use" in str(e) or "Only one usage" in str(e):
            print(f"Error: Port {PORT} is already in use.")
            print(f"Please close the application using port {PORT} or change the PORT in server.py")
            sys.exit(1)
        else:
            print(f"Error starting server: {e}")
            sys.exit(1)
    
    # Allow address reuse to prevent "Address already in use" errors
    httpd.allow_reuse_address = True
    
    # Get local IP addresses for LAN access
    def get_local_ip():
        """Get the local IP address of this machine"""
        try:
            # Connect to a remote address to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
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
    print("=" * 60)
    print("\nPress Ctrl+C to stop the server\n")
    
    # Try to open browser automatically
    try:
        webbrowser.open(server_url)
        print(f"Opening browser at {server_url}...")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print(f"Please open {server_url} manually in your browser")
    
    # Start serving
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
        print("Goodbye!")
        httpd.shutdown()
        sys.exit(0)

if __name__ == "__main__":
    main()
