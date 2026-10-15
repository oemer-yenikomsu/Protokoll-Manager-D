"""
Einmalig ausführen: python seed.py
Befüllt die leere DB mit fiktiven Demo-Daten (Portfolio-Version).
"""
from app import app
from models import db, Benutzer
from zusatz.auth_util import hash_password
from zusatz.seed_demo_daten import seed_demo_daten_if_empty

DEMO_PASSWORD = 'Demo2026!'

with app.app_context():
    db.drop_all()
    db.create_all()

    pw = hash_password(DEMO_PASSWORD)
    benutzer = [
        Benutzer(benutzer_id=1, benutzername='user', anzeigename='Benutzer', passwort_hash=pw, rolle='user'),
        Benutzer(benutzer_id=2, benutzername='mitarbeiter', anzeigename='Mitarbeiter', passwort_hash=pw, rolle='mitarbeiter'),
        Benutzer(benutzer_id=3, benutzername='admin', anzeigename='Administrator', passwort_hash=pw, rolle='admin'),
        Benutzer(benutzer_id=4, benutzername='developer', anzeigename='Developer', passwort_hash=pw, rolle='developer'),
        Benutzer(benutzer_id=5, benutzername='master', anzeigename='Master Developer', passwort_hash=pw, rolle='masterdeveloper'),
    ]
    db.session.add_all(benutzer)
    db.session.commit()

    if not seed_demo_daten_if_empty():
        print('Hinweis: Protokolle existierten bereits – Demo-Inhalte nicht erneut angelegt.')

    print('Seed erfolgreich abgeschlossen.')
    print(f'Logins (Passwort: {DEMO_PASSWORD}):')
    print('  user, mitarbeiter, admin, developer, master')
