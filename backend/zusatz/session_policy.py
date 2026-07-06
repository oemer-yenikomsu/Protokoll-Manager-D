"""Sitzungs-Timeout bei Inaktivität; keine Permanent-Session."""
import time

from flask import session

from zusatz.config import session_idle_seconds


def _idle_seconds() -> int:
    return session_idle_seconds()


def touch_session() -> None:
    session['last_activity'] = time.time()


def clear_session() -> None:
    session.pop('benutzer_id', None)
    session.pop('last_activity', None)


def is_session_idle_expired() -> bool:
    last = session.get('last_activity')
    if last is None:
        return bool(session.get('benutzer_id'))
    return (time.time() - last) > _idle_seconds()


def establish_session(benutzer_id: int) -> None:
    session.permanent = False
    session['benutzer_id'] = benutzer_id
    touch_session()


def session_auth_meta() -> dict:
    """Für Login / auth/me: Ablaufzeitpunkt der Sitzung (Unix-Sekunden)."""
    last = session.get('last_activity')
    if last is None:
        return {'idleSeconds': _idle_seconds()}
    sec = _idle_seconds()
    return {'idleSeconds': sec, 'sessionDeadline': int(last + sec)}
