# Protokoll-Manager BE

Portfolio-Version einer Webanwendung zur Erfassung und Verwaltung von Gesprächs- und Besprechungsprotokollen.

Dieses Repository ist eine **öffentliche Demo-Variante** für Bewerbungen und Code-Reviews. Es enthält **fiktive Demo-Daten** und **keine Betriebskonfiguration** aus einem realen Firmeneinsatz.

## Highlights

- **Full-Stack:** React 19 + Vite + Tailwind im Frontend, Flask + SQLAlchemy + SQLite im Backend
- **Rollen & Sitzungen:** Login, Session-Timeout, rollenbasierte Bereiche
- **Protokoll-Workflow:** Anlegen, Bearbeiten (72-h-Regel), Kommentare, Aufgaben, PDF-Export
- **Stammdaten:** Organisationen, Personen, Projekte, Prozessstrukturen
- **Backup/Import:** SQLite-Backup über die Oberfläche

## Tech-Stack

| Teil | Technologie |
|------|-------------|
| Backend | Python 3.11+, Flask, SQLAlchemy, Waitress |
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Datenbank | SQLite |

## Schnellstart (Entwicklung)

```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python app.py

# Frontend (zweites Terminal)
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- API: http://127.0.0.1:5000  

### Demo-Zugang (nach `python seed.py`)

| Benutzer | Passwort | Rolle |
|----------|----------|-------|
| `demo` | `Demo2026!` | Benutzer |
| `demo_admin` | `Demo2026!` | Administrator |

Weitere Demo-Benutzer: `alice`, `bob`, `carol`, `dave` (gleiches Passwort).

## Produktion (lokal testen)

1. `INSTALL.bat` – richtet Python-Umgebung ein und baut das Frontend  
2. `SECRET_KEY` setzen (Pflicht), dann `START.bat`  
   - Beispiel: `START.bat.example`  
   - Oder: `set SECRET_KEY=ihr-eigener-schluessel` vor dem Start  

```powershell
set SECRET_KEY=mein-geheimer-schluessel
START.bat
```

## Projektstruktur

```text
backend/          Flask-API, Modelle, Migration, Seed
frontend/src/     React-Oberfläche
frontend/public/  Benutzer- und Entwicklerhandbuch (statisch)
docs/             Entwicklungsdokumentation
```

## Hinweise

- **Keine echten Firmendaten** – alle Organisationen und Benutzer sind fiktiv.
- **`SECRET_KEY` nie committen** – siehe `.env.example`.
- Datenbank (`protokoll.db`) wird lokal erzeugt und ist nicht im Repository.

## Lizenz

Code zur Portfolio-Darstellung. Demo-Passwörter nur für Testzwecke verwenden.
