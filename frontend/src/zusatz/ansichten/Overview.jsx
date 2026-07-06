import React from 'react';
import { motion, AnimatePresence } from '../extraDesign.jsx';
import { Search, Filter, ArrowUpDown, Plus, SlidersHorizontal, XCircle, MapPin, Tag, Edit2, Lock, ChevronRight, FilterX } from 'lucide-react';
import { Autocomplete, ProcessBar } from '../komponenten/UIComponents.jsx';
import { getTypeColor } from '../hilfen.js';

export const Overview = ({
  searchTerm, setSearchTerm, showAdvFilters, setShowAdvFilters,
  activeFilterCount, isAnyFilterActive, handleGlobalReset,
  sortOrder, setSortOrder, handleOpenCreate,
  advFilters, bekannteOrte, bekannteTypen, bekannteThemen, bekannteAufgaben,
  tblProjektart, tblProjekt, tblSchritt, tblUnterschritt, tblPerson,
  resetAdvFilters, handleAdvFilterChange, handleAdvFilterZuordnung, getProjektartNameForEintrag,
  taskCounts, taskProcessFilter, handleFilterClick,
  sortedAndFilteredProtokolle, tblEintrag, tblEintragPerson,
  checkIsEditable, handleEditProtokoll,
  setSelectedProtokollId, setHiddenEntries, setView,
  getBenutzerDisplayName, getFullPersonName, handleCreatePerson, handleCreateAufgabe,
  personAutocompleteOptions, benutzerAutocompleteOptions,
  resolvePersonFilterValue, resolveBenutzerFilterValue,
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 relative z-0">

    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
      <p className="text-slate-500 text-sm shrink-0">Verwalte deine Gespräche und Notizen effizient.</p>
      <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 w-full md:w-auto min-w-0 md:ml-auto">
        <div className="relative w-full min-w-0 md:w-44 lg:w-52 xl:w-56 shrink-0 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-slate-400 group-focus-within:text-violet-500 transition-colors" /></div>
          <input type="text" placeholder="Volltextsuche..." className="block w-full pl-10 pr-4 py-2.5 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowAdvFilters(!showAdvFilters)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl shrink-0 transition-all shadow-sm text-sm font-medium ${showAdvFilters || activeFilterCount > 0 ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white/80 backdrop-blur-sm border-slate-200/60 text-slate-700 hover:bg-white'}`}>
          <Filter size={18} /> {activeFilterCount > 0 && <span className="bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
        </button>
        {isAnyFilterActive && (
          <button onClick={handleGlobalReset} className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl transition-all shadow-sm text-sm font-medium shrink-0">
            <FilterX size={18} /> <span className="hidden sm:inline">Filter leeren</span>
          </button>
        )}
        <div className="relative shrink-0">
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="appearance-none pl-10 pr-8 py-2.5 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all text-sm font-medium text-slate-700 hover:bg-white cursor-pointer">
            <option value="date_desc">Neueste zuerst</option>
            <option value="date_asc">Älteste zuerst</option>
            <option value="id_desc">ID absteigend</option>
            <option value="id_asc">ID aufsteigend</option>
          </select>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ArrowUpDown size={18} className="text-slate-400" /></div>
        </div>
        <button onClick={handleOpenCreate} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-md shadow-violet-500/20 active:scale-95 shrink-0"><Plus size={22} /></button>
      </div>
    </div>

    <AnimatePresence>
      {showAdvFilters && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="relative z-[60] overflow-visible mb-6"
        >
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm overflow-visible isolate">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2"><SlidersHorizontal size={18} className="text-violet-500" /> Erweiterte Suche & Filter</h3>
              <button onClick={resetAdvFilters} className="text-sm text-slate-500 hover:text-violet-600 flex items-center gap-1 transition-colors"><XCircle size={14} /> Zurücksetzen</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Protokoll-ID</label><input type="text" placeholder="z.B. 101" className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-violet-500" value={advFilters.protokoll_id} onChange={e => handleAdvFilterChange('protokoll_id', e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Datum</label><input type="date" className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-violet-500" value={advFilters.datum} onChange={e => handleAdvFilterChange('datum', e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Ort</label><Autocomplete value={advFilters.ort} options={bekannteOrte.map(o => ({ id: o, label: o }))} onSelect={(id) => handleAdvFilterChange('ort', id)} placeholder="Ort wählen..." /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Typ</label><Autocomplete value={advFilters.typ === 'Alle' ? '' : advFilters.typ} options={bekannteTypen.map(t => ({ id: t, label: t }))} onSelect={(id) => handleAdvFilterChange('typ', id || 'Alle')} placeholder="Alle Typen" /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Ersteller</label><Autocomplete value={resolveBenutzerFilterValue(advFilters.ersteller)} options={benutzerAutocompleteOptions} onSelect={(id) => handleAdvFilterChange('ersteller', getBenutzerDisplayName(id))} placeholder="Benutzer wählen..." /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Erstellt am</label><input type="date" className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-violet-500" value={advFilters.erstellt_am} onChange={e => handleAdvFilterChange('erstellt_am', e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Thema</label><Autocomplete value={advFilters.thema} options={bekannteThemen.map(t => ({ id: t, label: t }))} onSelect={(id) => handleAdvFilterChange('thema', id)} placeholder="Thema wählen..." /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Projektart</label><Autocomplete value={advFilters.projektart_id} options={tblProjektart.map(pa => ({ id: pa.projektart_id, label: pa.bezeichnung }))} onSelect={(id) => handleAdvFilterZuordnung('projektart_id', id)} placeholder="Projektart wählen..." /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Prozessschritt</label><Autocomplete value={advFilters.schritt_id} options={tblSchritt.filter(s => s.projektart_id === parseInt(advFilters.projektart_id)).map(s => ({ id: s.schritt_id, label: s.bezeichnung }))} onSelect={(id) => handleAdvFilterZuordnung('schritt_id', id)} placeholder="Schritt wählen..." disabled={!advFilters.projektart_id} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Unterschritt</label><Autocomplete value={advFilters.unterschritt_id} options={tblUnterschritt.filter(u => u.schritt_id === parseInt(advFilters.schritt_id)).map(u => ({ id: u.unterschritt_id, label: u.bezeichnung }))} onSelect={(id) => handleAdvFilterZuordnung('unterschritt_id', id)} placeholder="Unterschritt wählen..." disabled={!advFilters.schritt_id} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Projekt</label><Autocomplete value={advFilters.projekt_id} options={tblProjekt.filter(p => p.projektart_id === parseInt(advFilters.projektart_id)).map(p => ({ id: p.projekt_id, label: p.bezeichnung }))} onSelect={(id) => handleAdvFilterZuordnung('projekt_id', id)} placeholder="Projekt wählen..." disabled={!advFilters.projektart_id} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Teilnehmer</label><Autocomplete value={resolvePersonFilterValue(advFilters.teilnehmer)} options={personAutocompleteOptions} onSelect={(id) => handleAdvFilterChange('teilnehmer', getFullPersonName(id))} onCreate={(val) => handleCreatePerson(val, null, (personId) => handleAdvFilterChange('teilnehmer', getFullPersonName(personId)))} placeholder="Teilnehmer wählen..." /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Aufgaben</label><Autocomplete value={advFilters.aufgaben} options={bekannteAufgaben.map(a => ({ id: a, label: a }))} onSelect={(id) => handleAdvFilterChange('aufgaben', id)} onCreate={(val) => handleCreateAufgabe(val, (v) => handleAdvFilterChange('aufgaben', v))} placeholder="Aufgabe wählen..." /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Inhalt</label><input type="text" placeholder="Freitext Suche..." className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-violet-500" value={advFilters.inhalt} onChange={e => handleAdvFilterChange('inhalt', e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Kommentare</label><input type="text" placeholder="Freitext Suche..." className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-violet-500" value={advFilters.kommentare} onChange={e => handleAdvFilterChange('kommentare', e.target.value)} /></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <ProcessBar taskCounts={taskCounts} taskProcessFilter={taskProcessFilter} handleFilterClick={handleFilterClick} />

    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      {sortedAndFilteredProtokolle.length === 0 ? (
        <div className="p-12 text-center text-slate-500"><Search size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-lg font-medium">Keine Protokolle gefunden</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-200/60">
                <th className="p-4 pl-6 font-semibold">Datum & Ort</th>
                <th className="p-4 font-semibold">Kategorie</th>
                <th className="p-4 font-semibold">Einträge & Beteiligte</th>
                <th className="p-4 font-semibold">Erfassung</th>
                <th className="p-4 pr-6 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {sortedAndFilteredProtokolle.map(protokoll => {
                const erstellerName = getBenutzerDisplayName(protokoll.autor_id);
                const eintraege = tblEintrag.filter(e => e.protokoll_id === protokoll.protokoll_id);
                const allTeilnehmerIds = new Set();
                eintraege.forEach(e => tblEintragPerson.filter(ep => ep.eintrag_id === e.eintrag_id).forEach(ep => allTeilnehmerIds.add(ep.person_id)));
                const isEditable = checkIsEditable(protokoll.erstellt_am);
                const badgeClass = getTypeColor(protokoll.typ);
                const projektartNames = [...new Set(eintraege.map(e => getProjektartNameForEintrag(e)).filter(Boolean))];
                return (
                  <tr key={protokoll.protokoll_id} onClick={() => { setSelectedProtokollId(protokoll.protokoll_id); setHiddenEntries([]); setView('detail'); }} className="hover:bg-white/60 cursor-pointer transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{protokoll.protokoll_id}</span>
                        <div className="font-semibold text-slate-800">{new Date(protokoll.datum).toLocaleDateString('de-DE')}</div>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {protokoll.ort || 'Kein Ort'}</div>
                    </td>
                    <td className="p-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${badgeClass}`}><Tag size={12} /> {protokoll.typ}</span></td>
                    <td className="p-4 text-sm text-slate-600"><div className="font-medium">{eintraege.length} Gespräch(e)</div>{projektartNames.length > 0 && <div className="text-xs text-violet-600 mt-1 font-medium">{projektartNames.join(', ')}</div>}<div className="text-xs text-slate-500 mt-1">{allTeilnehmerIds.size > 0 ? `${allTeilnehmerIds.size} Personen involviert` : 'Keine Teilnehmer'}</div></td>
                    <td className="p-4 text-sm">
                      <div className="text-slate-700 font-medium">{erstellerName !== 'Unbekannt' ? erstellerName : '—'}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(protokoll.erstellt_am).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} Uhr</div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        {isEditable ? (
                          <button onClick={(e) => handleEditProtokoll(protokoll.protokoll_id, e)} className="p-2 hover:bg-violet-100 hover:text-violet-600 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        ) : (
                          <div className="p-2 text-slate-300" title="Bearbeitung gesperrt (> 72h)"><Lock size={18} /></div>
                        )}
                        <button className="p-2 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors group-hover:translate-x-1"><ChevronRight size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </motion.div>
);
