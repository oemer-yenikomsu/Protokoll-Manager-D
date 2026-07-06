"""SQLite-Datenbank-Backup: Download und Import."""
import io
import os
import sqlite3
import tempfile
from datetime import datetime
from pathlib import Path

from flask import send_file, abort, request, jsonify

from config import Config

# Mindest-Tabellen einer Protokoll-Manager-Datenbank
_REQUIRED_TABLES = frozenset({
    'organisation', 'person', 'projektart', 'projekt', 'prozessschritt',
    'prozessunterschritt', 'protokoll', 'eintrag', 'eintrag_person', 'kommentar', 'lookup',
})

_MAX_UPLOAD_BYTES = 80 * 1024 * 1024  # 80 MB


def _sqlite_db_path() -> Path:
    uri = Config.SQLALCHEMY_DATABASE_URI
    if not uri.startswith('sqlite:///'):
        abort(501, 'Backup ist nur für SQLite-Datenbanken verfügbar.')
    raw = uri[len('sqlite:///'):]
    # Windows: sqlite:///C:/... → Path versteht Forward-Slashes
    return Path(raw)


def _validate_sqlite_backup(path: Path) -> tuple[bool, str]:
    try:
        conn = sqlite3.connect(str(path))
        try:
            rows = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
            tables = {r[0] for r in rows}
            missing = _REQUIRED_TABLES - tables
            if missing:
                return False, (
                    'Ungültige Backup-Datei. Fehlende Tabellen: '
                    + ', '.join(sorted(missing))
                )
            return True, ''
        finally:
            conn.close()
    except sqlite3.Error as e:
        return False, f'Keine gültige SQLite-Datei: {e}'


def register_backup_routes(app):
    from models import db  # zirkulär vermeiden bis Route registriert wird

    app.config.setdefault('MAX_CONTENT_LENGTH', _MAX_UPLOAD_BYTES)

    @app.route('/api/backup', methods=['GET'])
    def download_backup():
        db_path = _sqlite_db_path()
        if not db_path.is_file():
            abort(404, 'Datenbankdatei nicht gefunden.')

        filename = f'protokoll_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
        buffer = io.BytesIO()

        # mkstemp: unter Windows darf sqlite die Datei öffnen (kein exklusiver Temp-Handle)
        fd, tmp_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        try:
            src = sqlite3.connect(f'file:{db_path.resolve()}?mode=ro', uri=True)
            try:
                src.execute('PRAGMA wal_checkpoint(TRUNCATE)')
            except sqlite3.Error:
                pass
            dest = sqlite3.connect(tmp_path)
            src.backup(dest)
            src.close()
            dest.close()
            with open(tmp_path, 'rb') as f:
                buffer.write(f.read())
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/x-sqlite3',
            as_attachment=True,
            download_name=filename,
        )

    @app.route('/api/backup/restore', methods=['POST'])
    def restore_backup():
        upload = request.files.get('file')
        if not upload or not upload.filename:
            return jsonify({'message': 'Keine Datei hochgeladen.'}), 400

        raw = upload.read()
        if not raw:
            return jsonify({'message': 'Die Datei ist leer.'}), 400
        if len(raw) > _MAX_UPLOAD_BYTES:
            return jsonify({'message': 'Datei ist zu groß (max. 80 MB).'}), 400

        fd, tmp_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        try:
            with open(tmp_path, 'wb') as f:
                f.write(raw)

            ok, msg = _validate_sqlite_backup(Path(tmp_path))
            if not ok:
                return jsonify({'error': 'invalid_backup', 'message': msg}), 400

            db_path = _sqlite_db_path()
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
            db.session.remove()

            live = sqlite3.connect(str(db_path.resolve()))
            try:
                imported = sqlite3.connect(tmp_path)
                try:
                    imported.backup(live)
                finally:
                    imported.close()
            finally:
                live.close()

            db.engine.dispose()

            return jsonify({
                'success': True,
                'message': 'Backup wurde importiert. Alle bisherigen Daten wurden ersetzt.',
            })
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
