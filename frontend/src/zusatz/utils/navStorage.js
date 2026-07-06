const NAV_STORAGE_KEY = 'protokoll-manager-nav';

const defaultNav = () => ({
  view: 'overview',
  selectedProtokollId: null,
  formDraft: null,
});

function normalizeProtokollId(id) {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isValidFormDraft(draft) {
  if (!draft || typeof draft !== 'object') return false;
  const fs = draft.formState;
  if (!fs || typeof fs !== 'object') return false;
  if (typeof fs.datum !== 'string' || typeof fs.ort !== 'string' || typeof fs.typ !== 'string') return false;
  if (!Array.isArray(fs.eintraege)) return false;
  return true;
}

/**
 * Letzte Navigation + optional Protokollformular-Entwurf (sessionStorage, nur aktueller Tab).
 * Entwurf nur bei view === 'create'; kein DB-Speichern.
 */
export function readStoredNav() {
  try {
    if (typeof sessionStorage === 'undefined') return defaultNav();
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return defaultNav();
    const parsed = JSON.parse(raw);
    let view = typeof parsed.view === 'string' ? parsed.view : 'overview';
    let selectedProtokollId = normalizeProtokollId(parsed.selectedProtokollId);

    if (!['overview', 'detail', 'create'].includes(view)) {
      view = 'overview';
    }

    if (view === 'create' && isValidFormDraft(parsed.formDraft)) {
      const editingProtokollId = normalizeProtokollId(parsed.formDraft.editingProtokollId);
      return {
        view: 'create',
        selectedProtokollId: editingProtokollId,
        formDraft: {
          editingProtokollId,
          formState: parsed.formDraft.formState,
        },
      };
    }

    if (view === 'detail' && !selectedProtokollId) {
      return defaultNav();
    }

    if (view === 'create') {
      view = selectedProtokollId ? 'detail' : 'overview';
    }

    return { view, selectedProtokollId, formDraft: null };
  } catch {
    return defaultNav();
  }
}

export function writeStoredNav({ view, selectedProtokollId, formDraft }) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const storedSelected =
      view === 'create' && (!formDraft?.editingProtokollId)
        ? null
        : (selectedProtokollId ?? null);
    const payload = {
      view,
      selectedProtokollId: storedSelected,
      formDraft: view === 'create' && formDraft ? formDraft : null,
    };
    sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}
