# Protokoll-Manager BE – Einrichtung

Kurzanleitung für die **Portfolio-/Demo-Version**. Für den lokalen Entwicklungsbetrieb.

## Voraussetzungen

- Windows 10/11
- Python 3.11+
- Node.js 20+ (für Frontend-Build)

## Erstinstallation

1. Repository klonen
2. **`INSTALL.bat`** ausführen (venv, Abhängigkeiten, Frontend-Build)
3. Demo-Datenbank wird bei leerer DB automatisch per `seed.py` angelegt

## Entwicklung starten

```powershell
cd backend
.\venv\Scripts\activate
python app.py
```

```powershell
cd frontend
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://127.0.0.1:5000  

## Demo-Login

Nach `python seed.py`:

| Benutzer | Passwort |
|----------|----------|
| `demo` | `Demo2026!` |
| `demo_admin` | `Demo2026!` |

## Produktion (lokal)

1. Frontend bauen: `BUILD-FRONTEND.bat`
2. **`SECRET_KEY` setzen** (Pflicht – signiert Session-Cookies, nicht Benutzerpasswörter)
3. `START.bat` ausführen

```bat
set SECRET_KEY=ihr-eigener-zufaelliger-schluessel
START.bat
```

Alternativ: `START.bat.example` als Vorlage kopieren und anpassen.

## Daten & Backup

- Datenbank: `backend\protokoll.db` (lokal, nicht im Git)
- Backup über Menü in der App oder Dateikopie

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Weiße Seite / 503 | `BUILD-FRONTEND.bat` |
| `SECRET_KEY` fehlt | `set SECRET_KEY=...` vor Start |
| Login schlägt fehl | `python seed.py` im Ordner `backend` |
| Port belegt | `set PORT=8080` vor Start |
