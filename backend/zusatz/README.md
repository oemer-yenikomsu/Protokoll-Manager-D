# Backend-Zusatz

Unterstützende Module – **nicht** der schlanke Prüfungs-Kern (`../kern/`).

## Herkunft des Codes (für die Prüfung)

- **Code-Vorlagen** (angepasst): Konfiguration, Session-Timeout, Schema-Migration, Seed – Muster aus Flask-/SQLAlchemy-Doku und Projektanleitungen.
- **KI-Unterstützung** bei Bedarf für **komplexere** oder zeitaufwändige Teile (z. B. Migration, Randfälle) – **von mir geprüft und eingebaut**.

## Module

| Datei | Inhalt |
|-------|--------|
| **config.py** | Pfade, Session-Dauer |
| **schema_migrate.py** | Datenbank-Schema anpassen |
| **session_policy.py** | Abmelden bei Inaktivität |
| **seed.py** | Demo-Daten |
| **run_production.py** | Betrieb mit Waitress |
| **roles.py** | vereinfachte Benutzerrolle |

Nicht mehr aktiv: `auth_routes.py`, `benutzer_routes.py`, `stammdaten.py`, `backup.py`
