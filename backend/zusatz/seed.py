"""
Einmalig ausführen: python seed.py
Befüllt die leere DB mit fiktiven Demo-Daten (Portfolio-Version).
"""
from app import app
from models import (db, Benutzer, Organisation, Person, Projektart, Projekt, Prozessschritt,
                    Prozessunterschritt, Protokoll, Eintrag, EintragPerson,
                    Kommentar, Lookup)
from zusatz.auth_util import hash_password
from datetime import datetime, date

DEMO_PASSWORD = 'Demo2026!'

with app.app_context():
    db.drop_all()
    db.create_all()

    # Organisationen (fiktiv)
    orgs = [
        Organisation(org_id=1, name='Acme GmbH'),
        Organisation(org_id=2, name='Acme Solar'),
        Organisation(org_id=3, name='Acme Energy'),
        Organisation(org_id=4, name='Stadtplanung Mitte'),
        Organisation(org_id=5, name='SubTech GmbH'),
        Organisation(org_id=6, name='ModulHersteller AG'),
    ]
    db.session.add_all(orgs)

    pw = hash_password(DEMO_PASSWORD)
    benutzer = [
        Benutzer(benutzer_id=1, benutzername='demo', anzeigename='Demo Benutzer', passwort_hash=pw, rolle='user'),
        Benutzer(benutzer_id=2, benutzername='alice', anzeigename='Alice', passwort_hash=pw, rolle='user'),
        Benutzer(benutzer_id=3, benutzername='bob', anzeigename='Bob', passwort_hash=pw, rolle='user'),
        Benutzer(benutzer_id=4, benutzername='carol', anzeigename='Carol', passwort_hash=pw, rolle='user'),
        Benutzer(benutzer_id=5, benutzername='dave', anzeigename='Dave', passwort_hash=pw, rolle='user'),
        Benutzer(benutzer_id=6, benutzername='demo_admin', anzeigename='Demo Admin', passwort_hash=pw, rolle='admin'),
    ]
    db.session.add_all(benutzer)

    t_alt = datetime(2020, 1, 1, 12, 0, 0)
    persons = [
        Person(person_id=1, vorname='Max', nachname='Mustermann', org_id=1, erstellt_am=t_alt),
        Person(person_id=2, vorname='Anna', nachname='Schmidt', org_id=2, erstellt_am=t_alt),
        Person(person_id=3, vorname='Thomas', nachname='Müller', org_id=5, erstellt_am=t_alt),
        Person(person_id=4, vorname='Lisa', nachname='Weber', org_id=2, erstellt_am=t_alt),
        Person(person_id=5, vorname='Sven', nachname='Jansen', org_id=6, erstellt_am=t_alt),
    ]
    db.session.add_all(persons)

    projektarten = [
        Projektart(projektart_id=1, bezeichnung='Allgemein'),
        Projektart(projektart_id=2, bezeichnung='Acme'),
        Projektart(projektart_id=3, bezeichnung='Acme Solar'),
        Projektart(projektart_id=4, bezeichnung='Acme Energy'),
        Projektart(projektart_id=5, bezeichnung='Undefiniert'),
    ]
    db.session.add_all(projektarten)

    projekte = [
        Projekt(projekt_id=1, bezeichnung='Solarpark Alpha', projektart_id=3),
        Projekt(projekt_id=2, bezeichnung='Dachanlage Logistikzentrum', projektart_id=3),
    ]
    db.session.add_all(projekte)

    schritte = [
        Prozessschritt(schritt_id=1, projektart_id=3, bezeichnung='1. Planungsphase'),
        Prozessschritt(schritt_id=2, projektart_id=3, bezeichnung='2. Bauphase'),
        Prozessschritt(schritt_id=3, projektart_id=3, bezeichnung='1. Akquise'),
    ]
    db.session.add_all(schritte)

    unterschritte = [
        Prozessunterschritt(unterschritt_id=1, schritt_id=1, bezeichnung='1.1 Standortanalyse'),
        Prozessunterschritt(unterschritt_id=2, schritt_id=1, bezeichnung='1.2 Genehmigungsverfahren'),
        Prozessunterschritt(unterschritt_id=3, schritt_id=2, bezeichnung='2.1 Fundamentbau'),
    ]
    db.session.add_all(unterschritte)

    protokolle = [
        Protokoll(protokoll_id=101, datum=date(2026, 5, 8), ort='Messe München (Intersolar)', typ='Messe', autor_id=1, erstellt_am=datetime(2026, 5, 8, 18, 30)),
        Protokoll(protokoll_id=102, datum=date(2026, 5, 10), ort='Büro / Telefon', typ='Telefonat', autor_id=1, erstellt_am=datetime(2026, 5, 10, 14, 15)),
        Protokoll(protokoll_id=103, datum=date(2026, 5, 12), ort='Baustelle Alpha', typ='Vor-Ort-Termin', autor_id=1, erstellt_am=datetime(2026, 5, 12, 9, 0)),
    ]
    db.session.add_all(protokolle)
    db.session.flush()

    t_e1 = datetime(2026, 5, 8, 18, 35)
    t_e2 = datetime(2026, 5, 10, 14, 20)
    t_e3 = datetime(2026, 5, 12, 9, 5)
    eintraege = [
        Eintrag(eintrag_id=1, protokoll_id=101, thema='Neue Modulgeneration',
                text='Vorstellung der neuen 600W Module. Preise ab Q3 verfügbar.',
                aufgaben=[{'text': 'Angebot für Q3 anfordern.', 'status': 'Offen'}],
                projekt_id=None, schritt_id=None, unterschritt_id=None,
                erstellt_von_id=1, erstellt_am=t_e1),
        Eintrag(eintrag_id=2, protokoll_id=101, thema='Lieferengpass Wechselrichter',
                text='SubTech meldet Verzögerungen bei der Lieferung für Solarpark Alpha.',
                aufgaben=[{'text': 'Alternativen prüfen.', 'status': 'In Bearbeitung'}],
                projekt_id=1, schritt_id=2, unterschritt_id=3,
                erstellt_von_id=1, erstellt_am=t_e1),
        Eintrag(eintrag_id=3, protokoll_id=102, thema='Baugenehmigung Logistikzentrum',
                text='Rückfrage vom Bauamt bzgl. Statikgutachten.',
                aufgaben=[{'text': 'Gutachten per Mail nachreichen.', 'status': 'Geplant'}],
                projekt_id=2, schritt_id=3, unterschritt_id=None,
                erstellt_von_id=1, erstellt_am=t_e2),
        Eintrag(eintrag_id=4, protokoll_id=103, thema='Fundamentbau Kontrolle',
                text='Alles nach Plan. Keine weiteren Aufgaben.',
                aufgaben=[],
                projekt_id=1, schritt_id=2, unterschritt_id=3,
                erstellt_von_id=1, erstellt_am=t_e3),
        Eintrag(eintrag_id=5, protokoll_id=103, thema='Abschlussbesprechung',
                text='Erste Phase erfolgreich beendet.',
                aufgaben=[{'text': 'Protokoll ablegen.', 'status': 'Erledigt'}],
                projekt_id=1, schritt_id=2, unterschritt_id=None,
                erstellt_von_id=1, erstellt_am=t_e3),
    ]
    db.session.add_all(eintraege)
    db.session.flush()

    eps = [
        EintragPerson(eintrag_id=1, person_id=1, joined_at='10:00'),
        EintragPerson(eintrag_id=1, person_id=5, joined_at='10:05'),
        EintragPerson(eintrag_id=2, person_id=1, joined_at='13:30'),
        EintragPerson(eintrag_id=2, person_id=4, joined_at='13:30'),
        EintragPerson(eintrag_id=2, person_id=3, joined_at='13:35'),
        EintragPerson(eintrag_id=3, person_id=1, joined_at='09:15'),
        EintragPerson(eintrag_id=3, person_id=2, joined_at='09:15'),
        EintragPerson(eintrag_id=4, person_id=1, joined_at='09:00'),
        EintragPerson(eintrag_id=5, person_id=1, joined_at='10:00'),
    ]
    db.session.add_all(eps)

    db.session.add(Kommentar(
        kommentar_id=1, eintrag_id=1,
        text='Habe das Angebot für die 600W Module direkt online angefragt.',
        autor_id=4, erstellt_am=datetime(2026, 5, 9, 9, 15),
    ))

    for wert in ['Besprechung', 'Nachbesprechung', 'Messe', 'Telefonat', 'Vor-Ort-Termin', 'Sonstiges']:
        db.session.add(Lookup(kategorie='typ', wert=wert))
    for wert in ['Messe München (Intersolar)', 'Büro / Telefon', 'Baustelle Alpha']:
        db.session.add(Lookup(kategorie='ort', wert=wert))
    for wert in ['Neue Modulgeneration', 'Lieferengpass Wechselrichter', 'Baugenehmigung Logistikzentrum']:
        db.session.add(Lookup(kategorie='thema', wert=wert))
    for wert in ['Angebot für Q3 anfordern.', 'Alternativen prüfen.', 'Gutachten per Mail nachreichen.']:
        db.session.add(Lookup(kategorie='aufgabe', wert=wert))

    db.session.commit()
    print('Seed erfolgreich abgeschlossen.')
    print(f'Demo-Login: demo / {DEMO_PASSWORD}')
    print(f'Weitere Demo-Benutzer: alice, bob, carol, dave, demo_admin (Passwort: {DEMO_PASSWORD})')
