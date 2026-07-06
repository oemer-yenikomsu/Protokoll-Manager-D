"""
================================================================================
START – Backend (Prüfungsversion)
================================================================================
Entwicklung: Ordner backend, venv aktivieren, dann:
  python app.py

Kern (eigen + Vorlagen aus Flask-Doku): kern/server.py, kern/modelle.py
Zusatz (Vorlagen + ggf. KI): zusatz/
================================================================================
"""
from kern.modelle import db
from kern.server import app

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
