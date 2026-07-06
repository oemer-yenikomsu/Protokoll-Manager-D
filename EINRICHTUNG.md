# Protokoll-Manager BE – Einrichtung (Produktion & Entwicklung)

Portfolio-Version mit **fiktiven Demo-Daten** (andere Logins und `SECRET_KEY` als eine private Betriebsversion). Ablauf und Funktionen sind identisch.

Die App besteht aus **Backend (Flask)** und **Frontend (React)**.

**Betrieb im Firmennetz** (LAN und WLAN): Es gibt **keinen dedizierten Anwendungsserver**. Die Anwendung läuft auf **einem Windows-Firmen-PC** (Anwender-/Mitarbeiter-PC, kurz **Host-PC**). Andere Rechner nutzen nur den **Browser**. **Welcher Firmen-PC** dauerhaft Host ist, kann bei **Abnahme/Einführung** festgelegt werden (bis dahin z. B. privates Entwicklungsnotebook oder ein freier Firmen-PC).

**PDF-Archiv:** Exportierte PDFs können in ein Verzeichnis auf dem **Dateiablage-Server** (Netzlaufwerk) abgelegt werden — getrennt von der Anwendung auf dem Host-PC.

**Entwicklung** erfolgt typischerweise auf einem **privaten Windows-Notebook**.

---

## Entwicklung vs. Produktion (beides parallel möglich)

| | Entwicklung (täglich) | Produktion (Firmennetz) |
|---|------------------------|---------------------------|
| **Backend** | `cd backend` → `venv` aktivieren → `python app.py` | `START.bat` oder `python run_production.py` |
| **Frontend** | `cd frontend` → `npm run dev` | einmal `BUILD-FRONTEND.bat`, dann fest in `frontend/dist` |
| **URL** | http://localhost:5173 (Vite) | http://\<Host-IP\>:5000 |
| **Hot Reload** | ja | nein – nach Änderungen neu bauen & Anwendung neu starten |

**Ja – Sie können weiter in der Entwicklungsumgebung coden, testen und erweitern.**  
Produktion ist ein **zweiter Startmodus**; `app.py` und `npm run dev` bleiben unverändert.

Typischer Ablauf nach Code-Änderungen:

1. Lokal testen mit `python app.py` + `npm run dev`
2. Wenn es passt: `BUILD-FRONTEND.bat` (nur bei Frontend-Änderungen)
3. Auf dem Host-PC: Dateien aktualisieren, `START.bat` neu starten

Nicht gleichzeitig **Produktion** und **Dev-Backend** auf Port 5000 starten – nur einer davon.

### Benutzerhandbuch (Web)

Für Endanwender liegt eine **Web-Anleitung** bereit:

| Umgebung | URL |
|----------|-----|
| Produktion | `http://<Host-IP>:5000/benutzerhandbuch/index.html` |
| Entwicklung (Vite) | `http://localhost:5173/benutzerhandbuch/index.html` |

Sitzungs-Timeout (Inaktivität): standardmäßig **30 Minuten**. Keine dauerhafte Anmeldung – Session-Cookie endet beim Schließen des Browsers.

**Timeout ändern (Standard 30 Minuten):** Umgebungsvariable `SESSION_IDLE_MINUTES` **vor** dem Start von Python setzen. Frontend und Backend nutzen denselben Wert über `/api/auth/config` und die Anmeldung (`sessionDeadline`).

```bat
cd backend
set SESSION_IDLE_MINUTES=30
call venv\Scripts\activate.bat
python app.py
```

Falls in der Windows-Umgebung noch `SESSION_IDLE_SECONDS=60` vom Test steht, in der Konsole `set SESSION_IDLE_SECONDS=` leeren oder Terminal neu öffnen – sonst gilt 60 Sekunden statt 30 Minuten.

Quelldatei: `frontend/public/benutzerhandbuch/index.html` (wird beim Build nach `frontend/dist` übernommen). In der App: **Menü → Benutzerhandbuch** (öffnet in neuem Tab).

---

## Erstinstallation auf dem Host-PC (Firmen-PC, Windows)

1. Projektordner kopieren (z. B. `C:\Protokoll-Manager\`)
2. **`INSTALL.bat`** doppelklicken – installiert bei Bedarf **Python** und **Node.js** per **winget** (ggf. UAC bestätigen), richtet venv ein, baut Frontend
3. **`START.bat`** starten – Konsole zeigt u. a. die URL im Firmennetz

Nur Frontend nachziehen: **`BUILD-FRONTEND.bat`**

Falls winget nicht funktioniert: Python/Node manuell installieren oder eigenes Backup nutzen (z. B. separater Ordner außerhalb des Projekts) und Pfade in Windows setzen – das ist **nicht** Teil von `INSTALL.bat`.

**Installation rückgängig:** **`DEINSTALL.bat`** entfernt `backend\venv`, `frontend\node_modules` und `frontend\dist`. **`backend\protokoll.db` bleibt erhalten.**

### Demo-Logins (nach seed / INSTALL.bat)

Passwort für alle Demo-Konten: **`Demo2026!`**

| Benutzername | Rolle |
|--------------|--------|
| demo | Benutzer |
| alice | Benutzer |
| bob | Benutzer |
| carol | Benutzer |
| dave | Benutzer |
| demo_admin | Administrator |

---

## Zugriff aus dem Netzwerk

1. Host-PC: `START.bat` laufen lassen
2. In der Konsole steht z. B. `Im Firmennetz: http://192.168.1.50:5000`
3. Andere PCs: dieselbe URL im Browser (Chrome/Edge/Firefox)
4. **Nicht** `localhost` auf anderen PCs – das ist immer der eigene Rechner

### Windows-Firewall

Beim ersten Start ggf. Freigabe für **Python** / **Privates Netzwerk** bestätigen.

Manuell: *Windows-Sicherheit* → *Firewall* → *Erweiterte Einstellungen* → Eingehende Regel für **TCP Port 5000** (Privat).

---

## Daten & Backup

- Datenbank: `backend\protokoll.db` (bleibt auf dem Host-PC)
- Backup/Import über das Menü in der App
- Zusätzlich: Datei `protokoll.db` regelmäßig kopieren (z. B. Taskplaner)

**Session-Schlüssel:** `START.bat` setzt einen festen Demo-`SECRET_KEY` (signiert nur Session-Cookies, nicht Benutzerpasswörter). Optional vor dem Start überschreiben: `set SECRET_KEY=...` in der Konsole oder als Windows-Umgebungsvariable. Nach Änderung müssen sich alle Benutzer neu anmelden.

---

## Wiederherstellen nach Ausfall (Herunterfahren, Energiesparmodus, Absturz, defekter PC)

Die App läuft nur, solange auf dem **Host-PC** die Anwendung gestartet ist (`START.bat` offen lassen oder Autostart). Nach einem Ausfall sind die **Daten in der Regel erhalten** (`backend\protokoll.db`), solange die Festplatte intakt ist.

### Kurz-Checkliste: „App geht wieder“

1. Host-PC **einschalten** und vollständig anmelden (Windows-Desktop).
2. **Keinen Energiesparmodus/Ruhezustand** auf dem Host-PC während des Betriebs (siehe unten).
3. Im Projektordner **`START.bat`** starten (Fenster offen lassen).
4. In der Konsole die **URL im Firmennetz** ablesen (z. B. `http://192.168.1.50:5000`).
5. Auf anderen PCs diese URL im Browser öffnen – ggf. **F5** / Cache leeren.
6. Mit einem bekannten Benutzer **anmelden**.

Wenn Schritt 3–6 funktionieren, ist der Betrieb wiederhergestellt. Eine komplette Neuinstallation ist meist **nicht** nötig.

---

### Nach normalem Herunterfahren oder Neustart von Windows

| Was passiert | Was Sie tun |
|--------------|-------------|
| Anwendung wurde beendet | PC starten → **`START.bat`** erneut ausführen |
| Daten | Bleiben in `backend\protokoll.db` erhalten |
| Andere PCs | Gleiche URL wie zuvor, sofern sich die **IP nicht geändert** hat |

**Tipp:** Verknüpfung zu `START.bat` auf dem Desktop oder Autostart (siehe unten), damit die Anwendung nach jedem Boot automatisch startet.

---

### Nach Energiesparmodus, Ruhezustand oder „Monitor aus“

Windows pausiert laufende Programme oft im Ruhezustand – der Protokoll-Manager ist dann **nicht erreichbar**.

1. PC **aufwecken** und anmelden.
2. Altes Konsolenfenster von `START.bat` prüfen: reagiert es nicht mehr → mit **Strg+C** beenden.
3. **`START.bat`** neu starten.
4. Im Firmennetz testen (LAN oder WLAN).

**Empfehlung für den Host-PC (Windows):**

- *Einstellungen* → *System* → *Strom & Akku* → Ruhezustand auf dem Host-PC: **Nie** (bei Netzbetrieb).
- Optional: *Energie sparen* → Netzwerkadapter → Energiesparen deaktivieren, damit die Verbindung stabil bleibt.

---

### Nach Absturz, Stromausfall oder „blauem Bildschirm“

1. PC neu starten.
2. Prüfen, ob der Ordner noch da ist: `backend\protokoll.db`, `backend\venv`, `frontend\dist\index.html`.
3. **`START.bat`** starten.
4. In der App einloggen und stichprobenartig Protokolle öffnen.

| Symptom | Maßnahme |
|---------|----------|
| Start bricht mit „Frontend nicht gebaut“ ab | `BUILD-FRONTEND.bat` ausführen |
| Start bricht mit „venv fehlt“ ab | `INSTALL.bat` ausführen |
| Login geht, aber Daten fehlen | Letztes Backup einspielen (Menü *Backup/Import* oder Kopie von `protokoll.db`) |
| `protokoll.db` beschädigt | Backup `.db` importieren; ohne Backup ggf. `INSTALL.bat` auf leerer DB (→ **Datenverlust**) |

Nach Stromausfall kann SQLite theoretisch beschädigt sein – deshalb **regelmäßige Backups** (Menü oder Dateikopie).

---

### Wenn der Host-PC kaputt ist oder ersetzt wird

1. **Letztes Backup** sichern: Datei aus dem Menü *Backup* oder Kopie von `backend\protokoll.db` (z. B. von Netzlaufwerk/USB).
2. Auf dem **neuen PC**: Projektordner installieren wie unter [Erstinstallation](#erstinstallation-auf-dem-host-pc-firmen-pc-windows) (`INSTALL.bat`).
3. Gesicherte **`protokoll.db`** nach `backend\` kopieren (alte Datei ersetzen, `START.bat` noch nicht starten).
4. **`START.bat`** starten und Daten prüfen.

Ohne Backup: Neuinstallation mit leerer DB (`INSTALL.bat` legt bei fehlender Datei Demo-Daten an) – nur als letzte Option.

Projektordner vom alten PC mitkopieren (kompletter Ordner inkl. `venv` und `dist`) geht oft schneller als Neuinstallation – auf dem neuen PC trotzdem einmal `START.bat` testen.

---

### Wenn sich die Host-IP geändert hat (neues WLAN, neuer Router)

Die Datenbank ist davon unberührt. Andere PCs brauchen die **neue** Adresse:

1. Am Host-PC: `START.bat` → in der Konsole `Im Firmennetz: http://…` ablesen.
2. Oder am Host-PC in der Eingabeaufforderung: `ipconfig` → *IPv4-Adresse*.
3. Diese URL auf allen Client-PCs im Browser verwenden und ggf. als Lesezeichen speichern.

---

### Anwendung automatisch nach Windows-Anmeldung starten (optional)

Damit nach jedem Neustart niemand `START.bat` vergessen muss:

1. *Win+R* → `shell:startup` → Enter.
2. Verknüpfung zu **`START.bat`** in diesen Ordner legen.

Oder: *Aufgabenplanung* → Aufgabe „Bei Anmeldung“ → Programm `START.bat`, Startverzeichnis = Projektordner, „Ausführen, auch wenn Benutzer nicht angemeldet“ nur wenn gewünscht.

Hinweis: Das Konsolenfenster sollte für Betrieb sichtbar bleiben oder in eine Log-Datei umgeleitet werden – für den Dauerbetrieb reicht meist die Verknüpfung im Autostart.

---

### Was Nutzer im Firmennetz merken, wenn der Host-PC die Anwendung nicht bereitstellt

- Browser zeigt „Seite nicht erreichbar“ / Zeitüberschreitung.
- Keine Datenverluste auf Client-PCs – es gibt dort nichts zu retten.
- Nach Neustart von `START.bat` auf dem Host-PC einfach **dieselbe URL** erneut öffnen und anmelden.

---

## Manuelle Befehle (optional)

```powershell
# Produktion
cd backend
.\venv\Scripts\activate
python run_production.py

# Entwicklung Backend
python app.py

# Entwicklung Frontend
cd frontend
npm run dev
```

Umgebungsvariablen (optional):

- `PORT=8080` – anderer Port
- `HOST=0.0.0.0` – erreichbar im Firmennetz (LAN/WLAN)

---

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Weiße Seite / 503 | `BUILD-FRONTEND.bat` ausführen |
| Andere PCs erreichen Host nicht | Firewall, gleiches WLAN, richtige IP |
| Login schlägt fehl nach Kopie | `protokoll.db` und `backend\venv` mitkopieren oder `INSTALL.bat` auf Host-PC |
| Port belegt | anderen Prozess auf 5000 beenden oder `set PORT=8080` vor Start |
| Nach Neustart nicht erreichbar | `START.bat` erneut starten; Energiesparmodus deaktivieren |
| IP hat sich geändert | Neue URL aus `START.bat`-Konsole oder `ipconfig` |

---

## Kein einzelnes .exe-Programm

Statt einer monolithischen `.exe` nutzen Sie das **Starter-Paket** (Batch-Dateien + Python + gebautes Frontend). Das ist für Wartung und Backup üblich und stabiler.

Optional später: Installer mit [Inno Setup](https://jrsoftware.org/isinfo.php), der dieselben Dateien und Verknüpfungen zu `START.bat` anlegt.
