# Bilder für die Projektdokumentation

## Protokoll-Manager App-Icon (aus dem Web-UI-Code)

**Im Repository gibt es kein fertiges PNG** — das Icon ist im UI aufgebaut aus:

- Verlauf `from-violet-600` → `to-indigo-600` (`#7c3aed` → `#4f46e5`)
- Lucide-Icon **`file-text`** (wie in `Login.jsx`, `App.jsx`, Benutzerhandbuch)

**Quelldatei (Vektor, maßgeblich):**  
`frontend/public/app-icon.svg`

| Datei | Verwendung |
|-------|------------|
| **`protokoll-manager-app-icon.png`** | Word / Druck (512 px) |
| `protokoll-manager-app-icon-1024.png` | hohe Auflösung |
| `protokoll-manager-app-icon-256.png` | klein |
| `protokoll-manager-app-icon.svg` | Kopie der Quelldatei |

**Word:** Einfügen → Bilder → `protokoll-manager-app-icon.png`

**PNG neu erzeugen** (Node.js/npm nötig):

```text
python docs/projektdokumentation/export_app_icon.py
```

**Nicht** das Browser-Tab-Icon: `frontend/public/favicon.svg` (Blitz) ist ein anderes Symbol.

---

`ihk-logo-vorlage.jpeg` — IHK/Macke-Deckblatt (Nutzung vor Abgabe klären).

Weitere Bilder hier ablegen, in `PROJEKTDOKUMENTATION.md` verlinken, dann `python docs/projektdokumentation/build_html.py`.
Hinweis: Die IHK-Projektdoku liegt unter `docs/projektdokumentation/PROJEKTDOKUMENTATION.md`; von dort werden Bilder per Pfad `../../media/...` eingebunden.
