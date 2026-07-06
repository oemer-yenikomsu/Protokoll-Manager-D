"""Profil und Benutzerverwaltung (rollenbasiert, ohne Benutzerwechsel)."""
from flask import jsonify, request, abort

from models import db, Benutzer, Protokoll, Eintrag, Kommentar
from auth_routes import get_current_benutzer_or_401, hash_password
from werkzeug.security import check_password_hash
from roles import (
    normalize_rolle, kann_verwalten, verwaltbare_rollen, darf_rolle_zuweisen,
    hat_verwaltungsrecht, ROLLE_LABEL,
)


def _usage_benutzer(benutzer_id: int) -> tuple[bool, str]:
    reasons = []
    if Protokoll.query.filter(
        (Protokoll.autor_id == benutzer_id) | (Protokoll.bearbeitet_von_id == benutzer_id)
    ).count():
        reasons.append('in Protokollen')
    if Eintrag.query.filter(
        (Eintrag.erstellt_von_id == benutzer_id) | (Eintrag.bearbeitet_von_id == benutzer_id)
    ).count():
        reasons.append('in Einträgen')
    if Kommentar.query.filter_by(autor_id=benutzer_id).count():
        reasons.append('in Kommentaren')
    if reasons:
        return False, 'Benutzer wird noch verwendet (' + ', '.join(reasons) + ').'
    return True, ''


def _get_target_or_404(benutzer_id: int) -> Benutzer:
    target = Benutzer.query.get_or_404(benutzer_id)
    actor = get_current_benutzer_or_401()
    if not kann_verwalten(actor.rolle, target.rolle, gleicher_benutzer=actor.benutzer_id == target.benutzer_id):
        abort(403, 'Keine Berechtigung für diesen Benutzer.')
    return target


def register_benutzer_routes(app):
    @app.route('/api/auth/profile', methods=['PATCH'])
    def update_profile():
        user = get_current_benutzer_or_401()
        data = request.get_json() or {}

        if 'anzeigename' in data:
            user.anzeigename = (data.get('anzeigename') or '').strip() or user.benutzername

        neuer_name = (data.get('benutzername') or '').strip()
        if neuer_name and neuer_name.lower() != user.benutzername.lower():
            pw_only = data.get('passwort') or data.get('passwort_bestaetigung') or ''
            if not pw_only:
                abort(400, 'Zur Benutzernamen-Änderung ist das aktuelle Passwort erforderlich.')
            if not check_password_hash(user.passwort_hash, pw_only):
                abort(403, 'Passwort ist falsch.')
            existing = Benutzer.query.filter(
                db.func.lower(Benutzer.benutzername) == neuer_name.lower(),
                Benutzer.benutzer_id != user.benutzer_id,
            ).first()
            if existing:
                abort(409, 'Benutzername ist bereits vergeben.')
            user.benutzername = neuer_name

        altes = data.get('altes_passwort') or ''
        neues = data.get('neues_passwort') or ''
        if neues:
            if not altes:
                abort(400, 'Altes und neues Passwort sind erforderlich.')
            if not check_password_hash(user.passwort_hash, altes):
                abort(403, 'Altes Passwort ist falsch.')
            if len(neues) < 4:
                abort(400, 'Neues Passwort ist zu kurz (min. 4 Zeichen).')
            user.passwort_hash = hash_password(neues)

        db.session.commit()
        return jsonify(user.to_dict_public())

    @app.route('/api/benutzerverwaltung/meta', methods=['GET'])
    def benutzerverwaltung_meta():
        actor = get_current_benutzer_or_401()
        verwaltbar = verwaltbare_rollen(actor.rolle)
        return jsonify({
            'eigene_rolle': normalize_rolle(actor.rolle),
            'eigene_rolle_label': ROLLE_LABEL[normalize_rolle(actor.rolle)],
            'verwaltbare_rollen': [
                {'id': r, 'label': ROLLE_LABEL[r]} for r in verwaltbar
            ],
            'darf_verwalten': hat_verwaltungsrecht(actor.rolle),
            'nur_rolle_bearbeiten': True,
        })

    @app.route('/api/benutzerverwaltung', methods=['GET'])
    def list_verwaltbare_benutzer():
        actor = get_current_benutzer_or_401()
        if not hat_verwaltungsrecht(actor.rolle):
            abort(403, 'Keine Benutzerverwaltungsrechte.')
        rollen = verwaltbare_rollen(actor.rolle)
        if not rollen:
            return jsonify([])
        users = Benutzer.query.filter(
            Benutzer.rolle.in_(rollen)
        ).order_by(Benutzer.rolle, Benutzer.benutzername).all()
        return jsonify([u.to_dict_public() for u in users])

    @app.route('/api/benutzerverwaltung', methods=['POST'])
    def create_verwalteter_benutzer():
        actor = get_current_benutzer_or_401()
        if not hat_verwaltungsrecht(actor.rolle):
            abort(403, 'Keine Benutzerverwaltungsrechte.')
        data = request.get_json() or {}
        name = (data.get('benutzername') or '').strip()
        anzeige = (data.get('anzeigename') or name).strip()
        rolle = normalize_rolle(data.get('rolle'))
        passwort = data.get('passwort') or ''
        if not name or not passwort:
            abort(400, 'Benutzername und Passwort erforderlich.')
        if not darf_rolle_zuweisen(actor.rolle, rolle):
            abort(403, 'Diese Rolle darf nicht zugewiesen werden.')
        if Benutzer.query.filter(db.func.lower(Benutzer.benutzername) == name.lower()).first():
            abort(409, 'Benutzername ist bereits vergeben.')
        user = Benutzer(
            benutzername=name,
            anzeigename=anzeige,
            passwort_hash=hash_password(passwort),
            rolle=rolle,
        )
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict_public()), 201

    @app.route('/api/benutzerverwaltung/<int:benutzer_id>', methods=['PUT'])
    def update_verwalteter_benutzer(benutzer_id):
        """Bestehende Benutzer: nur Rolle änderbar (keine Stammdaten/Passwort)."""
        target = _get_target_or_404(benutzer_id)
        actor = get_current_benutzer_or_401()
        data = request.get_json() or {}

        forbidden = [k for k in ('anzeigename', 'benutzername', 'passwort') if k in data and data.get(k)]
        if forbidden:
            abort(
                403,
                'Stammdaten und Passwort können nicht bearbeitet werden. '
                'Benutzer löschen und neu anlegen.',
            )

        if 'rolle' not in data:
            abort(400, 'Nur die Rolle kann geändert werden.')

        neue = normalize_rolle(data['rolle'])
        if not darf_rolle_zuweisen(actor.rolle, neue):
            abort(403, 'Diese Rolle darf nicht zugewiesen werden.')
        target.rolle = neue
        db.session.commit()
        return jsonify(target.to_dict_public())

    @app.route('/api/benutzerverwaltung/<int:benutzer_id>', methods=['DELETE'])
    def delete_verwalteter_benutzer(benutzer_id):
        target = _get_target_or_404(benutzer_id)
        ok, msg = _usage_benutzer(target.benutzer_id)
        if not ok:
            abort(409, msg)
        db.session.delete(target)
        db.session.commit()
        return jsonify({'success': True})
