"""
================================================================================
KERN-BACKEND – Protokoll-Manager (IHK-Projekt, Prüfungsversion)
================================================================================
Flask-Server: Login (F09), REST-API, 72-Stunden-Regel (F03).

| Abschnitt | Inhalt              | Anforderung |
|-----------|---------------------|-------------|
| 4–5       | Login + Schutz      | F09, NF06   |
| 6         | is_editable()       | F03         |
| 7         | GET (Daten lesen)   | F04, F05    |
| 8–10      | POST/PUT/DELETE     | F01–F02     |

Zusatz (Config, Migration, Seed): backend/zusatz/
Tabellen: kern/modelle.py · Start: python app.py

Herkunft (grob): Eigenentwicklung, angepasst aus üblichen Vorlagen
  (Flask-Doku, Flask-SQLAlchemy, REST-Beispiele, Werkzeug Passwort-Hash).
================================================================================
"""

# --- 1) Bibliotheken (Python + Flask + Datenbank) -----------------------------
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, abort, session
from flask_cors import CORS
from sqlalchemy.orm.attributes import flag_modified
from werkzeug.security import check_password_hash

from zusatz.config import Config
from zusatz.schema_migrate import ensure_benutzer_schema
from zusatz.session_policy import (
    clear_session, establish_session, is_session_idle_expired,
    session_auth_meta, touch_session,
)
from kern.modelle import (
    db, Benutzer, Organisation, Person, Projektart, Projekt, Prozessschritt,
    Prozessunterschritt, Protokoll, Eintrag, EintragPerson, Kommentar, Lookup,
)

# --- 2) Flask-App anlegen und mit SQLite verbinden -----------------------------
app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5173',
    'http://127.0.0.1:5173',
])

ensure_benutzer_schema(app)


# --- 3) Wer ist eingeloggt? (Session / Cookie) ---------------------------------
def get_current_benutzer():
    if not session.get('benutzer_id'):
        return None
    if is_session_idle_expired():
        clear_session()
        return None
    touch_session()
    return Benutzer.query.get(session['benutzer_id'])


def get_current_benutzer_or_401():
    user = get_current_benutzer()
    if not user:
        abort(401, 'Sitzung abgelaufen oder nicht angemeldet')
    return user


# --- 4) Login-Routen (F09 · NF06: Passwort-Hash prüfen, Session-Cookie) -------
@app.route('/api/auth/config', methods=['GET'])
def auth_config():
    from zusatz.config import session_idle_seconds
    sec = session_idle_seconds()
    return jsonify({'idleMinutes': max(1, (sec + 59) // 60), 'idleSeconds': sec})


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json() or {}
    name = (data.get('benutzername') or '').strip()
    password = data.get('passwort') or ''
    if not name or not password:
        abort(400, 'Benutzername und Passwort erforderlich')
    user = Benutzer.query.filter(db.func.lower(Benutzer.benutzername) == name.lower()).first()
    if not user or not check_password_hash(user.passwort_hash, password):
        abort(401, 'Ungültige Anmeldedaten')
    establish_session(user.benutzer_id)
    return jsonify({**user.to_dict_public(), **session_auth_meta()})


@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    clear_session()
    return jsonify({'success': True})


@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user = get_current_benutzer()
    if not user:
        abort(401, 'Nicht angemeldet')
    return jsonify({**user.to_dict_public(), **session_auth_meta()})


@app.route('/api/benutzer', methods=['GET'])
def get_benutzer():
    get_current_benutzer_or_401()
    return jsonify([u.to_dict_public() for u in Benutzer.query.order_by(Benutzer.benutzername).all()])


# --- 5) Ohne Login: alle /api/...-Aufrufe blockieren (außer Login) --------------
@app.before_request
def require_login_for_api():
    if request.method == 'OPTIONS':
        return None
    if not request.path.startswith('/api/'):
        return None
    if request.path.startswith('/api/auth/login') or request.path == '/api/auth/config':
        return None
    get_current_benutzer_or_401()
    return None


# --- 6) 72-Stunden-Regel (F03) – Kernlogik: danach nur lesen, nicht schreiben ---
def is_editable(erstellt_am: datetime) -> bool:
    return (datetime.utcnow() - erstellt_am) <= timedelta(hours=72)


# --- 7) Daten LESEN (F04 SQLite · F05 Filter/Suche im Frontend zusatz/) -------

@app.route('/api/protokolle', methods=['GET'])
def get_protokolle():
    return jsonify([p.to_dict() for p in Protokoll.query.all()])


@app.route('/api/eintraege', methods=['GET'])
def get_eintraege():
    return jsonify([e.to_dict() for e in Eintrag.query.all()])


@app.route('/api/eintrag-person', methods=['GET'])
def get_eintrag_person():
    return jsonify([ep.to_dict() for ep in EintragPerson.query.all()])


@app.route('/api/kommentare', methods=['GET'])
def get_kommentare():
    return jsonify([k.to_dict() for k in Kommentar.query.all()])


@app.route('/api/personen', methods=['GET'])
def get_personen():
    return jsonify([p.to_dict() for p in Person.query.all()])


@app.route('/api/organisationen', methods=['GET'])
def get_organisationen():
    return jsonify([o.to_dict() for o in Organisation.query.all()])


@app.route('/api/organisationen', methods=['POST'])
def create_organisation():
    data = request.get_json()
    name = (data.get('name') or data.get('bezeichnung') or '').strip()
    if not name:
        abort(400, 'Name fehlt')
    existing = Organisation.query.filter(
        db.func.lower(Organisation.name) == name.lower()
    ).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    org = Organisation(name=name)
    db.session.add(org)
    db.session.commit()
    return jsonify(org.to_dict()), 201


@app.route('/api/projektarten', methods=['GET'])
def get_projektarten():
    return jsonify([pa.to_dict() for pa in Projektart.query.order_by(Projektart.bezeichnung).all()])


@app.route('/api/projekte', methods=['GET'])
def get_projekte():
    return jsonify([p.to_dict() for p in Projekt.query.all()])


@app.route('/api/prozessschritte', methods=['GET'])
def get_prozessschritte():
    return jsonify([s.to_dict() for s in Prozessschritt.query.all()])


@app.route('/api/prozessunterschritte', methods=['GET'])
def get_prozessunterschritte():
    return jsonify([u.to_dict() for u in Prozessunterschritt.query.all()])


@app.route('/api/lookups', methods=['GET'])
def get_lookups():
    """Autocomplete: typ→typen, ort→orte, thema→themen, aufgabe→aufgaben."""
    result = {'typen': [], 'orte': [], 'themen': [], 'aufgaben': []}
    mapping = {
        'typ': 'typen', 'ort': 'orte', 'thema': 'themen', 'aufgabe': 'aufgaben',
    }
    for lookup in Lookup.query.all():
        key = mapping.get(lookup.kategorie)
        if key and lookup.wert not in result[key]:
            result[key].append(lookup.wert)
    return jsonify(result)


# --- 8) Daten NEU ANLEGEN (F01 Erfassung · F02 Kommentare) ---------------------

@app.route('/api/protokolle', methods=['POST'])
def create_protokoll():
    user = get_current_benutzer_or_401()
    data = request.get_json()
    protokoll = Protokoll(
        datum=datetime.strptime(data['datum'], '%Y-%m-%d').date(),
        ort=data.get('ort', ''),
        typ=data.get('typ', 'Besprechung'),
        autor_id=user.benutzer_id,
        erstellt_am=datetime.utcnow()
    )
    db.session.add(protokoll)
    db.session.flush()

    for e_data in data.get('eintraege', []):
        _create_eintrag(protokoll.protokoll_id, e_data)

    db.session.commit()
    return jsonify({'success': True, 'protokoll_id': protokoll.protokoll_id}), 201


def _stamp_eintrag_bearbeitung(eintrag):
    user = get_current_benutzer_or_401()
    eintrag.bearbeitet_von_id = user.benutzer_id
    eintrag.bearbeitet_am = datetime.utcnow()


def _create_eintrag(protokoll_id, e_data):
    user = get_current_benutzer_or_401()
    now = datetime.utcnow()
    eintrag = Eintrag(
        protokoll_id=protokoll_id,
        thema=e_data.get('thema', ''),
        text=e_data.get('text', ''),
        aufgaben=e_data.get('aufgaben', []),
        projekt_id=int(e_data['projekt_id']) if e_data.get('projekt_id') else None,
        schritt_id=int(e_data['schritt_id']) if e_data.get('schritt_id') else None,
        unterschritt_id=int(e_data['unterschritt_id']) if e_data.get('unterschritt_id') else None,
        erstellt_von_id=user.benutzer_id,
        erstellt_am=now,
    )
    db.session.add(eintrag)
    db.session.flush()
    for t in e_data.get('teilnehmer', []):
        db.session.add(EintragPerson(
            eintrag_id=eintrag.eintrag_id,
            person_id=t['person_id'],
            joined_at=t.get('joined_at', '')
        ))
    return eintrag


@app.route('/api/personen', methods=['POST'])
def create_person():
    data = request.get_json() or {}
    raw = (data.get('name') or data.get('benutzername') or data.get('vorname') or '').strip()
    vorname = (data.get('vorname') or '').strip()
    nachname = (data.get('nachname') or '').strip()
    if not vorname and raw:
        parts = raw.split(None, 1)
        vorname = parts[0]
        nachname = parts[1] if len(parts) > 1 else ''
    if not vorname:
        abort(400, 'Name fehlt')

    org_id = data.get('org_id')
    if org_id is not None and org_id != '':
        org_id = int(org_id)
    else:
        org_id = None

    nv = vorname.lower()
    nn = (nachname or '').lower()
    existing = Person.query.filter(
        db.func.lower(Person.vorname) == nv,
        db.func.lower(Person.nachname) == nn,
    ).first()
    if existing:
        if org_id is not None and existing.org_id != org_id:
            existing.org_id = org_id
            db.session.commit()
        return jsonify(existing.to_dict()), 200

    person = Person(
        vorname=vorname,
        nachname=nachname or '',
        org_id=org_id,
        erstellt_am=datetime.utcnow(),
    )
    db.session.add(person)
    db.session.commit()
    return jsonify(person.to_dict()), 201


@app.route('/api/personen/<int:person_id>', methods=['PATCH'])
def update_person(person_id):
    person = Person.query.get_or_404(person_id)
    data = request.get_json() or {}
    if 'org_id' in data:
        if person.erstellt_am is None or not is_editable(person.erstellt_am):
            abort(403, 'Organisation nur innerhalb von 72h nach Anlage änderbar')
        oid = data['org_id']
        person.org_id = int(oid) if oid not in (None, '', 0) else None
    db.session.commit()
    return jsonify(person.to_dict()), 200


@app.route('/api/projektarten', methods=['POST'])
def create_projektart():
    data = request.get_json()
    bezeichnung = data['bezeichnung'].strip()
    existing = Projektart.query.filter_by(bezeichnung=bezeichnung).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    projektart = Projektart(bezeichnung=bezeichnung)
    db.session.add(projektart)
    db.session.commit()
    return jsonify(projektart.to_dict()), 201


@app.route('/api/projekte', methods=['POST'])
def create_projekt():
    data = request.get_json()
    bezeichnung = data['bezeichnung'].strip()
    projektart_id = int(data['projektart_id'])
    existing = Projekt.query.filter_by(bezeichnung=bezeichnung, projektart_id=projektart_id).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    projekt = Projekt(bezeichnung=bezeichnung, projektart_id=projektart_id)
    db.session.add(projekt)
    db.session.commit()
    return jsonify(projekt.to_dict()), 201


@app.route('/api/prozessschritte', methods=['POST'])
def create_prozessschritt():
    data = request.get_json()
    bezeichnung = data['bezeichnung'].strip()
    projektart_id = int(data['projektart_id'])
    existing = Prozessschritt.query.filter_by(bezeichnung=bezeichnung, projektart_id=projektart_id).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    schritt = Prozessschritt(projektart_id=projektart_id, bezeichnung=bezeichnung)
    db.session.add(schritt)
    db.session.commit()
    return jsonify(schritt.to_dict()), 201


@app.route('/api/prozessunterschritte', methods=['POST'])
def create_prozessunterschritt():
    data = request.get_json()
    bezeichnung = data['bezeichnung'].strip()
    schritt_id = int(data['schritt_id'])
    existing = Prozessunterschritt.query.filter_by(bezeichnung=bezeichnung, schritt_id=schritt_id).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    unterschritt = Prozessunterschritt(schritt_id=schritt_id, bezeichnung=bezeichnung)
    db.session.add(unterschritt)
    db.session.commit()
    return jsonify(unterschritt.to_dict()), 201


@app.route('/api/kommentare', methods=['POST'])
def create_kommentar():
    user = get_current_benutzer_or_401()
    data = request.get_json()
    kommentar = Kommentar(
        eintrag_id=data['eintrag_id'],
        text=data['text'],
        autor_id=user.benutzer_id,
        erstellt_am=datetime.utcnow()
    )
    db.session.add(kommentar)
    db.session.commit()
    return jsonify(kommentar.to_dict()), 201


@app.route('/api/lookups', methods=['POST'])
def create_lookup():
    data = request.get_json()
    kategorie = data['kategorie']
    wert = data['wert'].strip()
    existing = Lookup.query.filter_by(kategorie=kategorie, wert=wert).first()
    if not existing:
        db.session.add(Lookup(kategorie=kategorie, wert=wert))
        db.session.commit()
    return jsonify({'success': True}), 201


# --- 9) Daten ÄNDERN (F01 · F03: is_editable vor jedem Schreibzugriff) -----------

@app.route('/api/protokolle/<int:protokoll_id>', methods=['PUT'])
def update_protokoll(protokoll_id):
    protokoll = Protokoll.query.get_or_404(protokoll_id)
    if not is_editable(protokoll.erstellt_am):
        abort(403, description='Bearbeitung nach 72h gesperrt.')

    user = get_current_benutzer_or_401()
    data = request.get_json()
    protokoll.datum = datetime.strptime(data['datum'], '%Y-%m-%d').date()
    protokoll.ort   = data.get('ort', '')
    protokoll.typ   = data.get('typ', protokoll.typ)
    protokoll.bearbeitet_von_id = user.benutzer_id
    protokoll.bearbeitet_am = datetime.utcnow()

    # Einträge: vorhandene aktualisieren, gelöschte entfernen, neue anlegen
    form_entry_ids = [e['eintrag_id'] for e in data.get('eintraege', []) if e.get('eintrag_id')]
    existing_ids   = [e.eintrag_id for e in protokoll.eintraege]
    to_delete      = set(existing_ids) - set(form_entry_ids)

    for eid in to_delete:
        e = Eintrag.query.get(eid)
        if e:
            db.session.delete(e)

    for e_data in data.get('eintraege', []):
        if e_data.get('eintrag_id'):
            eintrag = Eintrag.query.get(e_data['eintrag_id'])
            if eintrag:
                eintrag.thema           = e_data.get('thema', '')
                eintrag.text            = e_data.get('text', '')
                eintrag.aufgaben        = e_data.get('aufgaben', [])
                eintrag.projekt_id      = int(e_data['projekt_id']) if e_data.get('projekt_id') else None
                eintrag.schritt_id      = int(e_data['schritt_id']) if e_data.get('schritt_id') else None
                eintrag.unterschritt_id = int(e_data['unterschritt_id']) if e_data.get('unterschritt_id') else None
                flag_modified(eintrag, 'aufgaben')
                _stamp_eintrag_bearbeitung(eintrag)
                # Teilnehmer ersetzen
                EintragPerson.query.filter_by(eintrag_id=eintrag.eintrag_id).delete()
                for t in e_data.get('teilnehmer', []):
                    db.session.add(EintragPerson(
                        eintrag_id=eintrag.eintrag_id,
                        person_id=t['person_id'],
                        joined_at=t.get('joined_at', '')
                    ))
        else:
            _create_eintrag(protokoll_id, e_data)

    db.session.commit()
    return jsonify({'success': True})


@app.route('/api/eintraege/<int:eintrag_id>', methods=['PUT'])
def update_eintrag(eintrag_id):
    eintrag = Eintrag.query.get_or_404(eintrag_id)
    protokoll = Protokoll.query.get(eintrag.protokoll_id)
    if protokoll and not is_editable(protokoll.erstellt_am):
        abort(403, description='Bearbeitung nach 72h gesperrt.')

    user = get_current_benutzer_or_401()
    data = request.get_json()
    eintrag.thema           = data.get('thema', eintrag.thema)
    eintrag.text            = data.get('text', eintrag.text)
    eintrag.aufgaben        = data.get('aufgaben', eintrag.aufgaben)
    eintrag.projekt_id      = int(data['projekt_id']) if data.get('projekt_id') else None
    eintrag.schritt_id      = int(data['schritt_id']) if data.get('schritt_id') else None
    eintrag.unterschritt_id = int(data['unterschritt_id']) if data.get('unterschritt_id') else None
    flag_modified(eintrag, 'aufgaben')
    _stamp_eintrag_bearbeitung(eintrag)

    EintragPerson.query.filter_by(eintrag_id=eintrag_id).delete()
    for t in data.get('teilnehmer', []):
        db.session.add(EintragPerson(
            eintrag_id=eintrag_id,
            person_id=t['person_id'],
            joined_at=t.get('joined_at', '')
        ))

    db.session.commit()
    return jsonify(eintrag.to_dict())


@app.route('/api/eintraege/<int:eintrag_id>/aufgabe-status', methods=['PATCH'])
def update_aufgabe_status(eintrag_id):
    """Ändert den Status einer einzelnen Aufgabe per Index."""
    eintrag = Eintrag.query.get_or_404(eintrag_id)
    data = request.get_json()
    task_index = data['task_index']
    new_status = data['new_status']

    aufgaben = list(eintrag.aufgaben)
    if 0 <= task_index < len(aufgaben):
        aufgaben[task_index] = {**aufgaben[task_index], 'status': new_status}
        eintrag.aufgaben = aufgaben
        flag_modified(eintrag, 'aufgaben')
        _stamp_eintrag_bearbeitung(eintrag)
        db.session.commit()
    return jsonify({'success': True})


@app.route('/api/eintraege', methods=['POST'])
def create_eintrag_standalone():
    """Neuen Eintrag zu einem bestehenden Protokoll hinzufügen."""
    data = request.get_json()
    protokoll = Protokoll.query.get_or_404(data['protokoll_id'])
    if not is_editable(protokoll.erstellt_am):
        abort(403, description='Bearbeitung nach 72h gesperrt.')
    eintrag = _create_eintrag(data['protokoll_id'], data)
    db.session.commit()
    return jsonify(eintrag.to_dict()), 201


# --- 10) Daten LÖSCHEN (F01 · F03) ----------------------------------------------

@app.route('/api/protokolle/<int:protokoll_id>', methods=['DELETE'])
def delete_protokoll(protokoll_id):
    protokoll = Protokoll.query.get_or_404(protokoll_id)
    if not is_editable(protokoll.erstellt_am):
        abort(403, description='Löschen nach 72h gesperrt.')
    db.session.delete(protokoll)
    db.session.commit()
    return jsonify({'success': True})


@app.route('/api/eintraege/<int:eintrag_id>', methods=['DELETE'])
def delete_eintrag(eintrag_id):
    eintrag = Eintrag.query.get_or_404(eintrag_id)
    protokoll = Protokoll.query.get(eintrag.protokoll_id)
    if protokoll and not is_editable(protokoll.erstellt_am):
        abort(403, description='Löschen nach 72h gesperrt.')
    db.session.delete(eintrag)
    db.session.commit()
    return jsonify({'success': True})


# --- 11) Nur wenn du server.py direkt startest (normal: python app.py) ----------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)