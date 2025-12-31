#!/usr/bin/env python3
"""
Simple HTTP Server for Health App
Serves the Health Dashboard application on http://localhost:8080
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

# Configuration
PORT = 8080
HOST = "localhost"

class HealthAppHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to set proper MIME types and handle SPA routing"""
    
    def end_headers(self):
        # Add CORS headers if needed
        self.send_header('Access-Control-Allow-Origin', '*')
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
    
    print("=" * 60)
    print("Health App Web Server")
    print("=" * 60)
    print(f"Server running at: {server_url}")
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
