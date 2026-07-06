# Protokoll-Manager – Entwicklungsanleitung

Diese Anleitung beschreibt, wie die Anwendung **Protokoll-Manager** unter Windows 11 entwickelt wird: Architektur, Werkzeuge, Einrichtung und **Codebeispiele der wichtigsten Bausteine**.

**Begleitdokumente:**

| Dokument | Inhalt |
|----------|--------|
| `EINRICHTUNG.md` | Installation, Produktion, Backup |
| `docs/entwicklungsdoku/index.html` | Diese Anleitung als HTML (Word/PDF-Export) |
| `docs/benutzerdoku/` | Verweis → Handbuch in der App (`frontend/public/benutzerhandbuch/`) |

**Öffnen der HTML-Anleitung:** Datei `docs/entwicklungsdoku/index.html` im Explorer (Doppelklick) oder im Editor – nicht über die laufende Web-App.

**HTML aktualisieren** (nach Änderung an dieser Markdown-Datei):

```powershell
python docs/entwicklungsdoku/build_html.py
```

---

## 1. Funktionsüberblick

| Bereich | Kernfunktionen |
|---------|----------------|
| **Anmeldung** | Login mit Session-Cookie, Abmeldung, 30-Min-Inaktivität |
| **Protokolle** | Anlegen, Übersicht, Detail, Drucken, 72h-Bearbeitungsfrist |
| **Einträge** | Gesprächseinträge mit Thema, Zuordnung, Teilnehmer, Aufgaben, Kommentare |
| **Stammdaten** | Organisationen, Personen, Projektarten, Projekte, Schritte, Vorschläge (ab Rolle Mitarbeiter) |
| **Benutzer** | Rollen-Hierarchie, Benutzerverwaltung, Profil |
| **Backup** | SQLite-`.db` exportieren/importieren |
| **Betrieb** | Entwicklung (Vite + Flask); Produktion auf einem **Firmen-PC (Host)** im Firmennetz, Browser auf Clients |

Technisch: **React-SPA** (Frontend) + **Flask-REST-API** (Backend) + **SQLite** (`protokoll.db`).

---

## 2. Architektur

```
Browser (Firmennetz oder localhost)
  React + Tailwind (frontend/src)
  fetch('/api/...', { credentials: 'include' })
        │ HTTP
Flask (backend/)
  app.py, auth_routes.py, stammdaten.py, benutzer_routes.py, backup.py
        │
SQLite  protokoll.db
```

**Entwicklung:** Frontend `http://localhost:5173` (Vite), Proxy `/api` → `http://localhost:5000`.  
**Produktion:** API + `frontend/dist` auf Port 5000.

---

## 3. Werkzeugkiste – Windows 11

### 3.1 Pflichtprogramme

| Programm | Zweck | Beschaffung |
|----------|--------|-------------|
| Python 3.11+ | Backend, venv | **Produktion:** `INSTALL.bat` installiert per **winget** (`Python.Python.3.11`). **Entwicklung:** https://www.python.org/downloads/ (*Add to PATH*) |
| Node.js LTS | npm, Vite, Build | **Produktion:** `INSTALL.bat` / `BUILD-FRONTEND.bat` per **winget** (`OpenJS.NodeJS.LTS`). **Entwicklung:** https://nodejs.org/ |
| Git | Versionskontrolle | https://git-scm.com/download/win |
| VS Code / Cursor | Editor | https://code.visualstudio.com/ |

Falls winget nicht verfügbar ist: Python und Node manuell installieren und in PATH legen — siehe `EINRICHTUNG.md`. Ein separater Laufzeiten-Ordner außerhalb des Projekts ist **nicht** Teil der Installationsskripte.

### 3.2 Ergänzungen

| Tool | Zweck |
|------|--------|
| DB Browser for SQLite | Datenbank prüfen |
| Postman / Thunder Client | API testen |
| Windows Terminal | Backend + Frontend parallel |

### 3.3 Optional (Anfang)

Docker, PostgreSQL, Redux, TypeScript – im Projekt nicht erforderlich.

---

## 4. Einrichtung

### 4.1 Projektstruktur

```text
Protokoll-Manager/
├── backend/
├── frontend/
├── docs/
│   ├── projektdokumentation/   # IHK-Projektdoku
│   ├── projektpraesentation/   # Prüfungsfolien
│   ├── entwicklungsdoku/       # diese Anleitung
│   ├── benutzerdoku/           # Verweis (Quelle: frontend/public/benutzerhandbuch/)
│   └── git-doku/               # Git-Workflow
├── INSTALL.bat
├── DEINSTALL.bat
├── BUILD-FRONTEND.bat
└── START.bat
```

### 4.2 Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

API: `http://127.0.0.1:5000` — Demo-Daten: `python seed.py` (überschreibt leere DB).

### 4.3 Frontend

```powershell
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

### 4.4 Produktion

Auf dem Host-PC (Windows-Firmen-PC):

1. **`INSTALL.bat`** — winget für Python/Node (ggf. UAC), venv, pip, ggf. `seed.py`, `npm install` + `npm run build`
2. **`START.bat`** — Waitress + `frontend/dist` im Firmennetz (Port 5000)

Nach Frontend-Änderungen ohne Neuinstallation: **`BUILD-FRONTEND.bat`**, dann Anwendung neu starten.  
Artefakte entfernen (DB bleibt): **`DEINSTALL.bat`**.

Vollständig: `EINRICHTUNG.md`.

---

## 5. Entwicklungsreihenfolge (Phasen)

### Vorgehensmodell: iterativ-inkrementell

Es wird **ein Inkrement nach dem anderen** umgesetzt. Nach jedem Inkrement liegt etwas **testbares** vor (API per Postman, UI im Browser, oder beides). So bleibt der Fortschritt nachvollziehbar und Fehler lassen sich auf den zuletzt geänderten Bereich eingrenzen.

**Login, Session und Benutzerverwaltung** kommen **erst in späteren Inkrementen**, wenn die Kernfunktionen des Protokoll-Managers (Datenmodell, Protokoll-CRUD, Übersicht, Detail, Formular) stabil laufen. In der frühen Entwicklungsphase entfällt die API-Absicherung vorübergehend (oder es wird ein fester Entwicklungsmodus ohne Anmeldung genutzt), damit nicht bei jedem Test und jeder Änderung erneut angemeldet werden muss.

### Inkremente (empfohlene Reihenfolge)

| Inkrement | Inhalt | Test / Ergebnis |
|-----------|--------|-----------------|
| **1** | Flask, `config.py`, SQLite; Modelle **Protokoll**, **Eintrag** (minimal); `seed.py` mit Demo-Protokollen | DB Browser; GET `/api/protokolle` (ohne Auth in der Dev-Phase) |
| **2** | Weitere Modelle (Person, Organisation, Projektart, Projekt, Schritte, Lookup, …); vollständiges `seed.py` | Tabellen befüllt; alle GET-Endpunkte für Stammdaten und Protokolle |
| **3** | **CRUD** Protokoll und Eintrag in `app.py` (inkl. Teilnehmer, Lookups anlegen) | Postman: anlegen, lesen, ändern, löschen |
| **4** | Vite + React + Tailwind; `api.js`; **Übersicht** (Liste, einfache Suche) | Browser: Protokolle sichtbar, ohne Login-Schirm |
| **5** | **Detail** und **Formular** (anlegen/bearbeiten); Navigation `view` in `App.jsx` | End-to-end: Protokoll öffnen, bearbeiten, speichern |
| **6** | Filter/Sortierung, Prozessleiste Aufgaben; **Kommentare**, Aufgabenstatus; **72h-Regel** | Zeitlogik und Filter manuell prüfen |
| **7** | **Stammdaten**-API und -UI (Tabellen bearbeiten/löschen) — zunächst ohne Rollen-Gates | Stammdaten-Tab nutzbar |
| **8** | **Anmeldung**, Session-Cookie, `@app.before_request` für `/api/*`; Login-Seite; API-Schutz aktivieren | Anmelden, danach gleiche UI wie zuvor |
| **9** | **Rollen** (`roles.py`); Stammdaten nur ab Mitarbeiter; **Benutzerverwaltung**, Profil | Rollen und Menü sichtbarkeit |
| **10** | Backup/Import, Inaktivitäts-Timeout, Nav-Speicher (`sessionStorage`) | `.db`-Backup; Session-Timeout |
| **11** | Produktion (`run_production.py`, `BUILD-FRONTEND.bat`, `START.bat`); Handbuch; `INSTALL.bat` | LAN-/WLAN-Zugriff aus dem Büro |

### Hinweis zur API ohne Login (nur Entwicklung)

In den Inkrementen **1–7** kann der `before_request`-Handler für die API **auskommentiert** oder über eine Konfigurationsvariable (`DEV_SKIP_AUTH`) umgangen werden. Ab **Inkrement 8** wird die Absicherung dauerhaft aktiviert — entspricht dem Zielsystem.

---

## 6. Datenmodell

```
Benutzer ── erstellt/bearbeitet ── Protokoll
Organisation ── Person ── EintragPerson ── Eintrag ── Protokoll
Projektart ── Projekt / Prozessschritt / Prozessunterschritt
Lookup (typ, ort, thema, aufgabe)
```

**Benutzer** = Login (Session, Rolle). **Person** = Gesprächsteilnehmer (ohne Passwort).

---

## 7. Backend – Codebausteine

### 7.1 API-Schutz

```python
@app.before_request
def require_login_for_api():
    if request.method == 'OPTIONS':
        return None
    if not request.path.startswith('/api/'):
        return None
    if request.path.startswith('/api/auth/login') or request.path == '/api/auth/config':
        return None
    get_current_benutzer_or_401()
```

### 7.2 Modell Benutzer

```python
class Benutzer(db.Model):
    __tablename__ = 'benutzer'
    benutzer_id    = db.Column(db.Integer, primary_key=True)
    benutzername   = db.Column(db.String(100), nullable=False, unique=True)
    passwort_hash  = db.Column(db.String(255), nullable=False)
    rolle          = db.Column(db.String(30), nullable=False, default='user')
```

### 7.3 Login und Session

```python
establish_session(user.benutzer_id)
return jsonify({**user.to_dict_public(), **session_auth_meta()})
```

```python
def establish_session(benutzer_id: int) -> None:
    session.permanent = False
    session['benutzer_id'] = benutzer_id
    session['last_activity'] = time.time()
```

### 7.4 72-Stunden-Regel

```python
def is_editable(erstellt_am: datetime) -> bool:
    return (datetime.utcnow() - erstellt_am) <= timedelta(hours=72)
```

### 7.5 Rollen

```python
ROLLE_STUFE = {'user': 0, 'mitarbeiter': 1, 'admin': 2, 'developer': 3, 'masterdeveloper': 4}
```

### 7.7 Produktion

```python
from waitress import serve
serve(app, host='0.0.0.0', port=5000, threads=4)
```

---

## 8. Frontend – Codebausteine

### 8.1 Vite-Proxy

```javascript
server: { proxy: { '/api': { target: 'http://localhost:5000' } } }
```

### 8.2 API mit Cookie

```javascript
const fetchOpts = { credentials: 'include' };
export const login = (u, p) => post('/auth/login', { benutzername: u, passwort: p });
```

### 8.3 App-Shell

```jsx
if (!activeUser) return <Login … />;
return (/* view: overview | detail | create | … */);
```

### 8.4 Rollen im UI

```javascript
export function darfStammdaten(rolle) {
  return ROLLE_STUFE[normalizeRolle(rolle)] >= ROLLE_STUFE.mitarbeiter;
}
```

### 8.5 Inaktivität

Backend: `idleSeconds`, `sessionDeadline`. Frontend: Sekundenprüfung, Overlay, erneute Anmeldung.

---

## 9. API-Übersicht

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/auth/login` | Anmelden |
| GET | `/api/auth/me` | Aktueller Benutzer |
| GET | `/api/protokolle` | Protokolle |
| POST | `/api/protokolle` | Anlegen |
| GET | `/api/backup/database` | DB-Backup |

Vollständig in `backend/app.py`, `auth_routes.py`, `stammdaten.py`, `benutzer_routes.py`, `backup.py`.

---

## 10. Ordnerstruktur

```text
backend/     app.py, models.py, auth_routes.py, session_policy.py, …
frontend/src/  App.jsx, api.js, views/, components/, utils/, hooks/
```

---

## 11. Typische Fehler

| Problem | Lösung |
|---------|--------|
| API 401 | Anmelden; `credentials: 'include'` |
| CORS | Flask-CORS, Origin `localhost:5173` |
| Leere Übersicht | `lookups/all` nur für Mitarbeiter separat laden |
| Nur Port 5000 | Entwicklung: Port 5173 + `npm run dev` |

---

## 12. Checkliste

- [ ] Inkrement 1–3: Backend, Modelle, Protokoll-CRUD (ohne Auth in Dev)
- [ ] Inkrement 4–6: React-UI Übersicht, Detail, Formular, 72h, Kommentare
- [ ] Inkrement 7: Stammdaten
- [ ] Inkrement 8–9: Login, Session, Rollen, Benutzerverwaltung
- [ ] Inkrement 10–11: Backup, Produktion, Dokumentation

---

## 13. Nachschlagewerke und Lernquellen

Offizielle Dokumentation als **primäre Quelle**; Videos und UI-Bausteine als **Ergänzung**.

### 13.1 Backend

| Quelle | URL |
|--------|-----|
| Python-Tutorial | https://docs.python.org/3/tutorial/ |
| Flask | https://flask.palletsprojects.com/en/stable/quickstart/ |
| Flask-SQLAlchemy | https://flask-sqlalchemy.palletsprojects.com/ |
| Flask Sessions | https://flask.palletsprojects.com/en/stable/websecurity/#sessions |

### 13.2 Frontend

| Quelle | URL |
|--------|-----|
| React | https://react.dev/learn |
| Vite | https://vite.dev/guide/ |
| MDN fetch | https://developer.mozilla.org/de/docs/Web/API/Fetch_API |

### 13.3 Tailwind CSS

| Quelle | URL |
|--------|-----|
| Dokumentation | https://tailwindcss.com/docs |
| HyperUI (Bausteine) | https://www.hyperui.dev/ |

Im Projekt nach Klassen wie `rounded-xl`, `bg-violet-600`, `flex` suchen – Beispiele für das verwendete Styling.

### 13.4 Icons

**Lucide React:** https://lucide.dev/icons/

### 13.5 YouTube (ergänzend)

Aktuelle Tutorials zu Flask REST API, React Hooks, Vite, Tailwind. Pro Thema ein Video, danach direkt im Projekt umsetzen.

### 13.6 KI (sparsam)

Für Fehlermeldungen und kleine Snippets; generierten Code mit offizieller Doku abgleichen.
