# Frontend-Zusatz

**UI, Zustand, Design** – nicht der Prüfungs-Kern (`../kern/`).

## Herkunft des Codes (für die Prüfung)

- **Code-Vorlagen** (angepasst), u. a. aus:
  - [Tailwind CSS](https://tailwindcss.com/docs) – Layout, Buttons, Tabellen, responsive Klassen
  - [React-Dokumentation](https://react.dev/) – Komponenten, Hooks
  - [Framer Motion](https://www.framer.com/motion/) – Animationen in `extraDesign.jsx`
  - [Lucide Icons](https://lucide.dev/) – Symbole in der Navigation
- **KI-Unterstützung** vor allem bei **komplexeren** Teilen (z. B. `ProtokollApp.jsx` Zustand/Navigation, PDF/Druck, viele verknüpfte Masken) – **von mir verstanden, getestet und angepasst**.

## Ordner

| Ort | Inhalt |
|-----|--------|
| **ansichten/** | Übersicht, Detail, Formular |
| **komponenten/** | Autocomplete, Dialoge, Felder |
| **extraDesign.jsx** | Animationen, Hintergrund |
| **hooks/**, **utils/** | z. B. Sitzungs-Timeout |
| **ProtokollApp.jsx** | Datenfluss und Zustand der App |

Styling: **Tailwind** in `index.css` und den Klassen in den Komponenten.
