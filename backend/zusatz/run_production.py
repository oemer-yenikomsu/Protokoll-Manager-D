"""
Produktion: Flask-API + gebautes React-Frontend (frontend/dist) auf einem Firmen-PC (Host).
Im Firmennetz (LAN/WLAN) erreichbar unter http://<Host-IP>:5000

Entwicklung bleibt unverändert:
  Backend:  python app.py
  Frontend: npm run dev  (im Ordner frontend)
"""
import os
import socket
from pathlib import Path

from flask import send_from_directory, abort
from waitress import serve

from app import app
from zusatz.schema_migrate import ensure_benutzer_schema

ROOT = Path(__file__).resolve().parent.parent.parent
DIST = ROOT / 'frontend' / 'dist'


def _frontend_ready() -> bool:
    return DIST.is_dir() and (DIST / 'index.html').is_file()


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """SPA + statische Assets; /api/* wird von den API-Routen bedient."""
    if path.startswith('api'):
        abort(404)
    if not _frontend_ready():
        abort(
            503,
            'Frontend nicht gebaut. Im Ordner frontend ausführen: npm install && npm run build',
        )
    if path:
        file_path = DIST / path
        if file_path.is_file():
            return send_from_directory(DIST, path)
        index_in_dir = DIST / path.strip('/') / 'index.html'
        if index_in_dir.is_file():
            return send_from_directory(DIST, f'{path.strip("/")}/index.html')
    return send_from_directory(DIST, 'index.html')


def _lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('10.255.255.255', 1))
            return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'


def main():
    ensure_benutzer_schema(app)
    port = int(os.getenv('PORT', '5000'))
    host = os.getenv('HOST', '0.0.0.0')

    if not _frontend_ready():
        print('FEHLER: frontend/dist fehlt.')
        print('Bitte einmal bauen:  cd frontend  &&  npm install  &&  npm run build')
        raise SystemExit(1)

    ip = _lan_ip()
    print('Protokoll-Manager – Produktionsmodus')
    print(f'  Lokal:    http://127.0.0.1:{port}')
    print(f'  Im Firmennetz: http://{ip}:{port}')
    print('  Beenden: Strg+C')
    print('  Entwicklung weiter mit: python app.py  +  npm run dev')
    serve(app, host=host, port=port, threads=4)


if __name__ == '__main__':
    main()
