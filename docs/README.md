# Dokumentation – Protokoll-Manager BE

Portfolio-Version: fokussiert auf **Entwicklung** und **App-eingebettete Handbücher**.

## Ordner

| Ordner | Inhalt | Öffnen |
|--------|--------|--------|
| [`entwicklungsdoku/`](entwicklungsdoku/) | Entwicklungsanleitung für Programmierer | `ENTWICKLUNGSANLEITUNG.md`, `index.html` |
| [`benutzerdoku/`](benutzerdoku/) | Verweis & Hinweise zum Benutzerhandbuch | `README.md` |
| [`git-doku/`](git-doku/) | Git: Doku-Branch vs. Code | `GIT-DOKUMENTATION.md` |

## In der Anwendung (nicht verschieben)

| Pfad | Zielgruppe |
|------|------------|
| `frontend/public/benutzerhandbuch/` | Alle angemeldeten Nutzer (Menü in der App) |
| `frontend/public/entwicklerdokumentation/` | Rolle Developer |

## Weitere Projekt-Docs (Root)

| Datei | Inhalt |
|-------|--------|
| `README.md` | Portfolio-Überblick, Demo-Login |
| `EINRICHTUNG.md` | Installation, lokaler Betrieb |

## HTML neu erzeugen

```powershell
python docs/entwicklungsdoku/build_html.py
```
