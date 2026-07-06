"""
================================================================================
KERN – Datenbank-Modell (SQLite über SQLAlchemy)
================================================================================
Hier stehen nur die Tabellen und to_dict() – keine HTTP-Routen.
Routen und Regeln (z. B. 72 h): kern/server.py

Prüfung mündlich:
  Abschnitt 2 = Login-Benutzer (F09)
  Abschnitt 3 = Stammdaten (Person, Organisation, Projekt …)
  Abschnitt 4 = Protokoll + Eintrag + Kommentar (F01–F02, F04)

Herkunft (grob): Tabellen nach Projektanforderung; Muster aus SQLAlchemy-/Flask-Doku.
================================================================================
"""

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

# --- 1) Datenbank-Verbindung (wird in server.py an Flask gehängt) ---------------
db = SQLAlchemy()


# --- 2) Benutzer für Login (F09) – nicht gleich „Person“ im Gespräch -----------
class Benutzer(db.Model):
    """Anwendungsbenutzer (Login) – getrennt von Person (Gesprächsteilnehmer)."""
    __tablename__ = 'benutzer'
    benutzer_id = db.Column(db.Integer, primary_key=True)
    benutzername = db.Column(db.String(100), nullable=False, unique=True)
    passwort_hash = db.Column(db.String(255), nullable=False)  # NF06: Hash, kein Klartext
    anzeigename = db.Column(db.String(200), nullable=False, default='')
    rolle = db.Column(db.String(30), nullable=False, default='user')

    def to_dict_public(self):
        from zusatz.roles import ROLLE_LABEL, normalize_rolle

        r = normalize_rolle(self.rolle)
        return {
            'benutzer_id': self.benutzer_id,
            'benutzername': self.benutzername,
            'anzeigename': (self.anzeigename or self.benutzername).strip(),
            'rolle': r,
            'rolle_label': ROLLE_LABEL[r],
        }


# --- 3) Stammdaten: Organisation, Person, Projekt-Hierarchie --------------------
class Organisation(db.Model):
    __tablename__ = 'organisation'
    org_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    personen = db.relationship('Person', back_populates='organisation', lazy='dynamic')

    def to_dict(self):
        return {'org_id': self.org_id, 'name': self.name}


class Person(db.Model):
    __tablename__ = 'person'
    person_id = db.Column(db.Integer, primary_key=True)
    vorname = db.Column(db.String(100), nullable=False, default='')
    nachname = db.Column(db.String(100), nullable=False, default='')
    org_id = db.Column(db.Integer, db.ForeignKey('organisation.org_id'), nullable=True)
    erstellt_am = db.Column(db.DateTime, nullable=True)
    organisation = db.relationship('Organisation', back_populates='personen')

    def to_dict(self):
        return {
            'person_id': self.person_id,
            'vorname': self.vorname,
            'nachname': self.nachname,
            'org_id': self.org_id,
            'erstellt_am': self.erstellt_am.isoformat() + 'Z' if self.erstellt_am else None,
        }


class Projektart(db.Model):
    __tablename__ = 'projektart'
    projektart_id = db.Column(db.Integer, primary_key=True)
    bezeichnung = db.Column(db.String(300), nullable=False, unique=True)
    projekte = db.relationship('Projekt', back_populates='projektart', lazy='dynamic')
    schritte = db.relationship(
        'Prozessschritt', back_populates='projektart',
        cascade='all, delete-orphan', lazy='dynamic',
    )

    def to_dict(self):
        return {'projektart_id': self.projektart_id, 'bezeichnung': self.bezeichnung}


class Projekt(db.Model):
    __tablename__ = 'projekt'
    projekt_id = db.Column(db.Integer, primary_key=True)
    bezeichnung = db.Column(db.String(300), nullable=False)
    projektart_id = db.Column(db.Integer, db.ForeignKey('projektart.projektart_id'), nullable=False)
    projektart = db.relationship('Projektart', back_populates='projekte')

    def to_dict(self):
        return {
            'projekt_id': self.projekt_id,
            'bezeichnung': self.bezeichnung,
            'projektart_id': self.projektart_id,
        }


class Prozessschritt(db.Model):
    __tablename__ = 'prozessschritt'
    schritt_id = db.Column(db.Integer, primary_key=True)
    projektart_id = db.Column(db.Integer, db.ForeignKey('projektart.projektart_id'), nullable=False)
    bezeichnung = db.Column(db.String(300), nullable=False)
    projektart = db.relationship('Projektart', back_populates='schritte')
    unterschritte = db.relationship(
        'Prozessunterschritt', back_populates='schritt',
        cascade='all, delete-orphan', lazy='dynamic',
    )

    def to_dict(self):
        return {
            'schritt_id': self.schritt_id,
            'projektart_id': self.projektart_id,
            'bezeichnung': self.bezeichnung,
        }


class Prozessunterschritt(db.Model):
    __tablename__ = 'prozessunterschritt'
    unterschritt_id = db.Column(db.Integer, primary_key=True)
    schritt_id = db.Column(db.Integer, db.ForeignKey('prozessschritt.schritt_id'), nullable=False)
    bezeichnung = db.Column(db.String(300), nullable=False)
    schritt = db.relationship('Prozessschritt', back_populates='unterschritte')

    def to_dict(self):
        return {
            'unterschritt_id': self.unterschritt_id,
            'schritt_id': self.schritt_id,
            'bezeichnung': self.bezeichnung,
        }


# --- 4) Kern fachlich: Protokoll, Eintrag, Teilnehmer, Kommentar (F01–F02) ----
class Protokoll(db.Model):
    __tablename__ = 'protokoll'
    protokoll_id = db.Column(db.Integer, primary_key=True)
    datum = db.Column(db.Date, nullable=False)
    ort = db.Column(db.String(300), default='')
    typ = db.Column(db.String(100), nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('benutzer.benutzer_id'), nullable=False)
    erstellt_am = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # F03: Start 72 h
    bearbeitet_von_id = db.Column(db.Integer, db.ForeignKey('benutzer.benutzer_id'), nullable=True)
    bearbeitet_am = db.Column(db.DateTime, nullable=True)
    eintraege = db.relationship(
        'Eintrag', back_populates='protokoll', cascade='all, delete-orphan',
    )

    def to_dict(self):
        return {
            'protokoll_id': self.protokoll_id,
            'datum': str(self.datum),
            'ort': self.ort or '',
            'typ': self.typ,
            'autor_id': self.autor_id,
            'erstellt_am': self.erstellt_am.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'bearbeitet_von_id': self.bearbeitet_von_id,
            'bearbeitet_am': (
                self.bearbeitet_am.strftime('%Y-%m-%dT%H:%M:%SZ') if self.bearbeitet_am else None
            ),
        }


class Eintrag(db.Model):
    __tablename__ = 'eintrag'
    eintrag_id = db.Column(db.Integer, primary_key=True)
    protokoll_id = db.Column(db.Integer, db.ForeignKey('protokoll.protokoll_id'), nullable=False)
    thema = db.Column(db.String(300), nullable=False, default='')
    text = db.Column(db.Text, default='')
    # JSON-Liste: [{"text": "…", "status": "Offen"}, …]
    aufgaben = db.Column(db.JSON, nullable=False, default=list)
    projekt_id = db.Column(db.Integer, db.ForeignKey('projekt.projekt_id'), nullable=True)
    schritt_id = db.Column(db.Integer, db.ForeignKey('prozessschritt.schritt_id'), nullable=True)
    unterschritt_id = db.Column(db.Integer, db.ForeignKey('prozessunterschritt.unterschritt_id'), nullable=True)
    erstellt_von_id = db.Column(db.Integer, db.ForeignKey('benutzer.benutzer_id'), nullable=True)
    erstellt_am = db.Column(db.DateTime, nullable=True)
    bearbeitet_von_id = db.Column(db.Integer, db.ForeignKey('benutzer.benutzer_id'), nullable=True)
    bearbeitet_am = db.Column(db.DateTime, nullable=True)

    protokoll = db.relationship('Protokoll', back_populates='eintraege')
    teilnehmer = db.relationship(
        'EintragPerson', back_populates='eintrag', cascade='all, delete-orphan',
    )
    kommentare = db.relationship(
        'Kommentar', back_populates='eintrag', cascade='all, delete-orphan',
    )

    def to_dict(self):
        return {
            'eintrag_id': self.eintrag_id,
            'protokoll_id': self.protokoll_id,
            'thema': self.thema or '',
            'text': self.text or '',
            'aufgaben': self.aufgaben or [],
            'projekt_id': self.projekt_id,
            'schritt_id': self.schritt_id,
            'unterschritt_id': self.unterschritt_id,
            'erstellt_von_id': self.erstellt_von_id,
            'erstellt_am': self.erstellt_am.strftime('%Y-%m-%dT%H:%M:%SZ') if self.erstellt_am else None,
            'bearbeitet_von_id': self.bearbeitet_von_id,
            'bearbeitet_am': (
                self.bearbeitet_am.strftime('%Y-%m-%dT%H:%M:%SZ') if self.bearbeitet_am else None
            ),
        }


class EintragPerson(db.Model):
    """n:m Eintrag ↔ Person (Teilnehmer am Gesprächspunkt)."""
    __tablename__ = 'eintrag_person'
    id = db.Column(db.Integer, primary_key=True)
    eintrag_id = db.Column(db.Integer, db.ForeignKey('eintrag.eintrag_id'), nullable=False)
    person_id = db.Column(db.Integer, db.ForeignKey('person.person_id'), nullable=False)
    joined_at = db.Column(db.String(10), default='')
    eintrag = db.relationship('Eintrag', back_populates='teilnehmer')
    person = db.relationship('Person')

    def to_dict(self):
        return {
            'eintrag_id': self.eintrag_id,
            'person_id': self.person_id,
            'joined_at': self.joined_at or '',
        }


class Kommentar(db.Model):
    __tablename__ = 'kommentar'
    kommentar_id = db.Column(db.Integer, primary_key=True)
    eintrag_id = db.Column(db.Integer, db.ForeignKey('eintrag.eintrag_id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('benutzer.benutzer_id'), nullable=False)
    erstellt_am = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    eintrag = db.relationship('Eintrag', back_populates='kommentare')
    autor = db.relationship('Benutzer')

    def to_dict(self):
        return {
            'kommentar_id': self.kommentar_id,
            'eintrag_id': self.eintrag_id,
            'text': self.text,
            'autor_id': self.autor_id,
            'erstellt_am': self.erstellt_am.strftime('%Y-%m-%dT%H:%M:%SZ'),
        }


# --- 5) Vorschläge für Autocomplete (Typ, Ort, Thema, Aufgabe) ----------------
class Lookup(db.Model):
    __tablename__ = 'lookup'
    lookup_id = db.Column(db.Integer, primary_key=True)
    kategorie = db.Column(db.String(50), nullable=False)  # typ | ort | thema | aufgabe
    wert = db.Column(db.String(500), nullable=False)
    __table_args__ = (db.UniqueConstraint('kategorie', 'wert', name='uq_lookup_kat_wert'),)

    def to_dict(self):
        return {'lookup_id': self.lookup_id, 'kategorie': self.kategorie, 'wert': self.wert}
