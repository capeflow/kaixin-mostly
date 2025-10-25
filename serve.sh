#!/bin/bash
# Simple local server for development

echo "🌸 Starting Kaixin local server (no-cache)..."
echo "📍 Open: http://localhost:8000/index.html"
echo "⏹  Press Ctrl+C to stop"
echo ""

# Launch a simple Python server with no-cache headers to avoid 304 during dev
python3 - <<'PY'
import http.server, socketserver

class NoCacheRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 8000
with socketserver.TCPServer(("", PORT), NoCacheRequestHandler) as httpd:
    print(f"Serving HTTP on :: port {PORT} (http://[::]:{PORT}/) ...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
PY

