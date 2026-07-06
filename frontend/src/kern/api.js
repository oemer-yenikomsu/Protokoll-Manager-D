/**
 * ================================================================================
 * KERN-FRONTEND – Verbindung zum Flask-Backend (Prüfungsversion)
 * ================================================================================
 * Eine Funktion = ein Aufruf an /api/... (REST). UI nutzt diese exports in zusatz/.
 *
 * | Abschnitt | Inhalt           | Anforderung   |
 * |-----------|------------------|---------------|
 * | 4         | login, logout    | F09           |
 * | 5         | getProtokolle …  | F04, F05      |
 * | 6         | create/update    | F01–F02, F03* |
 * | 7         | Stammdaten anlegen | Hilfe für F01 |
 *
 * * F03 (72 h) wird im Backend geprüft – Frontend zeigt nur Meldung.
 * F06–F08 (Tabelle, PDF, Ausblenden): nur in zusatz/ (React-Komponenten).
 *
 * Herkunft (grob): Eigenentwicklung, fetch-Muster aus MDN / React-Doku angepasst.
 * ================================================================================
 */

// --- 1) Basis-URL und Einstellungen --------------------------------------------
const BASE = '/api';

// credentials: 'include' → Session-Cookie vom Login mit senden (F09)
const fetchOpts = { credentials: 'include' };

// --- 2) Hilfsfunktion: Antwort prüfen und JSON zurückgeben ---------------------
async function parseJsonResponse(r) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || data.description || data.error || `HTTP ${r.status}`);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- 3) Kurzschreibweisen: GET, POST, PUT, PATCH, DELETE -----------------------
const get = (url) => fetch(`${BASE}${url}`, fetchOpts).then(parseJsonResponse);

const post = (url, body) =>
  fetch(`${BASE}${url}`, {
    ...fetchOpts,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  }).then(parseJsonResponse);

const put = (url, body) =>
  fetch(`${BASE}${url}`, {
    ...fetchOpts,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(parseJsonResponse);

const patch = (url, body) =>
  fetch(`${BASE}${url}`, {
    ...fetchOpts,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(parseJsonResponse);

const del = (url) =>
  fetch(`${BASE}${url}`, { ...fetchOpts, method: 'DELETE' }).then(parseJsonResponse);

// --- 4) Login (F09) ------------------------------------------------------------
/** Benutzername + Passwort → Backend setzt Session-Cookie */
export const login = (benutzername, passwort) =>
  post('/auth/login', { benutzername, passwort });

export const logout = () => post('/auth/logout');

/** Nach Seiten-Reload: noch eingeloggt? */
export const getAuthMe = () => get('/auth/me');

/** Inaktivitäts-Timeout (Minuten) für Auto-Logout */
export const getAuthConfig = () => get('/auth/config');

/** Anzeigenamen (z. B. „Wer hat erstellt?“) */
export const getBenutzer = () => get('/benutzer');

// --- 5) Beim Start: alle Tabellen laden (F04) – Suche filtert in zusatz/ (F05) -
export const getProtokolle = () => get('/protokolle');
export const getEintraege = () => get('/eintraege');
export const getEintragPersonen = () => get('/eintrag-person');
export const getKommentare = () => get('/kommentare');
export const getPersonen = () => get('/personen');
export const getOrganisationen = () => get('/organisationen');
export const getProjektarten = () => get('/projektarten');
export const getProjekte = () => get('/projekte');
export const getProzessschritte = () => get('/prozessschritte');
export const getProzessunterschritte = () => get('/prozessunterschritte');
/** Vorschläge: Typ, Ort, Thema, Aufgabe */
export const getLookups = () => get('/lookups');

// --- 6) Protokolle und Einträge speichern / ändern / löschen (F01–F02) ---------
export const createProtokoll = (data) => post('/protokolle', data);
export const updateProtokoll = (id, data) => put(`/protokolle/${id}`, data);
export const deleteProtokoll = (id) => del(`/protokolle/${id}`);

export const createEintrag = (data) => post('/eintraege', data);
export const updateEintrag = (id, data) => put(`/eintraege/${id}`, data);
export const deleteEintrag = (id) => del(`/eintraege/${id}`);
export const updateAufgabeStatus = (eintrag_id, task_index, new_status) =>
  patch(`/eintraege/${eintrag_id}/aufgabe-status`, { task_index, new_status });

export const createKommentar = (data) => post('/kommentare', data);

// --- 7) Beim Ausfüllen: neue Person, Ort, Projekt … (unterstützt F01) ----------
export const createPerson = (data) => post('/personen', data);
export const updatePerson = (id, data) => patch(`/personen/${id}`, data);
export const createOrganisation = (data) => post('/organisationen', data);
export const createProjektart = (data) => post('/projektarten', data);
export const createProjekt = (data) => post('/projekte', data);
export const createProzessschritt = (data) => post('/prozessschritte', data);
export const createProzessunterschritt = (data) => post('/prozessunterschritte', data);
export const createSchritt = createProzessschritt;
export const createUnterschritt = createProzessunterschritt;
export const createLookup = (data) => post('/lookups', data);
