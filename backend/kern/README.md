# Backend-Kern (Prüfungsversion)

**Mein Code für die mündliche Prüfung** – alles andere liegt in `../zusatz/`.

## Herkunft des Codes (für die Prüfung)

- **Eigenentwicklung** im Projekt: Tabellen, REST-Routen, 72-h-Regel, Login-Anbindung.
- **Code-Vorlagen** (angepasst, nicht 1:1 kopiert), u. a. aus:
  - [Flask-Dokumentation](https://flask.palletsprojects.com/) (Routen, JSON, Session)
  - [Flask-SQLAlchemy](https://flask-sqlalchemy.readthedocs.io/) (Modelle, `db.session`)
  - [Werkzeug](https://werkzeug.palletsprojects.com/) (`check_password_hash` – NF06)
  - übliche REST-/CRUD-Beispiele (GET/POST/PUT/DELETE-Muster)

**Nicht** im Kern: Migration, Seed, Produktionsstart → `zusatz/` (dort ggf. auch KI-Unterstützung).

## Dateien

| Datei | Abschnitte | Inhalt |
|-------|------------|--------|
| **modelle.py** | 1–5 | SQLite-Tabellen (SQLAlchemy) |
| **server.py** | 1–11 | Flask, Login, REST, 72-h-Regel |

Start: im Ordner `backend` → `python app.py`

## Anforderungen → Code

| ID | Thema | Wo im Kern |
|----|--------|------------|
| F01–F02 | Erfassen, Kommentare | server.py §8–9, modelle.py §4 |
| F03 | 72-Stunden-Regel | server.py §6, §9–10 |
| F04–F05 | DB, Suche | modelle.py, server.py §7 (Suche: Frontend zusatz/) |
| F09 | Login | server.py §4–5, modelle.py §2 |
| NF06 | Passwort-Hash | server.py §4 (`check_password_hash`) |

F06 (Tabelle), F07 (PDF), F08 (Ausblenden): **nur** `frontend/src/zusatz/`.

## Mündliche Prüfung – Reihenfolge

1. `app.py` → startet `kern/server.py`
2. `modelle.py` Abschnitt 4 → Protokoll, Eintrag, Kommentar
3. `server.py` Abschnitt 6 → `is_editable()`
4. `server.py` Abschnitt 4 → Login
5. `server.py` Abschnitt 7 → eine GET-Route als Beispiel
