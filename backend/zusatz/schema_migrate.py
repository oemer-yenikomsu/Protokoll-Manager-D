"""SQLite-Schema: Benutzer-Tabelle und Audit-Felder (getrennt von Person)."""
from datetime import datetime

from sqlalchemy import inspect, text

from kern.modelle import db, Benutzer, Protokoll, Eintrag, Kommentar
from zusatz.auth_util import hash_password
from zusatz.roles import (
    ROLLE_USER, ROLLE_MITARBEITER, ROLLE_ADMIN, ROLLE_DEVELOPER, ROLLE_MASTERDEVELOPER,
    normalize_rolle,
)

DEMO_ROLLEN_BENUTZER = [
    (1, 'user', 'Benutzer', ROLLE_USER),
    (2, 'mitarbeiter', 'Mitarbeiter', ROLLE_MITARBEITER),
    (3, 'admin', 'Administrator', ROLLE_ADMIN),
    (4, 'developer', 'Developer', ROLLE_DEVELOPER),
    (5, 'master', 'Master Developer', ROLLE_MASTERDEVELOPER),
]

LEGACY_BENUTZER_RENAMES = {
    'demouser': ('user', 'Benutzer'),
    'demo': ('user', 'Benutzer'),
    'demomitarbeiter': ('mitarbeiter', 'Mitarbeiter'),
    'demoadmin': ('admin', 'Administrator'),
    'demo_admin': ('admin', 'Administrator'),
    'demodeveloper': ('developer', 'Developer'),
    'demomaster': ('master', 'Master Developer'),
}

DEMO_PASSWORD = 'Demo2026!'


def _table_exists(insp, name):
    return name in insp.get_table_names()


def _column_names(insp, table):
    return {c['name'] for c in insp.get_columns(table)}


LEGACY_UNUSED_LOGINS = (
    'demo', 'alice', 'bob', 'carol', 'dave', 'demo_admin',
    'demouser', 'demomitarbeiter', 'demoadmin', 'demodeveloper', 'demomaster',
)


def _benutzer_usage_count(benutzer_id: int) -> int:
    n = Protokoll.query.filter(
        (Protokoll.autor_id == benutzer_id) | (Protokoll.bearbeitet_von_id == benutzer_id)
    ).count()
    n += Eintrag.query.filter(
        (Eintrag.erstellt_von_id == benutzer_id) | (Eintrag.bearbeitet_von_id == benutzer_id)
    ).count()
    n += Kommentar.query.filter_by(autor_id=benutzer_id).count()
    return n


def _remove_obsolete_demo_accounts():
    """Alte Demo-Konten löschen, wenn unbenutzt und Ersatz existiert."""
    canonical = {login for _, login, _, _ in DEMO_ROLLEN_BENUTZER}
    if not all(
        Benutzer.query.filter(db.func.lower(Benutzer.benutzername) == n.lower()).first()
        for n in canonical
    ):
        return
    for login in LEGACY_UNUSED_LOGINS:
        u = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == login.lower()
        ).first()
        if u and _benutzer_usage_count(u.benutzer_id) == 0:
            db.session.delete(u)
    db.session.commit()


def _dedupe_standard_benutzer():
    """Entfernt unbenutzte Namens-Duplikate (z. B. user@12 + demouser@7)."""
    for _, login, _, _ in DEMO_ROLLEN_BENUTZER:
        users = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == login.lower()
        ).order_by(Benutzer.benutzer_id).all()
        if len(users) <= 1:
            continue
        users.sort(key=lambda u: (-_benutzer_usage_count(u.benutzer_id), u.benutzer_id))
        for u in users[1:]:
            if _benutzer_usage_count(u.benutzer_id) == 0:
                db.session.delete(u)
    db.session.commit()


def _rename_legacy_benutzer():
    for old, (new, anzeige) in LEGACY_BENUTZER_RENAMES.items():
        u = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == old.lower()
        ).first()
        if not u:
            continue
        taken = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == new.lower(),
            Benutzer.benutzer_id != u.benutzer_id,
        ).first()
        if taken:
            if _benutzer_usage_count(taken.benutzer_id) == 0:
                db.session.delete(taken)
                db.session.flush()
            else:
                continue
        u.benutzername = new
        u.anzeigename = anzeige
    db.session.commit()


def _add_demo_benutzer(bid: int, login: str, anzeige: str, rolle: str, pw_hash: str):
    if Benutzer.query.filter(
        db.func.lower(Benutzer.benutzername) == login.lower()
    ).first():
        return
    if not Benutzer.query.get(bid):
        db.session.add(Benutzer(
            benutzer_id=bid,
            benutzername=login,
            anzeigename=anzeige,
            passwort_hash=pw_hash,
            rolle=rolle,
        ))
        return
    db.session.add(Benutzer(
        benutzername=login,
        anzeigename=anzeige,
        passwort_hash=pw_hash,
        rolle=rolle,
    ))


def _seed_benutzer(pw_hash: str):
    for bid, login, anzeige, rolle in DEMO_ROLLEN_BENUTZER:
        _add_demo_benutzer(bid, login, anzeige, rolle, pw_hash)
    db.session.commit()


def _ensure_demo_rollen_benutzer(pw_hash: str):
    """Demo-Konten nachziehen bzw. Rolle aktualisieren (bestehende DBs)."""
    for bid, login, anzeige, rolle in DEMO_ROLLEN_BENUTZER:
        by_name = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == login.lower()
        ).first()
        if by_name:
            if normalize_rolle(by_name.rolle) != rolle:
                by_name.rolle = rolle
            continue
        _add_demo_benutzer(bid, login, anzeige, rolle, pw_hash)
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
    for bid, login, anzeige, rolle in DEMO_ROLLEN_BENUTZER:
        by_name = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == login.lower()
        ).first()
        if by_name:
            if normalize_rolle(getattr(by_name, 'rolle', None)) != rolle:
                by_name.rolle = rolle
            continue
        _add_demo_benutzer(bid, login, anzeige, rolle, pw_hash)
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

        _rename_legacy_benutzer()
        _dedupe_standard_benutzer()
        _remove_obsolete_demo_accounts()
        _seed_benutzer(pw_hash)
        _ensure_demo_rollen_benutzer(pw_hash)

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

        from zusatz.seed_demo_daten import seed_demo_daten_if_empty
        seed_demo_daten_if_empty()
