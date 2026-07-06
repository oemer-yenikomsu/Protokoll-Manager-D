"""Stammdaten: Verwendungsprüfung, Bearbeiten, Löschen (nur wenn unbenutzt in Protokollen/Einträgen)."""
from flask import jsonify, request, abort
from models import (
    db, Organisation, Person, Projektart, Projekt, Prozessschritt,
    Prozessunterschritt, Protokoll, Eintrag, EintragPerson, Kommentar, Lookup,
)


def _conflict(reason: str):
    return jsonify({'error': 'in_use', 'message': reason}), 409


def _usage_organisation(org_id: int) -> tuple[bool, str]:
    reasons = []
    n_person = Person.query.filter_by(org_id=org_id).count()
    if n_person:
        reasons.append(f'{n_person} Person(en) zugeordnet')
    if reasons:
        return False, 'Organisation wird noch verwendet: ' + ', '.join(reasons) + '.'
    return True, ''


def _usage_person(person_id: int) -> tuple[bool, str]:
    reasons = []
    if EintragPerson.query.filter_by(person_id=person_id).count():
        reasons.append('in Gesprächsteilnehmern')
    if reasons:
        return False, 'Person wird noch verwendet (' + ', '.join(reasons) + ').'
    return True, ''


def _usage_projektart(projektart_id: int) -> tuple[bool, str]:
    reasons = []
    if Projekt.query.filter_by(projektart_id=projektart_id).count():
        reasons.append('in Projekten')
    if Prozessschritt.query.filter_by(projektart_id=projektart_id).count():
        reasons.append('in Prozessschritten')
    projekt_ids = [p.projekt_id for p in Projekt.query.filter_by(projektart_id=projektart_id).all()]
    if projekt_ids and Eintrag.query.filter(Eintrag.projekt_id.in_(projekt_ids)).count():
        reasons.append('in Protokolleinträgen (Projekt)')
    schritt_ids = [s.schritt_id for s in Prozessschritt.query.filter_by(projektart_id=projektart_id).all()]
    if schritt_ids and Eintrag.query.filter(Eintrag.schritt_id.in_(schritt_ids)).count():
        reasons.append('in Protokolleinträgen (Schritt)')
    if reasons:
        return False, 'Projektart wird noch verwendet: ' + ', '.join(reasons) + '.'
    return True, ''


def _usage_projekt(projekt_id: int) -> tuple[bool, str]:
    n = Eintrag.query.filter_by(projekt_id=projekt_id).count()
    if n:
        return False, f'Projekt wird in {n} Protokolleinträg(en) verwendet.'
    return True, ''


def _usage_schritt(schritt_id: int) -> tuple[bool, str]:
    reasons = []
    if Eintrag.query.filter_by(schritt_id=schritt_id).count():
        reasons.append('in Protokolleinträgen')
    if Prozessunterschritt.query.filter_by(schritt_id=schritt_id).count():
        reasons.append('in Prozessunterschritten')
    if reasons:
        return False, 'Prozessschritt wird noch verwendet: ' + ', '.join(reasons) + '.'
    return True, ''


def _usage_unterschritt(unterschritt_id: int) -> tuple[bool, str]:
    n = Eintrag.query.filter_by(unterschritt_id=unterschritt_id).count()
    if n:
        return False, f'Prozessunterschritt wird in {n} Protokolleinträg(en) verwendet.'
    return True, ''


def _usage_lookup(lookup: Lookup) -> tuple[bool, str]:
    kat, wert = lookup.kategorie, lookup.wert
    if kat == 'typ':
        n = Protokoll.query.filter_by(typ=wert).count()
        if n:
            return False, f'Typ wird in {n} Protokoll(en) verwendet.'
    elif kat == 'ort':
        n = Protokoll.query.filter_by(ort=wert).count()
        if n:
            return False, f'Ort wird in {n} Protokoll(en) verwendet.'
    elif kat == 'thema':
        n = Eintrag.query.filter_by(thema=wert).count()
        if n:
            return False, f'Thema wird in {n} Eintrag/Einträgen verwendet.'
    elif kat == 'aufgabe':
        n = 0
        for e in Eintrag.query.all():
            for a in (e.aufgaben or []):
                if (a.get('text') or '').strip() == wert:
                    n += 1
                    break
        if n:
            return False, f'Aufgabentext wird in {n} Eintrag/Einträgen verwendet.'
    return True, ''


def _require_stammdaten_recht():
    from auth_routes import get_current_benutzer_or_401
    from roles import hat_stammdaten_recht
    if not hat_stammdaten_recht(get_current_benutzer_or_401().rolle):
        abort(403, 'Stammdatenverwaltung ab Rolle Mitarbeiter oder höher.')


def register_stammdaten_routes(app):
    @app.route('/api/lookups/all', methods=['GET'])
    def get_all_lookups():
        _require_stammdaten_recht()
        rows = Lookup.query.order_by(Lookup.kategorie, Lookup.wert).all()
        return jsonify([l.to_dict() for l in rows])

    # ── Organisation ─────────────────────────────────────────────────────
    @app.route('/api/organisationen/<int:org_id>', methods=['PUT'])
    def update_organisation(org_id):
        _require_stammdaten_recht()
        org = Organisation.query.get_or_404(org_id)
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            abort(400, 'Name fehlt')
        dup = Organisation.query.filter(
            Organisation.org_id != org_id,
            db.func.lower(Organisation.name) == name.lower(),
        ).first()
        if dup:
            abort(400, 'Organisation existiert bereits')
        org.name = name
        db.session.commit()
        return jsonify(org.to_dict())

    @app.route('/api/organisationen/<int:org_id>', methods=['DELETE'])
    def delete_organisation(org_id):
        _require_stammdaten_recht()
        Organisation.query.get_or_404(org_id)
        ok, msg = _usage_organisation(org_id)
        if not ok:
            return _conflict(msg)
        org = Organisation.query.get(org_id)
        db.session.delete(org)
        db.session.commit()
        return jsonify({'success': True})

    # ── Person (Stammdaten: volle Bearbeitung) ───────────────────────────
    @app.route('/api/stammdaten/personen/<int:person_id>', methods=['PUT'])
    def stammdaten_update_person(person_id):
        _require_stammdaten_recht()
        person = Person.query.get_or_404(person_id)
        data = request.get_json() or {}
        if 'vorname' in data:
            person.vorname = (data['vorname'] or '').strip()
        if 'nachname' in data:
            person.nachname = (data['nachname'] or '').strip()
        if 'org_id' in data:
            oid = data['org_id']
            person.org_id = int(oid) if oid not in (None, '', 0) else None
        if not (person.vorname or person.nachname):
            abort(400, 'Name fehlt')
        db.session.commit()
        return jsonify(person.to_dict())

    @app.route('/api/personen/<int:person_id>', methods=['DELETE'])
    def delete_person(person_id):
        _require_stammdaten_recht()
        Person.query.get_or_404(person_id)
        ok, msg = _usage_person(person_id)
        if not ok:
            return _conflict(msg)
        person = Person.query.get(person_id)
        db.session.delete(person)
        db.session.commit()
        return jsonify({'success': True})

    # ── Projektart ───────────────────────────────────────────────────────
    @app.route('/api/projektarten/<int:projektart_id>', methods=['PUT'])
    def update_projektart(projektart_id):
        _require_stammdaten_recht()
        pa = Projektart.query.get_or_404(projektart_id)
        data = request.get_json() or {}
        b = (data.get('bezeichnung') or '').strip()
        if not b:
            abort(400, 'Bezeichnung fehlt')
        dup = Projektart.query.filter(
            Projektart.projektart_id != projektart_id,
            db.func.lower(Projektart.bezeichnung) == b.lower(),
        ).first()
        if dup:
            abort(400, 'Projektart existiert bereits')
        pa.bezeichnung = b
        db.session.commit()
        return jsonify(pa.to_dict())

    @app.route('/api/projektarten/<int:projektart_id>', methods=['DELETE'])
    def delete_projektart(projektart_id):
        _require_stammdaten_recht()
        Projektart.query.get_or_404(projektart_id)
        ok, msg = _usage_projektart(projektart_id)
        if not ok:
            return _conflict(msg)
        pa = Projektart.query.get(projektart_id)
        db.session.delete(pa)
        db.session.commit()
        return jsonify({'success': True})

    # ── Projekt ──────────────────────────────────────────────────────────
    @app.route('/api/projekte/<int:projekt_id>', methods=['PUT'])
    def update_projekt(projekt_id):
        _require_stammdaten_recht()
        p = Projekt.query.get_or_404(projekt_id)
        data = request.get_json() or {}
        b = (data.get('bezeichnung') or '').strip()
        pa_id = data.get('projektart_id', p.projektart_id)
        if not b:
            abort(400, 'Bezeichnung fehlt')
        p.bezeichnung = b
        p.projektart_id = int(pa_id)
        db.session.commit()
        return jsonify(p.to_dict())

    @app.route('/api/projekte/<int:projekt_id>', methods=['DELETE'])
    def delete_projekt(projekt_id):
        _require_stammdaten_recht()
        Projekt.query.get_or_404(projekt_id)
        ok, msg = _usage_projekt(projekt_id)
        if not ok:
            return _conflict(msg)
        p = Projekt.query.get(projekt_id)
        db.session.delete(p)
        db.session.commit()
        return jsonify({'success': True})

    # ── Prozessschritt ───────────────────────────────────────────────────
    @app.route('/api/prozessschritte/<int:schritt_id>', methods=['PUT'])
    def update_prozessschritt(schritt_id):
        _require_stammdaten_recht()
        s = Prozessschritt.query.get_or_404(schritt_id)
        data = request.get_json() or {}
        b = (data.get('bezeichnung') or '').strip()
        pa_id = data.get('projektart_id', s.projektart_id)
        if not b:
            abort(400, 'Bezeichnung fehlt')
        s.bezeichnung = b
        s.projektart_id = int(pa_id)
        db.session.commit()
        return jsonify(s.to_dict())

    @app.route('/api/prozessschritte/<int:schritt_id>', methods=['DELETE'])
    def delete_prozessschritt(schritt_id):
        _require_stammdaten_recht()
        Prozessschritt.query.get_or_404(schritt_id)
        ok, msg = _usage_schritt(schritt_id)
        if not ok:
            return _conflict(msg)
        s = Prozessschritt.query.get(schritt_id)
        db.session.delete(s)
        db.session.commit()
        return jsonify({'success': True})

    # ── Prozessunterschritt ──────────────────────────────────────────────
    @app.route('/api/prozessunterschritte/<int:unterschritt_id>', methods=['PUT'])
    def update_prozessunterschritt(unterschritt_id):
        _require_stammdaten_recht()
        u = Prozessunterschritt.query.get_or_404(unterschritt_id)
        data = request.get_json() or {}
        b = (data.get('bezeichnung') or '').strip()
        sid = data.get('schritt_id', u.schritt_id)
        if not b:
            abort(400, 'Bezeichnung fehlt')
        u.bezeichnung = b
        u.schritt_id = int(sid)
        db.session.commit()
        return jsonify(u.to_dict())

    @app.route('/api/prozessunterschritte/<int:unterschritt_id>', methods=['DELETE'])
    def delete_prozessunterschritt(unterschritt_id):
        _require_stammdaten_recht()
        Prozessunterschritt.query.get_or_404(unterschritt_id)
        ok, msg = _usage_unterschritt(unterschritt_id)
        if not ok:
            return _conflict(msg)
        u = Prozessunterschritt.query.get(unterschritt_id)
        db.session.delete(u)
        db.session.commit()
        return jsonify({'success': True})

    # ── Lookup ───────────────────────────────────────────────────────────
    @app.route('/api/lookups/<int:lookup_id>', methods=['PUT'])
    def update_lookup(lookup_id):
        _require_stammdaten_recht()
        lu = Lookup.query.get_or_404(lookup_id)
        data = request.get_json() or {}
        wert = (data.get('wert') or '').strip()
        if not wert:
            abort(400, 'Wert fehlt')
        dup = Lookup.query.filter(
            Lookup.lookup_id != lookup_id,
            Lookup.kategorie == lu.kategorie,
            db.func.lower(Lookup.wert) == wert.lower(),
        ).first()
        if dup:
            abort(400, 'Eintrag existiert bereits')
        lu.wert = wert
        db.session.commit()
        return jsonify(lu.to_dict())

    @app.route('/api/lookups/<int:lookup_id>', methods=['DELETE'])
    def delete_lookup(lookup_id):
        _require_stammdaten_recht()
        lu = Lookup.query.get_or_404(lookup_id)
        ok, msg = _usage_lookup(lu)
        if not ok:
            return _conflict(msg)
        db.session.delete(lu)
        db.session.commit()
        return jsonify({'success': True})
