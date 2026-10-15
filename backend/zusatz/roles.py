"""Rollenbasierte Berechtigungen (Stufenmodell)."""

ROLLE_USER = 'user'
ROLLE_MITARBEITER = 'mitarbeiter'
ROLLE_ADMIN = 'admin'
ROLLE_DEVELOPER = 'developer'
ROLLE_MASTERDEVELOPER = 'masterdeveloper'

VALID_ROLLEN = (
    ROLLE_USER,
    ROLLE_MITARBEITER,
    ROLLE_ADMIN,
    ROLLE_DEVELOPER,
    ROLLE_MASTERDEVELOPER,
)

ROLLE_STUFE = {
    ROLLE_USER: 0,
    ROLLE_MITARBEITER: 1,
    ROLLE_ADMIN: 2,
    ROLLE_DEVELOPER: 3,
    ROLLE_MASTERDEVELOPER: 4,
}

ROLLE_LABEL = {
    ROLLE_USER: 'Benutzer',
    ROLLE_MITARBEITER: 'Mitarbeiter',
    ROLLE_ADMIN: 'Administrator',
    ROLLE_DEVELOPER: 'Developer',
    ROLLE_MASTERDEVELOPER: 'Master Developer',
}


def normalize_rolle(rolle: str | None) -> str:
    r = (rolle or ROLLE_USER).strip().lower()
    return r if r in ROLLE_STUFE else ROLLE_USER


def _stufe(rolle: str | None) -> int:
    return ROLLE_STUFE[normalize_rolle(rolle)]


def hat_stammdaten_recht(rolle: str | None) -> bool:
    return _stufe(rolle) >= ROLLE_STUFE[ROLLE_MITARBEITER]


def hat_verwaltungsrecht(rolle: str | None) -> bool:
    return _stufe(rolle) >= ROLLE_STUFE[ROLLE_MITARBEITER]


def verwaltbare_rollen(actor_rolle: str | None) -> list[str]:
    if not hat_verwaltungsrecht(actor_rolle):
        return []
    actor_stufe = _stufe(actor_rolle)
    return [r for r in VALID_ROLLEN if ROLLE_STUFE[r] < actor_stufe]


def darf_rolle_zuweisen(actor_rolle: str | None, ziel_rolle: str | None) -> bool:
    return normalize_rolle(ziel_rolle) in verwaltbare_rollen(actor_rolle)


def kann_verwalten(
    actor_rolle: str | None,
    target_rolle: str | None,
    *,
    gleicher_benutzer: bool = False,
) -> bool:
    if gleicher_benutzer:
        return True
    if not hat_verwaltungsrecht(actor_rolle):
        return False
    return _stufe(target_rolle) < _stufe(actor_rolle)
