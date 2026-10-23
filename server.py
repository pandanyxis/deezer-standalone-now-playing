"""Local Deezer bridge. Python 3, standard library only."""
import json
import time
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
PORT = 1610
state = {}
updated = 0
lock = threading.Lock()


def save_state(data):
    temporary = ROOT / 'now-playing.json.tmp'
    temporary.write_text(json.dumps(data, ensure_ascii=False, allow_nan=False, indent=2), encoding='utf-8')
    temporary.replace(ROOT / 'now-playing.json')


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, code, body, kind='application/json; charset=utf-8'):
        self.send_response(code)
        self.send_header('Content-Type', kind)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        global state, updated
        if self.path != '/update':
            return self.reply(404, b'{}')
        origin = self.headers.get('Origin', '')
        if origin and origin not in ('https://www.deezer.com', 'http://www.deezer.com'):
            return self.reply(403, b'{}')
        if not self.headers.get('Content-Type', '').startswith('application/json'):
            return self.reply(415, b'{}')
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 65536:
                raise ValueError('size')
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict) or data.get('status') not in ('playing', 'paused', 'stopped'):
                raise ValueError('data')
            if not isinstance(data.get('title', ''), str) or not isinstance(data.get('artists', []), list):
                raise ValueError('metadata')
            for field in ('progress', 'duration'):
                value = data.get(field)
                if value is not None and (type(value) not in (int, float) or not 0 <= value < 1e12):
                    raise ValueError('time')
            with lock:
                save_state(data)
                first = not state
                changed = any(data.get(field) != state.get(field) for field in ('title', 'artists', 'status'))
                state, updated = data, time.monotonic()
            if first or changed:
                artists = ', '.join(str(artist) for artist in data.get('artists', [])) or '(no artist)'
                print(f"Received from Deezer: {data.get('status')} | {data.get('title') or '(no title)'} | {artists}", flush=True)
            self.reply(200, b'{"ok":true}')
        except OSError as error:
            print(f'Cannot update now-playing.json: {error}', flush=True)
            self.reply(500, b'{"ok":false}')
        except (ValueError, TypeError):
            self.reply(400, b'{"ok":false}')

    def do_GET(self):
        route = urlsplit(self.path).path
        if route in ('/state', '/now-playing.json'):
            with lock:
                data = dict(state)
                age = time.monotonic() - updated
            if not data or age > 15:
                data = {'title': 'Waiting for Deezer...', 'artists': ['Open Deezer with the userscript enabled'], 'status': 'stopped', 'progress': None, 'duration': None}
            elif data.get('status') == 'playing' and data.get('progress') is not None:
                data['progress'] += round(age * 1000)
                if data.get('duration'):
                    data['progress'] = min(data['progress'], data['duration'])
            return self.reply(200, json.dumps(data, allow_nan=False).encode())
        name = 'index.html' if route == '/' else route.lstrip('/')
        allowed = {'index.html', 'overlay.js', 'Deezer-Standalone.user.js', 'Now-Playing-Ultra-Minimal-Flat.html', 'Now-Playing-Ultra-Minimal-Glass.html', 'Now-Playing-Ultra-Minimal-Tiny-Corner.html'}
        if name not in allowed:
            return self.reply(404, b'{}')
        kind = 'text/javascript; charset=utf-8' if name.endswith('.js') else 'text/html; charset=utf-8'
        self.reply(200, (ROOT / name).read_bytes(), kind)


if __name__ == '__main__':
    try:
        server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    except OSError as error:
        print(f'Cannot open port {PORT}: {error}')
        raise SystemExit(1)
    save_state({'title': '', 'artists': [], 'status': 'stopped', 'progress': None, 'duration': None})
    print(f'Deezer Standalone: http://127.0.0.1:{PORT}/\nKeep this window open. Press Ctrl+C to stop.\nWaiting for the userscript in Deezer...\nJSON file: {ROOT / "now-playing.json"}', flush=True)
    webbrowser.open(f'http://127.0.0.1:{PORT}/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
