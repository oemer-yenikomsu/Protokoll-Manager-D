"""Einfacher Login: alle angemeldeten Nutzer sind „Benutzer“ (80-h-Kern)."""

ROLLE_USER = 'user'

ROLLE_LABEL = {ROLLE_USER: 'Benutzer'}


def normalize_rolle(rolle: str | None) -> str:
    return ROLLE_USER
