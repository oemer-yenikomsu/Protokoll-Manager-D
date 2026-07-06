"""SQLite-Schema: Benutzer-Tabelle und Audit-Felder (getrennt von Person)."""
from datetime import datetime

from sqlalchemy import inspect, text

from kern.modelle import db, Benutzer
from zusatz.auth_util import hash_password
from zusatz.roles import ROLLE_USER, normalize_rolle


DEFAULT_BENUTZER = [
    (1, 'demo', 'Demo Benutzer', ROLLE_USER),
    (2, 'alice', 'Alice', ROLLE_USER),
    (3, 'bob', 'Bob', ROLLE_USER),
    (4, 'carol', 'Carol', ROLLE_USER),
    (5, 'dave', 'Dave', ROLLE_USER),
]

TEST_ROLLEN_BENUTZER = [
    (6, 'demo_admin', 'Demo Admin', ROLLE_USER),
]

DEMO_PASSWORD = 'Demo2026!'


def _table_exists(insp, name):
    return name in insp.get_table_names()


def _column_names(insp, table):
    return {c['name'] for c in insp.get_columns(table)}


def _seed_benutzer(pw_hash: str):
    for bid, login, anzeige, rolle in DEFAULT_BENUTZER + TEST_ROLLEN_BENUTZER:
        if Benutzer.query.get(bid):
            continue
        db.session.add(Benutzer(
            benutzer_id=bid,
            benutzername=login,
            anzeigename=anzeige,
            passwort_hash=pw_hash,
            rolle=rolle,
        ))
    db.session.commit()


def _ensure_rolle_column():
    insp = inspect(db.engine)
    if 'benutzer' not in insp.get_table_names():
        return
    cols = _column_names(insp, 'benutzer')
    if 'rolle' not in cols:
        with db.engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE benutzer ADD COLUMN rolle VARCHAR(30) NOT NULL DEFAULT 'user'"
            ))
        db.session.remove()
    pw_hash = hash_password(DEMO_PASSWORD)
    for bid, login, anzeige, rolle in TEST_ROLLEN_BENUTZER:
        by_name = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == login.lower()
        ).first()
        if by_name:
            if normalize_rolle(getattr(by_name, 'rolle', None)) != rolle:
                by_name.rolle = rolle
            continue
        if Benutzer.query.get(bid):
            continue
        db.session.add(Benutzer(
            benutzer_id=bid,
            benutzername=login,
            anzeigename=anzeige,
            passwort_hash=pw_hash,
            rolle=rolle,
        ))
    for u in Benutzer.query.all():
        if not getattr(u, 'rolle', None):
            u.rolle = ROLLE_USER
    db.session.commit()


def _rebuild_protokoll_for_benutzer_fk(conn):
    conn.execute(text('''
        CREATE TABLE IF NOT EXISTS protokoll_new (
            protokoll_id INTEGER PRIMARY KEY,
            datum DATE NOT NULL,
            ort VARCHAR(300),
            typ VARCHAR(100) NOT NULL,
            autor_id INTEGER NOT NULL REFERENCES benutzer(benutzer_id),
            erstellt_am DATETIME NOT NULL,
            bearbeitet_von_id INTEGER REFERENCES benutzer(benutzer_id),
            bearbeitet_am DATETIME
        )
    '''))
    conn.execute(text('''
        INSERT INTO protokoll_new (protokoll_id, datum, ort, typ, autor_id, erstellt_am, bearbeitet_von_id, bearbeitet_am)
        SELECT protokoll_id, datum, ort, typ, autor_id, erstellt_am, NULL, NULL FROM protokoll
    '''))
    conn.execute(text('DROP TABLE protokoll'))
    conn.execute(text('ALTER TABLE protokoll_new RENAME TO protokoll'))


def _rebuild_kommentar_for_benutzer_fk(conn):
    conn.execute(text('''
        CREATE TABLE IF NOT EXISTS kommentar_new (
            kommentar_id INTEGER PRIMARY KEY,
            eintrag_id INTEGER NOT NULL REFERENCES eintrag(eintrag_id),
            text TEXT NOT NULL,
            autor_id INTEGER NOT NULL REFERENCES benutzer(benutzer_id),
            erstellt_am DATETIME NOT NULL
        )
    '''))
    conn.execute(text('''
        INSERT INTO kommentar_new (kommentar_id, eintrag_id, text, autor_id, erstellt_am)
        SELECT kommentar_id, eintrag_id, text, autor_id, erstellt_am FROM kommentar
    '''))
    conn.execute(text('DROP TABLE kommentar'))
    conn.execute(text('ALTER TABLE kommentar_new RENAME TO kommentar'))


def ensure_benutzer_schema(app):
    """Idempotente Migration für bestehende protokoll.db."""
    with app.app_context():
        insp = inspect(db.engine)
        tables = set(insp.get_table_names())
        pw_hash = hash_password(DEMO_PASSWORD)

        if 'benutzer' not in tables:
            db.create_all()
            tables = set(inspect(db.engine).get_table_names())

        # Vor jedem Benutzer-ORM-Zugriff (Model enthält „rolle“)
        _ensure_rolle_column()

        if Benutzer.query.count() == 0:
            _seed_benutzer(pw_hash)

        if 'protokoll' in tables:
            pcols = _column_names(insp, 'protokoll')
            with db.engine.begin() as conn:
                if 'bearbeitet_von_id' not in pcols:
                    conn.execute(text(
                        'ALTER TABLE protokoll ADD COLUMN bearbeitet_von_id INTEGER'
                    ))
                    conn.execute(text(
                        'ALTER TABLE protokoll ADD COLUMN bearbeitet_am DATETIME'
                    ))
                # FK von person → benutzer: Tabelle neu aufsetzen (SQLite)
                fk_rows = conn.execute(text('PRAGMA foreign_key_list(protokoll)')).fetchall()
                ref_table = fk_rows[0][2] if fk_rows else None
                if ref_table == 'person':
                    _rebuild_protokoll_for_benutzer_fk(conn)

        if 'eintrag' in tables:
            ecols = _column_names(insp, 'eintrag')
            with db.engine.begin() as conn:
                if 'erstellt_von_id' not in ecols:
                    conn.execute(text(
                        'ALTER TABLE eintrag ADD COLUMN erstellt_von_id INTEGER'
                    ))
                    conn.execute(text(
                        'ALTER TABLE eintrag ADD COLUMN erstellt_am DATETIME'
                    ))
                    conn.execute(text(
                        'ALTER TABLE eintrag ADD COLUMN bearbeitet_von_id INTEGER'
                    ))
                    conn.execute(text(
                        'ALTER TABLE eintrag ADD COLUMN bearbeitet_am DATETIME'
                    ))
                    conn.execute(text('''
                        UPDATE eintrag SET erstellt_von_id = (
                            SELECT autor_id FROM protokoll WHERE protokoll.protokoll_id = eintrag.protokoll_id
                        ), erstellt_am = COALESCE(erstellt_am, datetime('now'))
                        WHERE erstellt_von_id IS NULL
                    '''))

        if 'kommentar' in tables:
            insp = inspect(db.engine)
            fk_rows = []
            with db.engine.connect() as c:
                fk_rows = c.execute(text('PRAGMA foreign_key_list(kommentar)')).fetchall()
            ref_table = fk_rows[0][2] if fk_rows else None
            if ref_table == 'person':
                with db.engine.begin() as conn:
                    _rebuild_kommentar_for_benutzer_fk(conn)

        if 'person' in tables:
            cols = _column_names(inspect(db.engine), 'person')
            if 'erstellt_am' not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text('ALTER TABLE person ADD COLUMN erstellt_am DATETIME'))
                    conn.execute(text(
                        "UPDATE person SET erstellt_am = '2000-01-01T00:00:00' "
                        "WHERE erstellt_am IS NULL"
                    ))
