import os
from pathlib import Path

# Ordner backend/ (eine Ebene über zusatz/) – dort liegt protokoll.db
BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', f'sqlite:///{BASE_DIR}/protokoll.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'portfolio-dev-only-not-for-production')
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_HTTPONLY = True
    # Keine dauerhafte Cookie-Laufzeit – Sitzung endet beim Schließen des Browsers (session cookie).
    SESSION_IDLE_MINUTES = int(os.getenv('SESSION_IDLE_MINUTES', '30'))


def session_idle_seconds() -> int:
    """Standard: 30 Minuten (1800 s). Optional SESSION_IDLE_SECONDS oder SESSION_IDLE_MINUTES."""
    raw = os.getenv('SESSION_IDLE_SECONDS', '').strip()
    if raw:
        return max(60, int(raw))
    return max(60, Config.SESSION_IDLE_MINUTES * 60)