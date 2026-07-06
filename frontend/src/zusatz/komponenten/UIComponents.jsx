import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, AnimModal } from '../extraDesign.jsx';
import { Plus, X, AlertTriangle } from 'lucide-react';

// ==========================================
// AUTOCOMPLETE
// ==========================================
export const Autocomplete = ({ value, options, onSelect, onCreate, placeholder, icon: Icon, disabled = false, className = "", renderOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const suppressSuggestionsUntilEditRef = useRef(null);
  const isCreatingRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);

  const dedupedOptions = useMemo(() => {
    const seen = new Set();
    return options.filter(o => {
      if (!o?.label) return false;
      const key = typeof o.id === 'number'
        ? `id:${o.id}`
        : `label:${o.label.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [options]);

  const currentOption = dedupedOptions.find(o => o.id === value || o.label === value || String(o.id) === String(value));
  const displayValue = currentOption ? currentOption.label : (typeof value === 'string' ? value : '');

  useEffect(() => {
    if (!isOpen) setSearch(displayValue);
  }, [value, displayValue, isOpen]);

  const commitDraftToValue = useCallback(() => {
    const draft = search.trim();
    if (!draft) return;
    const current = currentOption?.label ?? (typeof value === 'string' ? value : '');
    if (draft.toLowerCase() !== String(current || '').toLowerCase()) {
      onSelect?.(draft, draft);
    }
  }, [search, value, currentOption, onSelect]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inWrapper = wrapperRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (inWrapper || inMenu) return;
      commitDraftToValue();
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [commitDraftToValue]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setIsOpen(true);
    const suppressed = suppressSuggestionsUntilEditRef.current;
    if (suppressed && val.trim().toLowerCase() !== suppressed.toLowerCase()) {
      suppressSuggestionsUntilEditRef.current = null;
    }
    if (val === '') {
      suppressSuggestionsUntilEditRef.current = null;
      onSelect('');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    suppressSuggestionsUntilEditRef.current = null;
    setSearch('');
    onSelect('');
    setIsOpen(false);
  };

  const searchNorm = search.toLowerCase().trim();
  const isSuppressedMatch = suppressSuggestionsUntilEditRef.current
    && searchNorm === suppressSuggestionsUntilEditRef.current.toLowerCase();

  const filteredOptions = useMemo(() => {
    if (isSuppressedMatch) return [];
    return dedupedOptions
      .filter(o => !searchNorm || o.label.toLowerCase().includes(searchNorm))
      .sort((a, b) => a.label.localeCompare(b.label, 'de-DE'))
      .slice(0, 100);
  }, [dedupedOptions, searchNorm, isSuppressedMatch]);

  const exactMatch = isSuppressedMatch
    || dedupedOptions.some(o => o.label.toLowerCase() === searchNorm);

  const handleCreateClick = async (e) => {
    e.preventDefault();
    if (isCreatingRef.current) return;
    const val = search.trim();
    if (!val) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    try {
      const createdLabel = await Promise.resolve(onCreate(val));
      const label = typeof createdLabel === 'string' ? createdLabel : val;
      suppressSuggestionsUntilEditRef.current = label;
      setSearch(label);
      setIsOpen(false);
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  };

  const updateMenuPosition = useCallback(() => {
    const root = wrapperRef.current;
    if (!root || !isOpen) return;
    const rect = root.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const maxListPx = 320;
    const openUp = spaceBelow < 120 && spaceAbove > spaceBelow;
    const rawMax = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(maxListPx, Math.max(160, rawMax));
    const width = Math.max(rect.width, 140);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    if (openUp) {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        maxHeight,
        bottom: window.innerHeight - rect.top + margin,
        zIndex: 10000,
      });
    } else {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        maxHeight,
        top: rect.bottom + margin,
        zIndex: 10000,
      });
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || disabled) {
      setMenuStyle(null);
      return;
    }
    updateMenuPosition();
    const ro = new ResizeObserver(() => updateMenuPosition());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen, disabled, updateMenuPosition, filteredOptions.length, searchNorm, exactMatch, dedupedOptions.length]);

  const handleMenuWheel = useCallback((e) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      e.preventDefault();
      return;
    }
    const atTop = scrollTop <= 0 && e.deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
    if (atTop || atBottom) e.preventDefault();
  }, []);

  const handleFocus = () => {
    const draft = (isOpen ? search : displayValue).trim();
    const suppressed = suppressSuggestionsUntilEditRef.current;
    if (suppressed && draft.toLowerCase() === suppressed.toLowerCase()) {
      setSearch(displayValue || draft);
      return;
    }
    setIsOpen(true);
  };

  const listBlock = (
    <>
      {filteredOptions.length > 0 ? (
        filteredOptions.map(opt => (
          <div key={opt.id} className="px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0 shrink-0" onMouseDown={(e) => { e.preventDefault(); suppressSuggestionsUntilEditRef.current = null; onSelect(opt.id, opt.label); setIsOpen(false); }}>
            {renderOption ? renderOption(opt) : opt.label}
          </div>
        ))
      ) : (
        search.trim() === '' && dedupedOptions.length === 0 ? <div className="px-4 py-3 text-sm text-slate-400 italic shrink-0">Bitte tippen...</div> : null
      )}
      {searchNorm !== '' && !exactMatch && onCreate && (
        <div className={`px-4 py-3 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer flex items-center gap-2 bg-slate-50/50 border-t border-slate-100 transition-colors shrink-0 ${isCreating ? 'opacity-50 pointer-events-none' : ''}`} onMouseDown={handleCreateClick}>
          <Plus size={16} className="shrink-0" /><span>Neu anlegen: "{search}"</span>
        </div>
      )}
    </>
  );

  const dropdownPortal = isOpen && !disabled && menuStyle && typeof document !== 'undefined'
    ? createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            key="ac-dropdown"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={menuStyle}
            onWheel={handleMenuWheel}
            className="bg-white/98 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-2xl overflow-y-auto overscroll-contain flex flex-col min-h-0 touch-pan-y"
          >
            {listBlock}
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center group">
        {Icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon size={16} className="text-slate-400 group-focus-within:text-violet-500 transition-colors" /></div>}
        <input
          type="text" value={isOpen ? search : displayValue} onChange={handleInputChange} onFocus={handleFocus} placeholder={placeholder} disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2 border border-slate-200/80 rounded-xl outline-none text-sm transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-white/50 focus:bg-white disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
        />
        {(displayValue || (isOpen && search)) && !disabled && (
          <button type="button" onClick={handleClear} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
        )}
      </div>
      {dropdownPortal}
    </div>
  );
};

// ==========================================
// DELETE MODAL
// ==========================================
export const DeleteModal = ({ deleteModal, setDeleteModal, executeDelete }) => (
  <AnimModal show={deleteModal.isOpen}>
    <div className="flex items-center gap-4 text-red-600 mb-5">
      <div className="bg-red-50 p-3 rounded-full"><AlertTriangle size={28} /></div>
      <h3 className="text-2xl font-extrabold">{deleteModal.type === 'protokoll' ? 'Protokoll löschen?' : 'Eintrag löschen?'}</h3>
    </div>
    <p className="text-slate-600 mb-8 leading-relaxed">
      {deleteModal.type === 'protokoll'
        ? 'Möchtest du dieses gesamte Protokoll mit allen dazugehörigen Einträgen und Kommentaren unwiderruflich löschen?'
        : 'Möchtest du diesen Eintrag mit allen dazugehörigen Aufgaben und Kommentaren unwiderruflich löschen?'}
    </p>
    <div className="flex justify-end gap-3">
      <button type="button" onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })} className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Abbrechen</button>
      <button type="button" onClick={executeDelete} className="px-5 py-2.5 font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors">Löschen</button>
    </div>
  </AnimModal>
);

// ==========================================
// PROCESS BAR
// ==========================================
export const ProcessBar = ({ taskCounts, taskProcessFilter, handleFilterClick }) => (
  <div className="flex flex-row items-center w-full py-4 mb-6">

    <button
      onClick={() => handleFilterClick('all_tasks')}
      style={{ backgroundColor: '#061ab1' }}
      className={`relative z-50 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full text-white shadow-lg transition-transform hover:scale-105 ${taskProcessFilter === 'all_tasks' ? 'font-bold' : ''}`}
    >
      <span className="text-lg sm:text-xl font-bold leading-none">{taskCounts.all}</span>
      <span className="text-xs leading-tight mt-1 text-center px-2">Alle<br/>Aufgaben</span>
    </button>

    <button
      onClick={() => handleFilterClick('Offen')}
      style={{ backgroundColor: '#cdd1ef', color: '#1e1e2f' }}
      className={`relative z-40 flex flex-col items-center justify-center h-12 sm:h-16 flex-1 -ml-6 sm:-ml-8 pl-8 sm:pl-10 pr-2 rounded-r-full transition-all hover:brightness-95 ${taskProcessFilter === 'Offen' ? 'font-bold shadow-inner' : ''}`}
    >
      <span className="text-base sm:text-lg font-bold leading-none">{taskCounts.offen}</span>
      <span className="text-xs leading-tight mt-0.5">Offen</span>
    </button>

    <button
      onClick={() => handleFilterClick('Geplant')}
      style={{ backgroundColor: '#c8e7f2', color: '#0f4a66' }}
      className={`relative z-30 flex flex-col items-center justify-center h-12 sm:h-16 flex-1 -ml-4 sm:-ml-6 pl-6 sm:pl-8 pr-2 rounded-r-full transition-all hover:brightness-95 ${taskProcessFilter === 'Geplant' ? 'font-bold shadow-inner' : ''}`}
    >
      <span className="text-base sm:text-lg font-bold leading-none">{taskCounts.geplant}</span>
      <span className="text-xs leading-tight mt-0.5">Geplant</span>
    </button>

    <button
      onClick={() => handleFilterClick('In Bearbeitung')}
      style={{ backgroundColor: '#d1e79b', color: '#3f5211' }}
      className={`relative z-20 flex flex-col items-center justify-center h-12 sm:h-16 flex-1 -ml-4 sm:-ml-6 pl-6 sm:pl-8 pr-2 rounded-r-full transition-all hover:brightness-95 ${taskProcessFilter === 'In Bearbeitung' ? 'font-bold shadow-inner' : ''}`}
    >
      <span className="text-base sm:text-lg font-bold leading-none">{taskCounts.in_bearbeitung}</span>
      <span className="text-xs leading-tight mt-0.5 text-center hidden sm:block">In Bearbeitung</span>
      <span className="text-xs leading-tight mt-0.5 sm:hidden">In Bearb.</span>
    </button>

    <button
      onClick={() => handleFilterClick('Erledigt')}
      style={{ backgroundColor: '#90d36a', color: '#1a4007' }}
      className={`relative z-10 flex flex-col items-center justify-center h-12 sm:h-16 flex-1 -ml-4 sm:-ml-6 pl-6 sm:pl-8 pr-2 rounded-r-full transition-all hover:brightness-95 ${taskProcessFilter === 'Erledigt' ? 'font-bold shadow-inner' : ''}`}
    >
      <span className="text-base sm:text-lg font-bold leading-none">{taskCounts.erledigt}</span>
      <span className="text-xs leading-tight mt-0.5">Erledigt</span>
    </button>
  </div>
);