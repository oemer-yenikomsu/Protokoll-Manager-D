# Entwicklungsdokumentation

Anleitung für Entwickler: Architektur, Werkzeuge, Codebeispiele.

| Datei | Rolle |
|-------|--------|
| `ENTWICKLUNGSANLEITUNG.md` | Quelle (Markdown) |
| `index.html` | HTML-Ansicht, Word-Export per Browser |
| `build_html.py` | Markdown → `index.html` |

## Bearbeiten & Build

```powershell
# Nach Änderung an ENTWICKLUNGSANLEITUNG.md:
python docs/entwicklungsdoku/build_html.py
```

`index.html` im Explorer öffnen (nicht über die laufende Web-App).

**Ergänzend in der App:** `frontend/public/entwicklerdokumentation/` (Rolle Developer).  
**Betrieb:** `EINRICHTUNG.md` im Projektroot.
