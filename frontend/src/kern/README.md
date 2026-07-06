# Frontend-Kern (Prüfungsversion)

**Mein Code für die mündliche Prüfung** – Masken und Design in `../zusatz/`.

## Herkunft des Codes (für die Prüfung)

- **Eigenentwicklung**: welche API-Funktion zu welcher Anforderung gehört, Verbindung zum Backend.
- **Code-Vorlagen** (angepasst), u. a. aus:
  - [React-Dokumentation](https://react.dev/) (`createRoot`, Komponenten)
  - [MDN `fetch`](https://developer.mozilla.org/de/docs/Web/API/Fetch_API) (HTTP mit Cookies)
  - Vite-React-Startprojekt (Einstieg `main.jsx`)

**Tailwind-Layout und Masken** liegen bewusst **nicht** hier, sondern in `../zusatz/` (dort auch KI bei komplexeren UI-Teilen).

## Dateien

| Datei | Abschnitte | Inhalt |
|-------|------------|--------|
| **main.jsx** | 1–2 | React an `#root` |
| **App.jsx** | 1–2 | Einstieg → `ProtokollApp` |
| **api.js** | 1–7 | `fetch` zu `/api/...` |

Einstieg von Vite: `src/main.jsx` → importiert `kern/main.jsx`.

## Anforderungen → Code

| ID | Thema | Wo |
|----|--------|-----|
| F09 | Login | api.js §4 |
| F04–F05 | Daten laden, Suche | api.js §5 (Filter in zusatz/) |
| F01–F02 | Speichern | api.js §6 |
| F06–F08 | Tabelle, PDF, Export | **zusatz/** (nicht im Kern) |
| NF02 | Bedienung | **zusatz/** (Tailwind, Layout) |

## Mündliche Prüfung – Reihenfolge

1. `main.jsx` → React-Start
2. `App.jsx` → eine Zeile, Rest in `zusatz/`
3. `api.js` §3 → `get`/`post`/`put`
4. `api.js` §4 → `login()`
5. `api.js` §6 → `createProtokoll()` als Beispiel

Backend-Pendant: `backend/kern/server.py` (gleiche Abschnitts-Logik).
