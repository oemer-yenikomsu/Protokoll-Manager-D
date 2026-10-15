"""Demo-Stammdaten und Beispiel-Protokolle (idempotent, nur wenn noch leer)."""
from datetime import datetime, date

from kern.modelle import (
    db, Benutzer, Organisation, Person, Projektart, Projekt, Prozessschritt,
    Prozessunterschritt, Protokoll, Eintrag, EintragPerson, Kommentar, Lookup,
)


def _benutzer_id(*namen: str) -> int:
    for name in namen:
        u = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == name.lower()
        ).first()
        if u:
            return u.benutzer_id
    first = Benutzer.query.order_by(Benutzer.benutzer_id).first()
    if not first:
        raise RuntimeError('Kein Benutzer in der Datenbank – Demo-Daten können nicht angelegt werden.')
    return first.benutzer_id


def seed_demo_daten_if_empty() -> bool:
    """Legt fiktive Demo-Daten an, wenn noch keine Protokolle existieren."""
    if Protokoll.query.count() > 0:
        return False

    autor_id = _benutzer_id('user')
    kommentar_autor_id = _benutzer_id('developer', 'user')

    db.session.add_all([
        Organisation(org_id=1, name='Acme GmbH'),
        Organisation(org_id=2, name='Acme Solar'),
        Organisation(org_id=3, name='Acme Energy'),
        Organisation(org_id=4, name='Stadtplanung Mitte'),
        Organisation(org_id=5, name='SubTech GmbH'),
        Organisation(org_id=6, name='ModulHersteller AG'),
    ])

    t_alt = datetime(2020, 1, 1, 12, 0, 0)
    db.session.add_all([
        Person(person_id=1, vorname='Max', nachname='Mustermann', org_id=1, erstellt_am=t_alt),
        Person(person_id=2, vorname='Anna', nachname='Schmidt', org_id=2, erstellt_am=t_alt),
        Person(person_id=3, vorname='Thomas', nachname='Müller', org_id=5, erstellt_am=t_alt),
        Person(person_id=4, vorname='Lisa', nachname='Weber', org_id=2, erstellt_am=t_alt),
        Person(person_id=5, vorname='Sven', nachname='Jansen', org_id=6, erstellt_am=t_alt),
    ])

    db.session.add_all([
        Projektart(projektart_id=1, bezeichnung='Allgemein'),
        Projektart(projektart_id=2, bezeichnung='Acme'),
        Projektart(projektart_id=3, bezeichnung='Acme Solar'),
        Projektart(projektart_id=4, bezeichnung='Acme Energy'),
        Projektart(projektart_id=5, bezeichnung='Undefiniert'),
    ])

    db.session.add_all([
        Projekt(projekt_id=1, bezeichnung='Solarpark Alpha', projektart_id=3),
        Projekt(projekt_id=2, bezeichnung='Dachanlage Logistikzentrum', projektart_id=3),
    ])

    db.session.add_all([
        Prozessschritt(schritt_id=1, projektart_id=3, bezeichnung='1. Planungsphase'),
        Prozessschritt(schritt_id=2, projektart_id=3, bezeichnung='2. Bauphase'),
        Prozessschritt(schritt_id=3, projektart_id=3, bezeichnung='1. Akquise'),
    ])

    db.session.add_all([
        Prozessunterschritt(unterschritt_id=1, schritt_id=1, bezeichnung='1.1 Standortanalyse'),
        Prozessunterschritt(unterschritt_id=2, schritt_id=1, bezeichnung='1.2 Genehmigungsverfahren'),
        Prozessunterschritt(unterschritt_id=3, schritt_id=2, bezeichnung='2.1 Fundamentbau'),
    ])

    db.session.add_all([
        Protokoll(protokoll_id=101, datum=date(2026, 5, 8), ort='Messe München (Intersolar)', typ='Messe', autor_id=autor_id, erstellt_am=datetime(2026, 5, 8, 18, 30)),
        Protokoll(protokoll_id=102, datum=date(2026, 5, 10), ort='Büro / Telefon', typ='Telefonat', autor_id=autor_id, erstellt_am=datetime(2026, 5, 10, 14, 15)),
        Protokoll(protokoll_id=103, datum=date(2026, 5, 12), ort='Baustelle Alpha', typ='Vor-Ort-Termin', autor_id=autor_id, erstellt_am=datetime(2026, 5, 12, 9, 0)),
    ])
    db.session.flush()

    t_e1 = datetime(2026, 5, 8, 18, 35)
    t_e2 = datetime(2026, 5, 10, 14, 20)
    t_e3 = datetime(2026, 5, 12, 9, 5)
    db.session.add_all([
        Eintrag(eintrag_id=1, protokoll_id=101, thema='Neue Modulgeneration',
                text='Vorstellung der neuen 600W Module. Preise ab Q3 verfügbar.',
                aufgaben=[{'text': 'Angebot für Q3 anfordern.', 'status': 'Offen'}],
                projekt_id=None, schritt_id=None, unterschritt_id=None,
                erstellt_von_id=autor_id, erstellt_am=t_e1),
        Eintrag(eintrag_id=2, protokoll_id=101, thema='Lieferengpass Wechselrichter',
                text='SubTech meldet Verzögerungen bei der Lieferung für Solarpark Alpha.',
                aufgaben=[{'text': 'Alternativen prüfen.', 'status': 'In Bearbeitung'}],
                projekt_id=1, schritt_id=2, unterschritt_id=3,
                erstellt_von_id=autor_id, erstellt_am=t_e1),
        Eintrag(eintrag_id=3, protokoll_id=102, thema='Baugenehmigung Logistikzentrum',
                text='Rückfrage vom Bauamt bzgl. Statikgutachten.',
                aufgaben=[{'text': 'Gutachten per Mail nachreichen.', 'status': 'Geplant'}],
                projekt_id=2, schritt_id=3, unterschritt_id=None,
                erstellt_von_id=autor_id, erstellt_am=t_e2),
        Eintrag(eintrag_id=4, protokoll_id=103, thema='Fundamentbau Kontrolle',
                text='Alles nach Plan. Keine weiteren Aufgaben.',
                aufgaben=[],
                projekt_id=1, schritt_id=2, unterschritt_id=3,
                erstellt_von_id=autor_id, erstellt_am=t_e3),
        Eintrag(eintrag_id=5, protokoll_id=103, thema='Abschlussbesprechung',
                text='Erste Phase erfolgreich beendet.',
                aufgaben=[{'text': 'Protokoll ablegen.', 'status': 'Erledigt'}],
                projekt_id=1, schritt_id=2, unterschritt_id=None,
                erstellt_von_id=autor_id, erstellt_am=t_e3),
    ])
    db.session.flush()

    db.session.add_all([
        EintragPerson(eintrag_id=1, person_id=1, joined_at='10:00'),
        EintragPerson(eintrag_id=1, person_id=5, joined_at='10:05'),
        EintragPerson(eintrag_id=2, person_id=1, joined_at='13:30'),
        EintragPerson(eintrag_id=2, person_id=4, joined_at='13:30'),
        EintragPerson(eintrag_id=2, person_id=3, joined_at='13:35'),
        EintragPerson(eintrag_id=3, person_id=1, joined_at='09:15'),
        EintragPerson(eintrag_id=3, person_id=2, joined_at='09:15'),
        EintragPerson(eintrag_id=4, person_id=1, joined_at='09:00'),
        EintragPerson(eintrag_id=5, person_id=1, joined_at='10:00'),
    ])

    db.session.add(Kommentar(
        kommentar_id=1, eintrag_id=1,
        text='Habe das Angebot für die 600W Module direkt online angefragt.',
        autor_id=kommentar_autor_id, erstellt_am=datetime(2026, 5, 9, 9, 15),
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
    return True
