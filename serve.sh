#!/bin/bash
# Simple local server for development with byte-range support for audio/video seeking

echo "🌸 Starting Kaixin local server (no-cache + byte-range support)..."
echo "📍 Open: http://localhost:8000/index.html"
echo "⏹  Press Ctrl+C to stop"
echo ""

# Launch a Python server with no-cache headers AND byte-range support for HTML5 audio/video
python3 - <<'PY'
import http.server, socketserver

class MediaRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # No-cache headers for development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # Enable byte-range requests for HTML5 audio/video seeking
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

PORT = 8000
# Use ThreadingTCPServer for better handling of range requests
with socketserver.ThreadingTCPServer(("", PORT), MediaRequestHandler) as httpd:
    print(f"Serving HTTP on :: port {PORT} (http://[::]:{PORT}/) ...")
    print(f"✓ Byte-range support enabled for audio/video seeking")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
PY

