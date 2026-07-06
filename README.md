# Protokoll-Manager BE

Webanwendung zur Erfassung und Verwaltung von Gesprächs- und Besprechungsprotokollen.

Öffentliche **Portfolio-Version** mit fiktiven Demo-Daten (andere Zugangsdaten und `SECRET_KEY` als die Betriebsversion).

## Technik

| Teil | Technologie |
|------|-------------|
| Backend | Python 3.11+, Flask, SQLAlchemy, SQLite |
| Frontend | React 19, Vite, Tailwind CSS |
| Produktion | Waitress, statisches `frontend/dist` |

## Schnellstart (Entwicklung)

```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend (zweites Terminal)
cd frontend
npm install
npm run dev
```

- Anwendung: http://localhost:5173  
- API: http://127.0.0.1:5000  

Demo-Login (nach `INSTALL.bat` oder `python seed.py`): Benutzer `demo`, Passwort `Demo2026!`

## Produktion (Firmennetz, Firmen-PC als Host)

1. `INSTALL.bat` — installiert bei Bedarf Python und Node.js per **winget**, richtet venv ein, baut das Frontend  
2. `START.bat` — Anwendung auf dem **Host-PC** im Firmennetz  

Nur Frontend nachziehen (nach Code-Änderungen): `BUILD-FRONTEND.bat`  
Installation rückgängig: `DEINSTALL.bat` (Datenbank bleibt erhalten)

Details: **`EINRICHTUNG.md`**

## Dokumentation

Übersicht aller Ordner: **`docs/README.md`**

| Ordner / Datei | Inhalt |
|----------------|--------|
| `EINRICHTUNG.md` | Installation, Betrieb, Backup, Wiederherstellung |
| `docs/entwicklungsdoku/` | Entwicklung, Architektur, Codebeispiele |
| `docs/git-doku/` | Git-Workflow |
| `frontend/public/benutzerhandbuch/` | Endanwender-Handbuch (läuft in der App) |
| `frontend/public/entwicklerdokumentation/` | Entwickler-Handbuch (Rolle Developer) |

## Projektstruktur (kurz)

```text
backend/          Flask-API, Datenbank, Migration, seed
frontend/src/     React-Oberfläche
frontend/dist/    Produktions-Build (nach npm run build)
docs/             siehe docs/README.md
```

## Skripte

| Datei | Funktion |
|-------|----------|
| `INSTALL.bat` | winget (Python/Node), venv, pip, ggf. seed, `npm install` + Build |
| `DEINSTALL.bat` | venv, `node_modules`, `dist` entfernen; DB bleibt |
| `BUILD-FRONTEND.bat` | nur `npm run build` (Node per winget falls nötig) |
| `START.bat` | Produktionsserver (setzt Demo-`SECRET_KEY` für Sessions) |

## Lizenz / Hinweis

Portfolio-Demo mit fiktiven Daten. `SECRET_KEY` optional per Umgebungsvariable überschreiben (Standard in `START.bat`).
