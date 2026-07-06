# Git: Dokumentation vom Code trennen (ein Repo)

Doku-Arbeit auf Branch **`dokumentation`**, Code auf **`main`**.  
Commits enthalten nur gestagte Dateien — mit `git add docs/` landet kein Code im Doku-Commit.

---

## Einmalig: Branch anlegen

```powershell
cd "c:\Dev\Protokoll-ManagerV2\Protokoll-Manager-BE"
git checkout main
git pull
git checkout -b dokumentation
git push -u origin dokumentation
```

---

## Doku committen und pushen (Alltag)

```powershell
cd "c:\Dev\Protokoll-ManagerV2\Protokoll-Manager-BE"
git checkout dokumentation
git pull
git status
git add docs/projektdokumentation/
git status
git commit -m "docs: Kapitel 2 ergänzt"
git push
```

Nur Dokumentation prüfen unter **Changes to be committed** — nicht `git add .`, wenn Code noch offen ist.

---

## Auf Code-Entwicklung wechseln

```powershell
git checkout main
git pull
```

---

## Code committen (ohne Doku)

```powershell
git checkout main
git add backend/ frontend/
git status
git commit -m "feat: Kurzbeschreibung der Änderung"
git push
```

Einzelne Dateien: `git add pfad/zur/datei`

---

## Doku-Branch mit aktuellem Code stand halten

Wenn auf `main` viel Neues liegt und du auf `dokumentation` weiter schreiben willst:

```powershell
git checkout dokumentation
git pull
git merge main
git push
```

Konflikte in `docs/` manuell lösen, dann:

```powershell
git add docs/
git commit -m "docs: Merge main"
git push
```

---

## Offenen Code-Entwurf kurz wegräumen (vor Doku-Commit)

```powershell
git stash push -m "WIP Code" -- backend frontend
git checkout dokumentation
git add docs/
git commit -m "docs: …"
git push
git checkout main
git stash pop
```

---

## Versehentlich zu viel gestaged

```powershell
git restore --staged .
git add docs/
```

---

## HTML nach Markdown-Änderung

```powershell
python docs/projektdokumentation/build_html.py
```

Entwicklungsanleitung (Markdown): `python docs/entwicklungsdoku/build_html.py`

---

## Commit-Nachrichten (Vorschlag)

| Präfix | Verwendung |
|--------|------------|
| `docs:` | Projektdokumentation, Handbuch, Entwicklungsanleitung |
| `feat:` | Neue Funktion (Code) |
| `fix:` | Bugfix (Code) |
