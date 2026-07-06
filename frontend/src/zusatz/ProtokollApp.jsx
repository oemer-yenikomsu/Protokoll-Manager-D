/**
 * Zusatz – gesamter App-Zustand und Navigation (nicht im Kern).
 * Vorlagen: React (Hooks, Komponenten), Tailwind-Layout-Blöcke; angepasst ans Projekt.
 * Komplexere Teile (Zustand, viele Masken, PDF/Export): mit KI unterstützt, von mir geprüft.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, DekoHintergrund, IdleSperre, LadeSpinner } from './extraDesign.jsx';
import { FileText, List, FilePenLine, Menu as MenuIcon, LogOut, BookOpen } from 'lucide-react';
import * as api from '../kern/api.js';
import { DeleteModal } from './komponenten/UIComponents.jsx';
import { Overview } from './ansichten/Overview.jsx';
import { Detail } from './ansichten/Detail.jsx';
import { Create } from './ansichten/ProtocolForm.jsx';
import { Login } from './ansichten/Login.jsx';
import { resolveProjektartId, getProjektartLabel } from './utils/projektart.js';
import { readStoredNav, writeStoredNav } from './utils/navStorage.js';
import { emptyTeilnehmerPick } from './utils/teilnehmerPick.js';
import { HANDBUCH_URL } from './constants/session.js';
import { loadAuthIdleMs } from './utils/loadAuthConfig.js';
import { useIdleSession } from './hooks/useIdleSession.js';

const DEFAULT_IDLE_SECONDS = 30 * 60;

const initialNav = readStoredNav();

const normLabel = (s) => (s ?? '').trim().toLowerCase();
const listHasLabel = (list, val) => list.some((x) => normLabel(x) === normLabel(val));

export default function ProtokollApp() {
  const pendingCreateRef = useRef(new Map());
  const [activeUser, setActiveUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const navMenuRef = useRef(null);
  const [view, setView] = useState(initialNav.view);
  const [selectedProtokollId, setSelectedProtokollId] = useState(initialNav.selectedProtokollId);
  const [isLoading, setIsLoading] = useState(true);

  const [tblProjektart, setTblProjektart] = useState([]);
  const [tblProjekt, setTblProjekt] = useState([]);
  const [tblSchritt, setTblSchritt] = useState([]);
  const [tblUnterschritt, setTblUnterschritt] = useState([]);
  const [tblBenutzer, setTblBenutzer] = useState([]);
  const [tblPerson, setTblPerson] = useState([]);
  const [tblOrganisation, setTblOrganisation] = useState([]);
  const [bekannteTypen, setBekannteTypen] = useState([]);
  const [bekannteOrte, setBekannteOrte] = useState([]);
  const [bekannteThemen, setBekannteThemen] = useState([]);
  const [bekannteAufgaben, setBekannteAufgaben] = useState([]);

  const [tblProtokoll, setTblProtokoll] = useState([]);
  const [tblEintrag, setTblEintrag] = useState([]);
  const [tblEintragPerson, setTblEintragPerson] = useState([]);
  const [tblKommentar, setTblKommentar] = useState([]);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(DEFAULT_IDLE_SECONDS);
  const [sessionDeadline, setSessionDeadline] = useState(0);
  const [idleLock, setIdleLock] = useState(false);
  const idleSecondsRef = useRef(DEFAULT_IDLE_SECONDS);
  const sessionDeadlineRef = useRef(0);
  const idleLockRef = useRef(false);
  const activeUserRef = useRef(null);

  const closeNavMenu = () => setNavMenuOpen(false);

  const applyIdleConfig = async () => {
    const cfg = await loadAuthIdleMs();
    idleSecondsRef.current = cfg.idleSeconds;
    setIdleSeconds(cfg.idleSeconds);
  };

  const syncSessionFromUser = (me) => {
    const sec = Number(me?.idleSeconds) || idleSecondsRef.current;
    idleSecondsRef.current = sec;
    setIdleSeconds(sec);
    const now = Math.floor(Date.now() / 1000);
    const dl = Number(me?.sessionDeadline);
    const deadline = Number.isFinite(dl) && dl > now ? dl : now + sec;
    sessionDeadlineRef.current = deadline;
    setSessionDeadline(deadline);
  };

  const bumpSessionDeadline = () => {
    if (idleLockRef.current || !activeUserRef.current) return;
    const deadline = Math.floor(Date.now() / 1000) + idleSecondsRef.current;
    sessionDeadlineRef.current = deadline;
    setSessionDeadline(deadline);
  };

  useEffect(() => {
    applyIdleConfig();
  }, []);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  useEffect(() => {
    idleLockRef.current = idleLock;
  }, [idleLock]);

  useEffect(() => {
    if (!navMenuOpen) return;
    const onOutsideClick = (e) => {
      if (navMenuRef.current?.contains(e.target)) return;
      setNavMenuOpen(false);
    };
    const t = window.setTimeout(() => {
      document.addEventListener('click', onOutsideClick, true);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('click', onOutsideClick, true);
    };
  }, [navMenuOpen]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [
        protokolle, eintraege, eintragPersonen, kommentare, benutzer,
        personen, organisationen, projektarten, projekte, schritte, unterschritte, lookups
      ] = await Promise.all([
        api.getProtokolle(), api.getEintraege(), api.getEintragPersonen(),
        api.getKommentare(), api.getBenutzer(), api.getPersonen(), api.getOrganisationen(),
        api.getProjektarten(), api.getProjekte(), api.getProzessschritte(),
        api.getProzessunterschritte(), api.getLookups()
      ]);
      setTblProtokoll(protokolle); setTblEintrag(eintraege);
      setTblEintragPerson(eintragPersonen); setTblKommentar(kommentare);
      setTblBenutzer(benutzer); setTblPerson(personen); setTblOrganisation(organisationen);
      setTblProjektart(projektarten); setTblProjekt(projekte); setTblSchritt(schritte); setTblUnterschritt(unterschritte);
      setBekannteTypen(lookups.typen || []); setBekannteOrte(lookups.orte || []);
      setBekannteThemen(lookups.themen || []); setBekannteAufgaben(lookups.aufgaben || []);
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
    } finally {
      setIsLoading(false);
      bumpSessionDeadline();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getAuthMe();
        setActiveUser(me);
        syncSessionFromUser(me);
        await loadAllData();
        bumpSessionDeadline();
      } catch (err) {
        if (err.status === 401) setActiveUser(null);
        else console.error('Auth/Daten:', err);
      } finally {
        setAuthChecked(true);
        setIsLoading(false);
      }
    })();
  }, []);

  const applyNavFromStorage = () => {
    const nav = readStoredNav();
    setView(nav.view);
    setSelectedProtokollId(nav.selectedProtokollId);
  };

  const tryRestoreSession = async () => {
    try {
      const me = await api.getAuthMe();
      setIdleLock(false);
      idleLockRef.current = false;
      setLoginError('');
      const hadUser = !!activeUserRef.current;
      setActiveUser(me);
      syncSessionFromUser(me);
      if (!hadUser) await loadAllData();
      bumpSessionDeadline();
      return true;
    } catch {
      return false;
    }
  };

  const tryRestoreSessionRef = useRef(tryRestoreSession);
  tryRestoreSessionRef.current = tryRestoreSession;

  const handleLogin = async (benutzername, passwort) => {
    setLoginError('');
    setLoginLoading(true);
    setIdleLock(false);
    try {
      const me = await api.login(benutzername, passwort);
      setActiveUser(me);
      await applyIdleConfig();
      syncSessionFromUser(me);
      await loadAllData();
      bumpSessionDeadline();
      applyNavFromStorage();
    } catch (err) {
      setLoginError(err.status === 401 ? 'Ungültige Anmeldedaten.' : (err.message || 'Anmeldung fehlgeschlagen.'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async (reason) => {
    closeNavMenu();
    setIdleLock(false);
    try { await api.logout(); } catch { /* ignore */ }
    setActiveUser(null);
    if (reason !== 'idle') {
      setView('overview');
      setSelectedProtokollId(null);
    }
    if (reason === 'idle') {
      const mins = Math.round(idleSecondsRef.current / 60);
      setLoginError(
        `Ihre Sitzung ist nach ${mins} Minuten Inaktivität abgelaufen. Bitte melden Sie sich erneut an.`
      );
    }
  };

  const handleLogoutRef = useRef(handleLogout);
  handleLogoutRef.current = handleLogout;

  const finalizeIdleExpiryRef = useRef(null);

  const finalizeIdleExpiry = async () => {
    if (!activeUserRef.current || idleLockRef.current) return;
    idleLockRef.current = true;
    closeNavMenu();
    setIdleLock(true);
    try { await api.logout(); } catch { /* ignore */ }
    const mins = Math.round(idleSecondsRef.current / 60);
    setLoginError(
      `Ihre Sitzung ist nach ${mins} Minuten Inaktivität abgelaufen. Bitte melden Sie sich erneut an.`
    );
  };

  finalizeIdleExpiryRef.current = finalizeIdleExpiry;

  const dismissIdleLock = () => {
    idleLockRef.current = false;
    setIdleLock(false);
    setActiveUser(null);
  };

  useIdleSession({
    active: !!activeUser && !idleLock,
    idleSeconds,
    sessionDeadline,
    onBumpDeadline: bumpSessionDeadline,
    onIdleExpire: () => finalizeIdleExpiryRef.current?.(),
  });

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!activeUserRef.current) tryRestoreSessionRef.current();
    };
    const onFocus = () => {
      if (!activeUserRef.current) tryRestoreSessionRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    const onPageShow = () => {
      if (!activeUserRef.current) tryRestoreSessionRef.current();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const validViews = ['overview', 'detail', 'create'];
    if (!validViews.includes(view)) {
      setView('overview');
      return;
    }
    if (view === 'detail' && !selectedProtokollId) {
      setView('overview');
      return;
    }
    if (view === 'detail' && selectedProtokollId) {
      const exists = tblProtokoll.some(
        (p) => p.protokoll_id === selectedProtokollId || p.protokoll_id === Number(selectedProtokollId)
      );
      if (!exists) {
        setSelectedProtokollId(null);
        setView('overview');
      }
    }
  }, [isLoading, tblProtokoll, view, selectedProtokollId, activeUser?.rolle]);

  const formDraftFromStorage = initialNav.formDraft;

  const aufgabenSuggestions = useMemo(() => {
    const fromEntries = tblEintrag.flatMap(e => (e.aufgaben || []).map(a => a.text).filter(Boolean));
    return [...new Set([...bekannteAufgaben, ...fromEntries])].sort((a, b) => a.localeCompare(b, 'de-DE'));
  }, [bekannteAufgaben, tblEintrag]);

  const [editingProtokollId, setEditingProtokollId] = useState(
    () => formDraftFromStorage?.editingProtokollId ?? null
  );
  const [newCommentTexts, setNewCommentTexts] = useState({});
  const [hiddenEntries, setHiddenEntries] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [taskProcessFilter, setTaskProcessFilter] = useState(null);
  const [advFilters, setAdvFilters] = useState({
    protokoll_id: '', datum: '', ort: '', typ: 'Alle', ersteller: '', erstellt_am: '',
    thema: '', projektart_id: '', projekt_id: '', schritt_id: '', unterschritt_id: '', teilnehmer: '', inhalt: '', aufgaben: '', kommentare: ''
  });
  const [editingEintragId, setEditingEintragId] = useState(null);
  const [isAddingEintrag, setIsAddingEintrag] = useState(false);
  const [detailEintragForm, setDetailEintragForm] = useState(null);
  const [formState, setFormState] = useState(() => {
    if (formDraftFromStorage?.formState) {
      return formDraftFromStorage.formState;
    }
    return {
      datum: new Date().toISOString().split('T')[0],
      ort: '',
      typ: 'Besprechung',
      eintraege: [{
        eintrag_id: null,
        thema: '',
        text: '',
        aufgaben: [],
        projektart_id: '',
        projekt_id: '',
        schritt_id: '',
        unterschritt_id: '',
        teilnehmer: [],
        teilnehmer_pick: emptyTeilnehmerPick(),
      }],
    };
  });

  useEffect(() => {
    const formDraft = view === 'create' ? { editingProtokollId, formState } : null;
    writeStoredNav({ view, selectedProtokollId, formDraft });
  }, [view, selectedProtokollId, editingProtokollId, formState]);

  useEffect(() => {
    if (view !== 'detail') {
      setDetailEintragForm(null);
      setEditingEintragId(null);
      setIsAddingEintrag(false);
    }
  }, [view]);

  useEffect(() => {
    if (view !== 'create') return;
    setFormState((prev) => {
      if (prev.eintraege?.length > 0) return prev;
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return {
        ...prev,
        eintraege: [{
          eintrag_id: null,
          thema: '',
          text: '',
          aufgaben: [],
          projektart_id: '',
          projekt_id: '',
          schritt_id: '',
          unterschritt_id: '',
          teilnehmer: [],
          teilnehmer_pick: emptyTeilnehmerPick(),
        }],
      };
    });
  }, [view]);

  useEffect(() => {
    if (isLoading || view !== 'create' || !editingProtokollId) return;
    const exists = tblProtokoll.some(
      (p) => p.protokoll_id === editingProtokollId || p.protokoll_id === Number(editingProtokollId)
    );
    if (exists) return;
    setEditingProtokollId(null);
    setSelectedProtokollId(null);
    setView('overview');
    setFormState({
      datum: new Date().toISOString().split('T')[0],
      ort: '',
      typ: 'Besprechung',
      eintraege: [{
        eintrag_id: null,
        thema: '',
        text: '',
        aufgaben: [],
        projektart_id: '',
        projekt_id: '',
        schritt_id: '',
        unterschritt_id: '',
        teilnehmer: [],
        teilnehmer_pick: emptyTeilnehmerPick(),
      }],
    });
  }, [isLoading, view, editingProtokollId, tblProtokoll]);

  // ==========================================
  // HILFSFUNKTIONEN
  // ==========================================
  const getCurrentTime = () => { const now = new Date(); return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; };
  const checkIsEditable = (erstellt_am) => { if (!erstellt_am) return true; return ((new Date().getTime() - new Date(erstellt_am).getTime()) / (1000 * 60 * 60)) <= 72; };
  /** Organisation nur 72h nach Personen-Anlage; ohne Zeitstempel = nicht änderbar (Bestand). */
  const canEditPersonOrganisation = (person) => !!(person?.erstellt_am && checkIsEditable(person.erstellt_am));
  const createEmptyEintrag = () => ({
    eintrag_id: null, thema: '', text: '', aufgaben: [],
    projektart_id: '', projekt_id: '', schritt_id: '', unterschritt_id: '',
    teilnehmer: [],
    teilnehmer_pick: emptyTeilnehmerPick(),
  });

  const applyZuordnungCascade = (entry, field, value) => {
    const updated = { ...entry, [field]: value };
    if (field === 'projektart_id') { updated.projekt_id = ''; updated.schritt_id = ''; updated.unterschritt_id = ''; }
    if (field === 'schritt_id') { updated.unterschritt_id = ''; }
    return updated;
  };

  const getUnterschritt = (id) => tblUnterschritt.find(u => u.unterschritt_id === id);
  const getSchritt = (id) => tblSchritt.find(s => s.schritt_id === id);
  const getProjekt = (id) => tblProjekt.find(p => p.projekt_id === id);
  const getProjektart = (id) => tblProjektart.find(pa => pa.projektart_id === id);
  const getProjektartNameForEintrag = (eintrag) => {
    const id = resolveProjektartId(eintrag, tblSchritt, tblProjekt);
    return id ? getProjektartLabel(id, tblProjektart) : '';
  };
  const getPerson = (id) => tblPerson.find(p => p.person_id === id);
  const getBenutzer = (id) => tblBenutzer.find(b => b.benutzer_id === id);
  const getOrganisation = (id) => tblOrganisation.find(o => o.org_id === id);
  /** Konzern-Organisationen (Name beginnt mit „Acme“, z. B. Solar, Energy). */
  const isKonzerOrganisationName = (name) => {
    const n = (name ?? '').trim().toLowerCase();
    return n.startsWith('acme');
  };
  const getBenutzerDisplayName = (benutzer_id) => {
    const u = getBenutzer(benutzer_id);
    if (!u) return 'Unbekannt';
    return (u.anzeigename || u.benutzername || '').trim() || 'Unbekannt';
  };
  const getPersonDisplayName = (person_id) => {
    const person = getPerson(person_id);
    if (!person) return 'Unbekannt';
    return `${person.vorname || ''} ${person.nachname || ''}`.trim() || 'Unbekannt';
  };
  const getOrganisationLabel = (person_id) => {
    const person = getPerson(person_id);
    if (!person?.org_id) return '';
    const org = getOrganisation(person.org_id);
    return org?.name ?? '';
  };
  const getAutorDisplayName = (benutzer_id) => getBenutzerDisplayName(benutzer_id);
  const getFullPersonName = (person_id) => getPersonDisplayName(person_id);
  const isQTacEmployee = (person_id) => {
    const person = getPerson(person_id);
    if (!person?.org_id) return false;
    const org = getOrganisation(person.org_id);
    return !!(org && isKonzerOrganisationName(org.name));
  };

  const personAutocompleteOptions = useMemo(() =>
    tblPerson
      .map(p => ({ id: p.person_id, label: getPersonDisplayName(p.person_id) }))
      .filter(o => o.label && o.label !== 'Unbekannt'),
    [tblPerson]
  );

  const benutzerAutocompleteOptions = useMemo(() =>
    tblBenutzer
      .map(b => ({ id: b.benutzer_id, label: getBenutzerDisplayName(b.benutzer_id) }))
      .filter(o => o.label && o.label !== 'Unbekannt'),
    [tblBenutzer]
  );

  const organisationAutocompleteOptions = useMemo(() =>
    tblOrganisation
      .map(o => ({ id: o.org_id, label: o.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de-DE')),
    [tblOrganisation]
  );

  const resolvePersonFilterValue = (nameFilter) => {
    if (!nameFilter) return '';
    const match = tblPerson.find(p => getPersonDisplayName(p.person_id).toLowerCase() === nameFilter.toLowerCase());
    return match ? match.person_id : '';
  };

  const resolveBenutzerFilterValue = (nameFilter) => {
    if (!nameFilter) return '';
    const match = tblBenutzer.find(b =>
      getBenutzerDisplayName(b.benutzer_id).toLowerCase() === nameFilter.toLowerCase()
    );
    return match ? match.benutzer_id : '';
  };

  // ==========================================
  // HANDLER FUNKTIONEN
  // ==========================================
  const executeDelete = async () => {
    if (deleteModal.type === 'protokoll') { await api.deleteProtokoll(deleteModal.id); setView('overview'); }
    else if (deleteModal.type === 'eintrag') { await api.deleteEintrag(deleteModal.id); setEditingEintragId(null); setDetailEintragForm(null); }
    setDeleteModal({ isOpen: false, type: null, id: null });
    await loadAllData();
  };

  const clearDetailEintragEdit = () => {
    setDetailEintragForm(null);
    setEditingEintragId(null);
    setIsAddingEintrag(false);
  };

  const handleOpenCreate = () => {
    clearDetailEintragEdit();
    setEditingProtokollId(null);
    setFormState({
      datum: new Date().toISOString().split('T')[0],
      ort: '',
      typ: 'Besprechung',
      eintraege: [createEmptyEintrag()],
    });
    setView('create');
  };

  const handleCancelCreate = () => {
    clearDetailEintragEdit();
    const protokollId = editingProtokollId;
    setEditingProtokollId(null);
    if (protokollId) {
      setSelectedProtokollId(protokollId);
      setView('detail');
    } else {
      setView('overview');
    }
  };

  const handleEditProtokoll = (protokoll_id, e) => {
    if (e) e.stopPropagation();
    clearDetailEintragEdit();
    const protokoll = tblProtokoll.find(p => p.protokoll_id === protokoll_id);
    if (!checkIsEditable(protokoll.erstellt_am)) return;
    const eintraege = tblEintrag.filter(e => e.protokoll_id === protokoll_id);
    const mappedEintraege = eintraege.map(entry => {
      const teilnehmer = tblEintragPerson.filter(ep => ep.eintrag_id === entry.eintrag_id).map(ep => ({ person_id: ep.person_id, joined_at: ep.joined_at }));
      return {
        eintrag_id: entry.eintrag_id, thema: entry.thema, text: entry.text, aufgaben: entry.aufgaben || [],
        projektart_id: resolveProjektartId(entry, tblSchritt, tblProjekt) || '',
        projekt_id: entry.projekt_id || '', schritt_id: entry.schritt_id || '', unterschritt_id: entry.unterschritt_id || '',
        teilnehmer, teilnehmer_pick: emptyTeilnehmerPick(),
      };
    });
    setFormState({ datum: protokoll.datum, ort: protokoll.ort, typ: protokoll.typ, eintraege: mappedEintraege.length > 0 ? mappedEintraege : [createEmptyEintrag()] });
    setSelectedProtokollId(protokoll_id);
    setEditingProtokollId(protokoll_id);
    setView('create');
  };

  const handleCreateSubmit = async () => {
    try {
      const preparedEintraege = await ensureFormLookupsBeforeSave(formState.eintraege);
      if (editingProtokollId) {
        const eintraegePayload = preparedEintraege.map(e => ({
          eintrag_id: e.eintrag_id || null,
          thema: e.thema,
          text: e.text,
          aufgaben: e.aufgaben,
          projekt_id: e.projekt_id ? parseInt(e.projekt_id) : null,
          schritt_id: e.schritt_id ? parseInt(e.schritt_id) : null,
          unterschritt_id: e.unterschritt_id ? parseInt(e.unterschritt_id) : null,
          teilnehmer: e.teilnehmer,
        }));
        await api.updateProtokoll(editingProtokollId, {
          datum: formState.datum,
          ort: formState.ort,
          typ: formState.typ,
          eintraege: eintraegePayload,
        });
        setSelectedProtokollId(editingProtokollId);
        clearDetailEintragEdit();
        setView('detail');
      } else {
        const newProtokoll = await api.createProtokoll({
          datum: formState.datum,
          ort: formState.ort,
          typ: formState.typ,
        });
        const newPid = newProtokoll.protokoll_id;
        for (const e of preparedEintraege) {
          await api.createEintrag({
            protokoll_id: newPid,
            thema: e.thema,
            text: e.text,
            aufgaben: e.aufgaben,
            projekt_id: e.projekt_id ? parseInt(e.projekt_id) : null,
            schritt_id: e.schritt_id ? parseInt(e.schritt_id) : null,
            unterschritt_id: e.unterschritt_id ? parseInt(e.unterschritt_id) : null,
            teilnehmer: e.teilnehmer,
          });
        }
        setSelectedProtokollId(newPid);
        clearDetailEintragEdit();
        setView('detail');
      }
      setEditingProtokollId(null);
      await loadAllData();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      alert('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  const addEintrag = () => setFormState(prev => ({ ...prev, eintraege: [...prev.eintraege, createEmptyEintrag()] }));
  const removeEintrag = (index) => setFormState(prev => ({ ...prev, eintraege: prev.eintraege.filter((_, i) => i !== index) }));
  const updateEintrag = (index, field, value) => {
    setFormState(prev => {
      const updated = [...prev.eintraege];
      updated[index] = applyZuordnungCascade(updated[index], field, value);
      return { ...prev, eintraege: updated };
    });
  };

  const updateAufgabeStatus = async (eintrag_id, taskIndex, newStatus) => {
    setTblEintrag(prev => prev.map(e => {
      if (e.eintrag_id !== eintrag_id) return e;
      const newAufgaben = [...e.aufgaben];
      newAufgaben[taskIndex] = { ...newAufgaben[taskIndex], status: newStatus };
      return { ...e, aufgaben: newAufgaben };
    }));
    await api.updateAufgabeStatus(eintrag_id, taskIndex, newStatus);
  };

  const handleAddComment = async (eintrag_id) => {
    const text = newCommentTexts[eintrag_id];
    if (!text?.trim()) return;
    const newKommentar = await api.createKommentar({ eintrag_id, text: text.trim() });
    setTblKommentar(prev => [...prev, newKommentar]);
    setNewCommentTexts(prev => ({ ...prev, [eintrag_id]: '' }));
  };

  const handleCreatePerson = async (name, orgId, addToListFn) => {
    if (typeof orgId === 'function') {
      addToListFn = orgId;
      orgId = null;
    }
    const bn = (name || '').trim();
    if (!bn) return null;
    const oid = orgId != null && orgId !== '' ? Number(orgId) : null;
    const key = `person:${normLabel(bn)}:${oid ?? 'none'}`;
    if (pendingCreateRef.current.has(key)) return pendingCreateRef.current.get(key);
    const promise = (async () => {
      const newPerson = await api.createPerson({
        name: bn,
        org_id: Number.isFinite(oid) ? oid : null,
      });
      setTblPerson((prev) => (prev.some((p) => p.person_id === newPerson.person_id) ? prev : [...prev, newPerson]));
      addToListFn?.(newPerson.person_id);
      return newPerson.person_id;
    })();
    pendingCreateRef.current.set(key, promise);
    try { return await promise; } finally { pendingCreateRef.current.delete(key); }
  };

  const handleCreateOrganisation = async (name) => {
    const n = (name || '').trim();
    if (!n) return null;
    const key = `org:${normLabel(n)}`;
    if (pendingCreateRef.current.has(key)) return pendingCreateRef.current.get(key);
    const promise = (async () => {
      const org = await api.createOrganisation({ name: n });
      setTblOrganisation((prev) => (prev.some((o) => o.org_id === org.org_id) ? prev : [...prev, org]));
      return org.org_id;
    })();
    pendingCreateRef.current.set(key, promise);
    try { return await promise; } finally { pendingCreateRef.current.delete(key); }
  };

  const handleUpdatePersonOrg = async (personId, orgId) => {
    const updated = await api.updatePerson(personId, { org_id: orgId });
    setTblPerson((prev) => prev.map((p) => (p.person_id === personId ? updated : p)));
    return updated;
  };
  const handleCreateProjektart = async (bezeichnung, setFn) => {
    const b = bezeichnung.trim();
    if (!b) return;
    const key = `projektart:${normLabel(b)}`;
    const existing = tblProjektart.find((pa) => normLabel(pa.bezeichnung) === normLabel(b));
    if (existing) { setFn(existing.projektart_id); return existing.bezeichnung; }
    if (pendingCreateRef.current.has(key)) return pendingCreateRef.current.get(key);
    const promise = (async () => {
      const n = await api.createProjektart({ bezeichnung: b });
      setTblProjektart((prev) => (prev.some((pa) => pa.projektart_id === n.projektart_id) ? prev : [...prev, n]));
      setFn(n.projektart_id);
      return n.bezeichnung;
    })();
    pendingCreateRef.current.set(key, promise);
    try { return await promise; } finally { pendingCreateRef.current.delete(key); }
  };
  const handleCreateProjekt = async (bezeichnung, projektart_id, setFn) => {
    const b = bezeichnung.trim();
    const paId = parseInt(projektart_id);
    if (!b || !paId) return;
    const key = `projekt:${paId}:${normLabel(b)}`;
    const existing = tblProjekt.find((p) => p.projektart_id === paId && normLabel(p.bezeichnung) === normLabel(b));
    if (existing) { setFn(existing.projekt_id); return existing.bezeichnung; }
    if (pendingCreateRef.current.has(key)) return pendingCreateRef.current.get(key);
    const promise = (async () => {
      const n = await api.createProjekt({ bezeichnung: b, projektart_id: paId });
      setTblProjekt((prev) => (prev.some((p) => p.projekt_id === n.projekt_id) ? prev : [...prev, n]));
      setFn(n.projekt_id);
      return n.bezeichnung;
    })();
    pendingCreateRef.current.set(key, promise);
    try { return await promise; } finally { pendingCreateRef.current.delete(key); }
  };
  const handleCreateSchritt = async (bezeichnung, projektart_id, setFn) => {
    const b = bezeichnung.trim();
    const paId = parseInt(projektart_id);
    if (!b || !paId) return;
    const key = `schritt:${paId}:${normLabel(b)}`;
    const existing = tblSchritt.find((s) => s.projektart_id === paId && normLabel(s.bezeichnung) === normLabel(b));
    if (existing) { setFn(existing.schritt_id); return existing.bezeichnung; }
    if (pendingCreateRef.current.has(key)) return pendingCreateRef.current.get(key);
    const promise = (async () => {
      const n = await api.createSchritt({ bezeichnung: b, projektart_id: paId });
      setTblSchritt((prev) => (prev.some((s) => s.schritt_id === n.schritt_id) ? prev : [...prev, n]));
      setFn(n.schritt_id);
      return n.bezeichnung;
    })();
    pendingCreateRef.current.set(key, promise);
    try { return await promise; } finally { pendingCreateRef.current.delete(key); }
  };
  const handleCreateUnterschritt = async (bezeichnung, schritt_id, setFn) => {
    const b = bezeichnung.trim();
    const sId = parseInt(schritt_id);
    if (!b || !sId) return;
    const key = `unterschritt:${sId}:${normLabel(b)}`;
    const existing = tblUnterschritt.find((u) => u.schritt_id === sId && normLabel(u.bezeichnung) === normLabel(b));
    if (existing) { setFn(existing.unterschritt_id); return existing.bezeichnung; }
    if (pendingCreateRef.current.has(key)) return pendingCreateRef.current.get(key);
    const promise = (async () => {
      const n = await api.createUnterschritt({ bezeichnung: b, schritt_id: sId });
      setTblUnterschritt((prev) => (prev.some((u) => u.unterschritt_id === n.unterschritt_id) ? prev : [...prev, n]));
      setFn(n.unterschritt_id);
      return n.bezeichnung;
    })();
    pendingCreateRef.current.set(key, promise);
    try { return await promise; } finally { pendingCreateRef.current.delete(key); }
  };
  const addLookupValue = (setter, val) => setter((prev) => (prev.some((x) => normLabel(x) === normLabel(val)) ? prev : [...prev, val]));
  const handleCreateLookup = async (kategorie, val, setter, afterFn) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const key = `lookup:${kategorie}:${normLabel(trimmed)}`;
    if (pendingCreateRef.current.has(key)) {
      await pendingCreateRef.current.get(key);
      afterFn?.(trimmed);
      return trimmed;
    }
    const promise = (async () => {
      addLookupValue(setter, trimmed);
      await api.createLookup({ kategorie, wert: trimmed });
      afterFn?.(trimmed);
      return trimmed;
    })();
    pendingCreateRef.current.set(key, promise);
    try {
      return await promise;
    } catch (err) {
      console.error('Fehler beim Anlegen des Lookup-Werts:', err);
      alert('Wert konnte nicht gespeichert werden. Läuft das Backend (python app.py)?');
    } finally {
      pendingCreateRef.current.delete(key);
    }
  };
  const handleCreateTyp = (val, afterFn) => handleCreateLookup('typ', val, setBekannteTypen, afterFn);
  const handleCreateOrt = (val, afterFn) => handleCreateLookup('ort', val, setBekannteOrte, afterFn);
  const handleCreateThema = (val, afterFn) => handleCreateLookup('thema', val, setBekannteThemen, afterFn);
  const handleCreateAufgabe = (val, afterFn) => handleCreateLookup('aufgabe', val, setBekannteAufgaben, afterFn);

  const isTableId = (val, table, idKey) => {
    const n = parseInt(val, 10);
    return val !== '' && val != null && !Number.isNaN(n) && table.some((row) => row[idKey] === n);
  };

  const resolveOrgIdFromPick = async (pick) => {
    const rawId = pick?.org_id;
    if (rawId !== '' && rawId != null) {
      const n = parseInt(rawId, 10);
      if (!Number.isNaN(n) && tblOrganisation.some((o) => o.org_id === n)) return n;
    }
    const name = (pick?.org || '').trim();
    if (!name) return null;
    const existing = tblOrganisation.find((o) => normLabel(o.name) === normLabel(name));
    if (existing) return existing.org_id;
    return handleCreateOrganisation(name);
  };

  const resolvePersonIdFromPick = async (pick, orgId) => {
    const rawId = pick?.person_id;
    if (rawId !== '' && rawId != null) {
      const n = parseInt(rawId, 10);
      if (!Number.isNaN(n) && tblPerson.some((p) => p.person_id === n)) {
        return n;
      }
    }
    const name = (pick?.person || '').trim();
    if (!name) return null;
    return handleCreatePerson(name, orgId);
  };

  const applyPickOrgToPerson = async (pick) => {
    const rawId = pick?.person_id;
    if (rawId === '' || rawId == null) return;
    const n = parseInt(rawId, 10);
    if (Number.isNaN(n)) return;
    const person = tblPerson.find((p) => p.person_id === n);
    if (!person || !canEditPersonOrganisation(person)) return;
    const orgId = await resolveOrgIdFromPick(pick);
    if (orgId != null) await handleUpdatePersonOrg(n, orgId);
  };

  const resolveEintragTeilnehmer = async (eintrag) => {
    const pick = eintrag.teilnehmer_pick || emptyTeilnehmerPick();
    const hasPick = !!(pick.person?.trim() || pick.person_id || pick.org?.trim() || pick.org_id);
    if (!hasPick) {
      const { teilnehmer_pick, ...rest } = eintrag;
      return rest;
    }
    await applyPickOrgToPerson(pick);
    let orgId = null;
    const isNewPersonDraft = !(pick.person_id && tblPerson.some((p) => p.person_id === parseInt(pick.person_id, 10)));
    if (isNewPersonDraft) {
      orgId = await resolveOrgIdFromPick(pick);
    }
    const personId = await resolvePersonIdFromPick(pick, orgId);
    let teilnehmer = [...(eintrag.teilnehmer || [])];
    if (personId && !teilnehmer.some((t) => t.person_id === personId)) {
      teilnehmer.push({ person_id: personId, joined_at: getCurrentTime() });
    }
    const { teilnehmer_pick, ...rest } = eintrag;
    return { ...rest, teilnehmer, teilnehmer_pick: emptyTeilnehmerPick() };
  };

  const resolveEintragZuordnung = async (eintrag) => {
    const out = { ...eintrag };
    if (out.projektart_id && !isTableId(out.projektart_id, tblProjektart, 'projektart_id')) {
      const label = String(out.projektart_id).trim();
      if (label) await handleCreateProjektart(label, (id) => { out.projektart_id = id; });
    }
    const paId = parseInt(out.projektart_id, 10);
    if (out.schritt_id && paId && !isTableId(out.schritt_id, tblSchritt, 'schritt_id')) {
      const label = String(out.schritt_id).trim();
      if (label) await handleCreateSchritt(label, paId, (id) => { out.schritt_id = id; });
    }
    const sId = parseInt(out.schritt_id, 10);
    if (out.unterschritt_id && sId && !isTableId(out.unterschritt_id, tblUnterschritt, 'unterschritt_id')) {
      const label = String(out.unterschritt_id).trim();
      if (label) await handleCreateUnterschritt(label, sId, (id) => { out.unterschritt_id = id; });
    }
    if (out.projekt_id && paId && !isTableId(out.projekt_id, tblProjekt, 'projekt_id')) {
      const label = String(out.projekt_id).trim();
      if (label) await handleCreateProjekt(label, paId, (id) => { out.projekt_id = id; });
    }
    return out;
  };

  const ensureLookupTasksForEintraege = (eintraege, tasks, knownAufgaben) => {
    for (const e of eintraege) {
      if (e.thema?.trim() && !listHasLabel(bekannteThemen, e.thema)) {
        tasks.push(handleCreateLookup('thema', e.thema.trim(), setBekannteThemen, () => {}));
      }
      for (const a of e.aufgaben || []) {
        if (a.text?.trim() && !knownAufgaben.has(a.text.trim()) && !listHasLabel(bekannteAufgaben, a.text)) {
          knownAufgaben.add(a.text.trim());
          tasks.push(handleCreateLookup('aufgabe', a.text.trim(), setBekannteAufgaben, () => {}));
        }
      }
    }
  };

  const ensureFormLookupsBeforeSave = async (eintraege) => {
    const tasks = [];
    if (formState.typ?.trim() && !listHasLabel(bekannteTypen, formState.typ)) {
      tasks.push(handleCreateLookup('typ', formState.typ.trim(), setBekannteTypen, () => {}));
    }
    if (formState.ort?.trim() && !listHasLabel(bekannteOrte, formState.ort)) {
      tasks.push(handleCreateLookup('ort', formState.ort.trim(), setBekannteOrte, () => {}));
    }
    const knownAufgaben = new Set([
      ...bekannteAufgaben,
      ...eintraege.flatMap((e) => (e.aufgaben || []).map((a) => a.text).filter(Boolean)),
    ]);
    ensureLookupTasksForEintraege(eintraege, tasks, knownAufgaben);
    await Promise.all(tasks);
    const zuordnung = await Promise.all(eintraege.map(resolveEintragZuordnung));
    return Promise.all(zuordnung.map(resolveEintragTeilnehmer));
  };

  const ensureDetailEintragLookupsBeforeSave = async (eintrag) => {
    const tasks = [];
    if (eintrag.thema?.trim() && !listHasLabel(bekannteThemen, eintrag.thema)) {
      tasks.push(handleCreateLookup('thema', eintrag.thema.trim(), setBekannteThemen, () => {}));
    }
    for (const a of eintrag.aufgaben || []) {
      if (a.text?.trim() && !listHasLabel(bekannteAufgaben, a.text)) {
        tasks.push(handleCreateLookup('aufgabe', a.text.trim(), setBekannteAufgaben, () => {}));
      }
    }
    await Promise.all(tasks);
    const zuordnung = await resolveEintragZuordnung(eintrag);
    return resolveEintragTeilnehmer(zuordnung);
  };

  const initDetailEintragForm = (eintrag = null) => {
    if (eintrag) {
      setDetailEintragForm({
        thema: eintrag.thema, text: eintrag.text, aufgaben: eintrag.aufgaben || [],
        projektart_id: resolveProjektartId(eintrag, tblSchritt, tblProjekt) || '',
        projekt_id: eintrag.projekt_id || '', schritt_id: eintrag.schritt_id || '', unterschritt_id: eintrag.unterschritt_id || '',
        teilnehmer: tblEintragPerson.filter(ep => ep.eintrag_id === eintrag.eintrag_id).map(ep => ({ ...ep })),
        teilnehmer_pick: emptyTeilnehmerPick(),
      });
      setEditingEintragId(eintrag.eintrag_id); setIsAddingEintrag(false);
    } else {
      setDetailEintragForm(createEmptyEintrag()); setEditingEintragId(null); setIsAddingEintrag(true);
    }
  };
  const cancelDetailEintrag = clearDetailEintragEdit;
  const updateDetailEintrag = (field, value) => {
    setDetailEintragForm(prev => applyZuordnungCascade(prev, field, value));
  };
  const saveDetailEintrag = async () => {
    const resolved = await ensureDetailEintragLookupsBeforeSave(detailEintragForm);
    const payload = { thema: resolved.thema, text: resolved.text, aufgaben: resolved.aufgaben, projekt_id: resolved.projekt_id || null, schritt_id: resolved.schritt_id || null, unterschritt_id: resolved.unterschritt_id || null, teilnehmer: resolved.teilnehmer };
    if (editingEintragId) { await api.updateEintrag(editingEintragId, payload); }
    else { await api.createEintrag({ ...payload, protokoll_id: selectedProtokollId }); }
    cancelDetailEintrag();
    await loadAllData();
  };

  const handleAdvFilterChange = (field, value) => setAdvFilters(prev => ({ ...prev, [field]: value }));
  const handleAdvFilterZuordnung = (field, id) => {
    setAdvFilters(prev => applyZuordnungCascade(prev, field, id));
  };
  const resetAdvFilters = () => setAdvFilters({ protokoll_id: '', datum: '', ort: '', typ: 'Alle', ersteller: '', erstellt_am: '', thema: '', projektart_id: '', projekt_id: '', schritt_id: '', unterschritt_id: '', teilnehmer: '', inhalt: '', aufgaben: '', kommentare: '' });
  const handleGlobalReset = () => { setSearchTerm(''); resetAdvFilters(); setTaskProcessFilter(null); };

  // ==========================================
  // FILTER LOGIK
  // ==========================================
  const getSearchableTextForProtokoll = (protokoll) => {
    const parts = [protokoll.protokoll_id.toString(), protokoll.datum, protokoll.ort, protokoll.typ, getBenutzerDisplayName(protokoll.autor_id), new Date(protokoll.erstellt_am).toLocaleString('de-DE')];
    const eintraege = tblEintrag.filter(e => e.protokoll_id === protokoll.protokoll_id);
    eintraege.forEach(e => {
      parts.push(e.thema, e.text, ...(e.aufgaben?.map(a => a.text) || []));
      const projektartName = getProjektartNameForEintrag(e);
      const proj = getProjekt(e.projekt_id); const schritt = getSchritt(e.schritt_id); const unterschritt = getUnterschritt(e.unterschritt_id);
      if (projektartName) parts.push(projektartName);
      if (proj) parts.push(proj.bezeichnung); if (schritt) parts.push(schritt.bezeichnung); if (unterschritt) parts.push(unterschritt.bezeichnung);
      tblEintragPerson.filter(ep => ep.eintrag_id === e.eintrag_id).forEach(t => parts.push(getFullPersonName(t.person_id)));
      tblKommentar.filter(k => k.eintrag_id === e.eintrag_id).forEach(k => { parts.push(k.text, getBenutzerDisplayName(k.autor_id)); });
    });
    return parts.filter(Boolean).join(' ').toLowerCase();
  };

  const baseFilteredProtokolle = tblProtokoll.filter(p => {
    if (searchTerm.trim()) { const st = getSearchableTextForProtokoll(p); if (!searchTerm.toLowerCase().split(' ').filter(t => t.trim()).every(term => st.includes(term))) return false; }
    if (advFilters.protokoll_id && !p.protokoll_id.toString().includes(advFilters.protokoll_id)) return false;
    if (advFilters.datum && p.datum !== advFilters.datum) return false;
    if (advFilters.ort && !p.ort.toLowerCase().includes(advFilters.ort.toLowerCase())) return false;
    if (advFilters.typ !== 'Alle' && p.typ !== advFilters.typ) return false;
    if (advFilters.ersteller && !getBenutzerDisplayName(p.autor_id).toLowerCase().includes(advFilters.ersteller.toLowerCase())) return false;
    if (advFilters.erstellt_am && !p.erstellt_am.startsWith(advFilters.erstellt_am)) return false;
    const eintraege = tblEintrag.filter(e => e.protokoll_id === p.protokoll_id);
    if (advFilters.thema && !eintraege.some(e => e.thema.toLowerCase().includes(advFilters.thema.toLowerCase()))) return false;
    if (advFilters.inhalt && !eintraege.some(e => e.text.toLowerCase().includes(advFilters.inhalt.toLowerCase()))) return false;
    if (advFilters.aufgaben && !eintraege.some(e => e.aufgaben && e.aufgaben.some(a => a.text.toLowerCase().includes(advFilters.aufgaben.toLowerCase())))) return false;
    if (advFilters.projektart_id || advFilters.projekt_id || advFilters.schritt_id || advFilters.unterschritt_id) {
      const hasMatch = eintraege.some(e => {
        let match = true;
        if (advFilters.projektart_id && resolveProjektartId(e, tblSchritt, tblProjekt) !== parseInt(advFilters.projektart_id)) match = false;
        if (advFilters.projekt_id && e.projekt_id !== parseInt(advFilters.projekt_id)) match = false;
        if (advFilters.schritt_id && e.schritt_id !== parseInt(advFilters.schritt_id)) match = false;
        if (advFilters.unterschritt_id && e.unterschritt_id !== parseInt(advFilters.unterschritt_id)) match = false;
        return match;
      });
      if (!hasMatch) return false;
    }
    if (advFilters.teilnehmer) {
      const term = advFilters.teilnehmer.toLowerCase();
      if (!eintraege.some(e => tblEintragPerson.filter(ep => ep.eintrag_id === e.eintrag_id).some(t => {
        const name = getPersonDisplayName(t.person_id).toLowerCase();
        const org = getOrganisationLabel(t.person_id).toLowerCase();
        return name.includes(term) || org.includes(term);
      }))) return false;
    }
    if (advFilters.kommentare) { const term = advFilters.kommentare.toLowerCase(); if (!eintraege.some(e => tblKommentar.filter(k => k.eintrag_id === e.eintrag_id).some(k => k.text.toLowerCase().includes(term)))) return false; }
    return true;
  });

  const taskCounts = { all: 0, offen: 0, geplant: 0, in_bearbeitung: 0, erledigt: 0 };
  baseFilteredProtokolle.forEach(p => {
    tblEintrag.filter(e => e.protokoll_id === p.protokoll_id).forEach(e => {
      if (e.aufgaben) e.aufgaben.forEach(a => { taskCounts.all++; if (a.status === 'Offen') taskCounts.offen++; else if (a.status === 'Geplant') taskCounts.geplant++; else if (a.status === 'In Bearbeitung') taskCounts.in_bearbeitung++; else if (a.status === 'Erledigt') taskCounts.erledigt++; });
    });
  });

  const filteredProtokolle = baseFilteredProtokolle.filter(p => {
    if (taskProcessFilter === null) return true;
    const eintraege = tblEintrag.filter(e => e.protokoll_id === p.protokoll_id);
    if (taskProcessFilter === 'all_tasks') return eintraege.some(e => e.aufgaben && e.aufgaben.length > 0);
    return eintraege.some(e => e.aufgaben && e.aufgaben.some(a => a.status === taskProcessFilter));
  });

  const sortedAndFilteredProtokolle = filteredProtokolle.sort((a, b) => {
    if (sortOrder === 'date_desc') return new Date(b.datum) - new Date(a.datum) || b.protokoll_id - a.protokoll_id;
    if (sortOrder === 'date_asc') return new Date(a.datum) - new Date(b.datum) || a.protokoll_id - b.protokoll_id;
    if (sortOrder === 'id_desc') return b.protokoll_id - a.protokoll_id;
    if (sortOrder === 'id_asc') return a.protokoll_id - b.protokoll_id;
    return 0;
  });

  const activeFilterCount = Object.values(advFilters).filter(v => v !== '' && v !== 'Alle').length;
  const isAnyFilterActive = searchTerm.trim() !== '' || activeFilterCount > 0 || taskProcessFilter !== null;
  const handleFilterClick = (filter) => setTaskProcessFilter(prev => prev === filter ? null : filter);

  /** Nie leere Hauptfläche: ungültige Kombi → Übersicht (State-Korrektur läuft parallel im useEffect). */
  const displayView =
    !['overview', 'detail', 'create'].includes(view) ? 'overview'
      : view === 'detail' && !selectedProtokollId ? 'overview'
        : view;

  // ==========================================
  // RENDER
  // ==========================================
  if (!authChecked) {
    return <LadeSpinner />;
  }

  if (!activeUser) {
    return (
      <Login onLogin={handleLogin} error={loginError} loading={loginLoading} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans print:bg-white text-slate-800 relative overflow-hidden">
      <DekoHintergrund />

      <style>{`@media print { html, body { background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 1cm; } }`}</style>

      {idleLock && <IdleSperre onClick={dismissIdleLock} />}

      {isLoading && (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent" />
        </div>
      )}

      <DeleteModal deleteModal={deleteModal} setDeleteModal={setDeleteModal} executeDelete={executeDelete} />

      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto sticky top-0 z-50 print:hidden overflow-visible">
        <nav className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl px-5 py-3 flex justify-between items-center overflow-visible">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-violet-500/20"><FileText size={20} /></div>
            <span className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">Protokoll-Manager</span>
            <span className="hidden md:inline text-xs text-slate-500 font-medium ml-1">
              ({activeUser.anzeigename || activeUser.benutzername})
            </span>
          </div>
          <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/50 overflow-visible">
            <div className="relative overflow-visible" ref={navMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNavMenuOpen((o) => !o);
                }}
                title="Menü"
                aria-expanded={navMenuOpen}
                aria-haspopup="menu"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${navMenuOpen ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <MenuIcon size={16} />
                <span className="hidden sm:block">Menü</span>
              </button>
              {navMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 min-w-[14.5rem] py-1 bg-white border border-slate-200/80 rounded-xl shadow-lg z-[100]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { closeNavMenu(); clearDetailEintragEdit(); setView('overview'); }}
                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 ${displayView === 'overview' ? 'bg-violet-50 text-violet-800 font-medium' : 'text-slate-700 hover:bg-violet-50 hover:text-violet-800'}`}
                  >
                    <List size={16} />
                    Übersicht
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    title="Protokoll-Formular (anlegen oder bearbeiten)"
                    onClick={() => { closeNavMenu(); handleOpenCreate(); }}
                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 ${displayView === 'create' ? 'bg-violet-50 text-violet-800 font-medium' : 'text-slate-700 hover:bg-violet-50 hover:text-violet-800'}`}
                  >
                    <FilePenLine size={16} />
                    Formular
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeNavMenu();
                      window.open(HANDBUCH_URL, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                  >
                    <BookOpen size={16} />
                    Benutzerhandbuch
                  </button>
                  <div role="separator" className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                  >
                    <LogOut size={16} />
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:px-0 print:max-w-none print:m-0 relative z-10">
        <AnimatePresence initial={false}>
          {displayView === 'overview' && (
            <Overview key="overview"
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              showAdvFilters={showAdvFilters} setShowAdvFilters={setShowAdvFilters}
              activeFilterCount={activeFilterCount} isAnyFilterActive={isAnyFilterActive}
              handleGlobalReset={handleGlobalReset} sortOrder={sortOrder} setSortOrder={setSortOrder}
              handleOpenCreate={handleOpenCreate} advFilters={advFilters}
              bekannteOrte={bekannteOrte} bekannteTypen={bekannteTypen} bekannteThemen={bekannteThemen} bekannteAufgaben={aufgabenSuggestions}
              tblProjektart={tblProjektart} tblProjekt={tblProjekt} tblSchritt={tblSchritt} tblUnterschritt={tblUnterschritt} tblPerson={tblPerson}
              resetAdvFilters={resetAdvFilters} handleAdvFilterChange={handleAdvFilterChange} handleAdvFilterZuordnung={handleAdvFilterZuordnung}
              getProjektartNameForEintrag={getProjektartNameForEintrag}
              handleCreatePerson={handleCreatePerson} handleCreateAufgabe={handleCreateAufgabe}
              getBenutzerDisplayName={getBenutzerDisplayName} getFullPersonName={getFullPersonName}
              personAutocompleteOptions={personAutocompleteOptions} benutzerAutocompleteOptions={benutzerAutocompleteOptions}
              resolvePersonFilterValue={resolvePersonFilterValue} resolveBenutzerFilterValue={resolveBenutzerFilterValue}
              taskCounts={taskCounts} taskProcessFilter={taskProcessFilter} handleFilterClick={handleFilterClick}
              sortedAndFilteredProtokolle={sortedAndFilteredProtokolle}
              tblEintrag={tblEintrag} tblEintragPerson={tblEintragPerson}
              checkIsEditable={checkIsEditable} handleEditProtokoll={handleEditProtokoll}
              setSelectedProtokollId={setSelectedProtokollId} setHiddenEntries={setHiddenEntries}
              setView={setView}
            />
          )}
          {displayView === 'detail' && selectedProtokollId && (
            <Detail key={`detail-${selectedProtokollId}`}
              isLoading={isLoading}
              selectedProtokollId={selectedProtokollId} tblProtokoll={tblProtokoll}
              tblEintrag={tblEintrag} tblEintragPerson={tblEintragPerson} tblKommentar={tblKommentar}
              hiddenEntries={hiddenEntries} setHiddenEntries={setHiddenEntries}
              editingEintragId={editingEintragId} isAddingEintrag={isAddingEintrag} detailEintragForm={detailEintragForm}
              newCommentTexts={newCommentTexts} setNewCommentTexts={setNewCommentTexts}
              setView={setView} handleEditProtokoll={handleEditProtokoll} setDeleteModal={setDeleteModal}
              initDetailEintragForm={initDetailEintragForm} cancelDetailEintrag={cancelDetailEintrag}
              updateAufgabeStatus={updateAufgabeStatus} handleAddComment={handleAddComment}
              checkIsEditable={checkIsEditable}
              getProjekt={getProjekt} getSchritt={getSchritt} getUnterschritt={getUnterschritt} getProjektart={getProjektart}
              getPersonDisplayName={getPersonDisplayName}
              getBenutzerDisplayName={getBenutzerDisplayName}
              getOrganisationLabel={getOrganisationLabel}
              isQTacEmployee={isQTacEmployee}
              getAutorDisplayName={getAutorDisplayName}
              personAutocompleteOptions={personAutocompleteOptions}
              organisationAutocompleteOptions={organisationAutocompleteOptions}
              handleCreateOrganisation={handleCreateOrganisation}
              handleUpdatePersonOrg={handleUpdatePersonOrg}
              bekannteThemen={bekannteThemen} bekannteAufgaben={aufgabenSuggestions}
              tblProjektart={tblProjektart} tblProjekt={tblProjekt} tblSchritt={tblSchritt} tblUnterschritt={tblUnterschritt} tblPerson={tblPerson}
              updateDetailEintrag={updateDetailEintrag} saveDetailEintrag={saveDetailEintrag}
              handleCreateThema={handleCreateThema} handleCreateProjektart={handleCreateProjektart}
              handleCreateProjekt={handleCreateProjekt} handleCreateSchritt={handleCreateSchritt} handleCreateUnterschritt={handleCreateUnterschritt}
              getProjektartNameForEintrag={getProjektartNameForEintrag}
              handleCreatePerson={handleCreatePerson} handleCreateAufgabe={handleCreateAufgabe}
              setDetailEintragForm={setDetailEintragForm} getCurrentTime={getCurrentTime}
              canEditPersonOrganisation={canEditPersonOrganisation}
            />
          )}
          {displayView === 'create' && (
            <Create key="create"
              editingProtokollId={editingProtokollId} formState={formState} setFormState={setFormState}
              bekannteTypen={bekannteTypen} bekannteOrte={bekannteOrte} bekannteThemen={bekannteThemen} bekannteAufgaben={aufgabenSuggestions}
              tblProjektart={tblProjektart} tblProjekt={tblProjekt} tblSchritt={tblSchritt} tblUnterschritt={tblUnterschritt} tblPerson={tblPerson}
              addEintrag={addEintrag} removeEintrag={removeEintrag} updateEintrag={updateEintrag}
              handleCreateSubmit={handleCreateSubmit}
              handleCreateTyp={handleCreateTyp} handleCreateOrt={handleCreateOrt}
              handleCreateThema={handleCreateThema} handleCreateAufgabe={handleCreateAufgabe}
              handleCreateProjektart={handleCreateProjektart} handleCreateProjekt={handleCreateProjekt}
              handleCreateSchritt={handleCreateSchritt} handleCreateUnterschritt={handleCreateUnterschritt}
              handleCreatePerson={handleCreatePerson}
              handleCreateOrganisation={handleCreateOrganisation}
              handleUpdatePersonOrg={handleUpdatePersonOrg}
              personAutocompleteOptions={personAutocompleteOptions}
              organisationAutocompleteOptions={organisationAutocompleteOptions}
              setView={setView} isQTacEmployee={isQTacEmployee}
              getPersonDisplayName={getPersonDisplayName}
              getOrganisationLabel={getOrganisationLabel}
              getCurrentTime={getCurrentTime}
              handleCancelCreate={handleCancelCreate}
              canEditPersonOrganisation={canEditPersonOrganisation}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}