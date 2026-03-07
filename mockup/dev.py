import http.server, socketserver, json, os
from pathlib import Path

PORT = 3131

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/version':
            files = list(Path('.').glob('*.html'))
            version = max((f.stat().st_mtime for f in files), default=0)
            body = json.dumps({'version': version}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def log_message(self, fmt, *args):
        pass  # quiet

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f'Serving at http://localhost:{PORT}')
        httpd.serve_forever()
