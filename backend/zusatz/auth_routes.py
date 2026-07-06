"""Login, Session, aktueller Benutzer."""
from functools import wraps

from flask import jsonify, request, session, abort
from werkzeug.security import check_password_hash, generate_password_hash

from config import session_idle_seconds
from models import db, Benutzer
from session_policy import (
    clear_session, establish_session, is_session_idle_expired,
    session_auth_meta, touch_session,
)


def register_auth_routes(app):
    @app.route('/api/auth/config', methods=['GET'])
    def auth_config():
        sec = session_idle_seconds()
        return jsonify({
            'idleMinutes': max(1, (sec + 59) // 60),
            'idleSeconds': sec,
        })
    @app.route('/api/auth/login', methods=['POST'])
    def auth_login():
        data = request.get_json() or {}
        name = (data.get('benutzername') or '').strip()
        password = data.get('passwort') or ''
        if not name or not password:
            abort(400, 'Benutzername und Passwort erforderlich')
        user = Benutzer.query.filter(
            db.func.lower(Benutzer.benutzername) == name.lower()
        ).first()
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


def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        get_current_benutzer_or_401()
        return f(*args, **kwargs)
    return wrapped


def hash_password(plain: str) -> str:
    return generate_password_hash(plain)
