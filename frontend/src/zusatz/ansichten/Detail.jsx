import React from 'react';
import { motion } from '../extraDesign.jsx';
import { ArrowLeft, Eye, EyeOff, Edit2, Trash2, Printer, FileText, MapPin, Tag, Lock, Users, Clock, Folder, CheckCircle2, MessageSquare, Send, Plus, X, Search } from 'lucide-react';
import { Autocomplete } from '../komponenten/UIComponents.jsx';
import { ZuordnungFields } from '../komponenten/ZuordnungFields.jsx';
import { TeilnehmerBlock, TeilnehmerZeile } from '../komponenten/TeilnehmerBlock.jsx';
import { getTaskStatusColor } from '../hilfen.js';

// ── Inline-Formular (kein eigener Screen, UI-Zustand von Detail) ──────────────
const EntryForm = ({
  titleText, detailEintragForm, editingEintragId,
  bekannteThemen, bekannteAufgaben, tblProjektart, tblProjekt, tblSchritt, tblUnterschritt, tblPerson,
  updateDetailEintrag, cancelDetailEintrag, saveDetailEintrag,
  handleCreateThema, handleCreateProjektart, handleCreateProjekt, handleCreateSchritt, handleCreateUnterschritt,
  handleCreatePerson, handleCreateOrganisation, handleUpdatePersonOrg, handleCreateAufgabe,
  personAutocompleteOptions, organisationAutocompleteOptions,
  setDeleteModal, setDetailEintragForm, getCurrentTime, isQTacEmployee, getPersonDisplayName, getBenutzerDisplayName, getOrganisationLabel,
  canEditPersonOrganisation,
}) => {
  return (
    <div className="p-6 border-2 border-violet-200 rounded-2xl bg-violet-50/30 relative shadow-sm mb-6 print:hidden">
      <div className="flex justify-between items-center mb-5 border-b border-violet-100 pb-3">
        <h4 className="font-bold text-violet-800 flex items-center gap-2">
          {editingEintragId ? <Edit2 size={18} /> : <Plus size={18} />} {titleText}
        </h4>
        <button onClick={cancelDetailEintrag} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thema</label>
        <Autocomplete
          value={detailEintragForm.thema}
          options={bekannteThemen.map(t => ({ id: t, label: t }))}
          onSelect={(id) => updateDetailEintrag('thema', id)}
          onCreate={(val) => handleCreateThema(val, (v) => updateDetailEintrag('thema', v))}
          placeholder="Worum ging es in diesem Gespräch?"
          className="font-semibold bg-white"
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 mb-5 shadow-sm">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Folder size={14} className="text-violet-400" /> Projektzuordnung
        </label>
        <ZuordnungFields
          values={detailEintragForm}
          onChange={updateDetailEintrag}
          tblProjektart={tblProjektart}
          tblProjekt={tblProjekt}
          tblSchritt={tblSchritt}
          tblUnterschritt={tblUnterschritt}
          handleCreateProjektart={handleCreateProjektart}
          handleCreateSchritt={handleCreateSchritt}
          handleCreateUnterschritt={handleCreateUnterschritt}
          handleCreateProjekt={handleCreateProjekt}
        />
      </div>

      <TeilnehmerBlock
        teilnehmer={detailEintragForm.teilnehmer}
        teilnehmerPick={detailEintragForm.teilnehmer_pick}
        onTeilnehmerPickChange={(pick) => setDetailEintragForm((prev) => ({ ...prev, teilnehmer_pick: pick }))}
        onTeilnehmerChange={(list) => setDetailEintragForm((prev) => ({ ...prev, teilnehmer: list }))}
        tblPerson={tblPerson}
        personOptions={personAutocompleteOptions}
        orgOptions={organisationAutocompleteOptions}
        getPersonDisplayName={getPersonDisplayName}
        getOrganisationLabel={getOrganisationLabel}
        isQTacEmployee={isQTacEmployee}
        getCurrentTime={getCurrentTime}
        onCreatePerson={handleCreatePerson}
        onCreateOrganisation={handleCreateOrganisation}
        onUpdatePersonOrg={handleUpdatePersonOrg}
        canEditPersonOrganisation={canEditPersonOrganisation}
      />

      <div className="flex flex-col gap-6 mb-5">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gesprächsinhalt</label>
            <textarea
              rows="4"
              className="w-full p-3 border border-slate-200/80 rounded-xl outline-none resize-none text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm transition-all"
              value={detailEintragForm.text}
              onChange={e => updateDetailEintrag('text', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Aufgaben (optional)
            </label>
            <div className="space-y-2.5 mb-3">
              {detailEintragForm.aufgaben.map((aufgabe, aIdx) => (
                <div key={aIdx} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <select
                      value={aufgabe.status}
                      onChange={(e) => { const newAufgaben = [...detailEintragForm.aufgaben]; newAufgaben[aIdx].status = e.target.value; updateDetailEintrag('aufgaben', newAufgaben); }}
                      className="text-xs font-bold rounded-lg px-2 py-1.5 border outline-none cursor-pointer transition-colors"
                      style={getTaskStatusColor(aufgabe.status)}
                    >
                      <option value="Offen">Offen</option>
                      <option value="Geplant">Geplant</option>
                      <option value="In Bearbeitung">In Bearbeitung</option>
                      <option value="Erledigt">Erledigt</option>
                    </select>
                    <span className={`text-sm font-medium ${aufgabe.status === 'Erledigt' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{aufgabe.text}</span>
                  </div>
                  <button onClick={() => updateDetailEintrag('aufgaben', detailEintragForm.aufgaben.filter((_, i) => i !== aIdx))} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Autocomplete
              value=""
              options={bekannteAufgaben.map(a => ({ id: a, label: a }))}
              onSelect={(id) => updateDetailEintrag('aufgaben', [...detailEintragForm.aufgaben, { text: id, status: 'Offen' }])}
              onCreate={(val) => handleCreateAufgabe(val, (v) => updateDetailEintrag('aufgaben', [...detailEintragForm.aufgaben, { text: v, status: 'Offen' }]))}
              placeholder="Aufgabe suchen oder neu anlegen..."
              icon={Plus}
              className="bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-violet-100">
        <div>
          {editingEintragId && (
            <button onClick={() => setDeleteModal({ isOpen: true, type: 'eintrag', id: editingEintragId })} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5 transition-colors">
              <Trash2 size={18} /> <span className="text-sm font-semibold">Eintrag löschen</span>
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={cancelDetailEintrag} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Abbrechen</button>
          <button onClick={saveDetailEintrag} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center font-semibold shadow-md shadow-violet-500/20 transition-all active:scale-95">
            <Edit2 size={18} className="mr-2" /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detailansicht ─────────────────────────────────────────────────────────────
export const Detail = ({
  isLoading, selectedProtokollId, tblProtokoll, tblEintrag, tblEintragPerson, tblKommentar,
  hiddenEntries, setHiddenEntries, editingEintragId, isAddingEintrag, detailEintragForm,
  newCommentTexts, setNewCommentTexts, setView, handleEditProtokoll, setDeleteModal,
  initDetailEintragForm, cancelDetailEintrag, updateAufgabeStatus, handleAddComment,
  checkIsEditable, getProjekt, getSchritt, getUnterschritt, getProjektart, getPersonDisplayName, getBenutzerDisplayName, getOrganisationLabel, isQTacEmployee,
  getAutorDisplayName,
  handleCreateOrganisation, handleUpdatePersonOrg, personAutocompleteOptions, organisationAutocompleteOptions,
  bekannteThemen, bekannteAufgaben, tblProjektart, tblProjekt, tblSchritt, tblUnterschritt, tblPerson,
  updateDetailEintrag, saveDetailEintrag,
  handleCreateThema, handleCreateProjektart, handleCreateProjekt, handleCreateSchritt, handleCreateUnterschritt,
  handleCreatePerson, handleCreateAufgabe, setDetailEintragForm, getCurrentTime, getProjektartNameForEintrag,
  canEditPersonOrganisation,
}) => {
  const protokoll = tblProtokoll.find(
    (p) => p.protokoll_id === selectedProtokollId || p.protokoll_id === Number(selectedProtokollId)
  );
  const eintraege = tblEintrag.filter(e => e.protokoll_id === selectedProtokollId);

  if (!protokoll) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-64 gap-4">
        {isLoading ? (
          <motion.div className="rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent animate-spin" />
        ) : (
          <>
            <p className="text-slate-600">Protokoll konnte nicht geladen werden.</p>
            <button type="button" onClick={() => setView('overview')} className="px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 rounded-xl hover:bg-violet-100">
              Zur Übersicht
            </button>
          </>
        )}
      </motion.div>
    );
  }

  const isEditable = checkIsEditable(protokoll.erstellt_am);

  const entryFormProps = {
    detailEintragForm, editingEintragId,
    bekannteThemen, bekannteAufgaben, tblProjektart, tblProjekt, tblSchritt, tblUnterschritt, tblPerson,
    updateDetailEintrag, cancelDetailEintrag, saveDetailEintrag,
    handleCreateThema, handleCreateProjektart, handleCreateProjekt, handleCreateSchritt, handleCreateUnterschritt,
    handleCreatePerson, handleCreateOrganisation, handleUpdatePersonOrg, handleCreateAufgabe,
    personAutocompleteOptions, organisationAutocompleteOptions,
    setDeleteModal, setDetailEintragForm, getCurrentTime, isQTacEmployee, getPersonDisplayName, getBenutzerDisplayName, getOrganisationLabel,
    getProjektartNameForEintrag,
    canEditPersonOrganisation,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-4xl mx-auto pb-12 print:pb-0 print:m-0 print:max-w-none print:w-full">
      <div className="flex justify-between items-center print:hidden mb-6">
        <button onClick={() => { setView('overview'); cancelDetailEintrag(); }} className="p-2.5 text-slate-500 hover:text-slate-800 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-200/60 hover:border-slate-300 transition-all"><ArrowLeft size={20} /></button>
        <div className="flex gap-3">
          <button onClick={() => setHiddenEntries(hiddenEntries.length === eintraege.length && eintraege.length > 0 ? [] : eintraege.map(e => e.eintrag_id))} className="p-2.5 border border-slate-200/60 rounded-xl text-slate-600 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all">
            {hiddenEntries.length === eintraege.length && eintraege.length > 0 ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          {isEditable && (
            <>
              <button onClick={() => handleEditProtokoll(selectedProtokollId)} className="p-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl hover:bg-violet-100 shadow-sm transition-all"><Edit2 size={20} /></button>
              <button onClick={() => setDeleteModal({ isOpen: true, type: 'protokoll', id: selectedProtokollId })} className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 shadow-sm transition-all"><Trash2 size={20} /></button>
            </>
          )}
          <button onClick={() => window.print()} className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 shadow-sm transition-all"><Printer size={20} /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-violet-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-teal-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-6 z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-violet-100 mb-4 border border-white/10 backdrop-blur-md">
                <Tag size={12} /> {protokoll.typ}
                {!isEditable && <span className="ml-2 pl-2 border-l border-white/20 flex items-center gap-1.5"><Lock size={12} /> Schreibgeschützt</span>}
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight text-white">Protokoll #{protokoll.protokoll_id} vom {new Date(protokoll.datum).toLocaleDateString('de-DE')}</h2>
            </div>
            <div className="text-left md:text-right w-full md:w-auto bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md min-w-0">
              <div className="flex items-center md:justify-end gap-2 text-slate-200 mb-4 font-medium">
                <MapPin size={16} className="text-violet-300 shrink-0" />
                <span className="break-words">{protokoll.ort || 'Kein Ort'}</span>
              </div>
              <div className="text-sm text-slate-300 border-t border-white/10 pt-4 space-y-2">
                <div className="flex flex-col items-start md:items-end gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ersteller</span>
                  <span className="font-semibold text-white text-base leading-snug break-words mt-1">
                    {getAutorDisplayName(protokoll.autor_id)}
                  </span>
                </div>
                {protokoll.bearbeitet_von_id && (
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bearbeiter</span>
                    <span className="font-semibold text-white text-base leading-snug break-words">
                      {getAutorDisplayName(protokoll.bearbeitet_von_id)}
                    </span>
                  </div>
                )}
                <div className="text-xs text-slate-400 pt-2 border-t border-white/10">
                  Erfasst am:{' '}
                  <span className="text-slate-200 font-medium">
                    {new Date(protokoll.erstellt_am).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} Uhr
                  </span>
                  {protokoll.bearbeitet_am && (
                    <span className="block mt-1">
                      Zuletzt bearbeitet:{' '}
                      {new Date(protokoll.bearbeitet_am).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} Uhr
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <FileText size={16} className="text-violet-400" /> Gespräche / Einträge ({eintraege.length - hiddenEntries.length})
          </h3>
          <div className="space-y-8">
            {eintraege.map((eintrag, idx) => {
              if (editingEintragId === eintrag.eintrag_id && detailEintragForm) return (
                <div key={eintrag.eintrag_id} className="print:hidden">
                  <EntryForm {...entryFormProps} titleText={`Gespräch #${idx + 1} bearbeiten`} />
                </div>
              );

              const isHidden = hiddenEntries.includes(eintrag.eintrag_id);
              if (isHidden) return (
                <div key={eintrag.eintrag_id} className="border border-slate-200/60 rounded-xl bg-slate-50/50 p-4 flex justify-between items-center print:hidden opacity-60 hover:opacity-100 transition-opacity">
                  <span className="text-slate-500 italic flex items-center gap-2 text-sm font-medium"><EyeOff size={16} /> Gespräch #{idx + 1} ausgeblendet</span>
                  <button onClick={() => setHiddenEntries(prev => prev.filter(id => id !== eintrag.eintrag_id))} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Eye size={18} /></button>
                </div>
              );

              const projektartName = getProjektartNameForEintrag(eintrag);
              const projekt = getProjekt(eintrag.projekt_id);
              const schritt = getSchritt(eintrag.schritt_id);
              const unterschritt = getUnterschritt(eintrag.unterschritt_id);
              const teilnehmer = tblEintragPerson.filter(ep => ep.eintrag_id === eintrag.eintrag_id).sort((a, b) => a.joined_at.localeCompare(b.joined_at));
              const kommentare = tblKommentar.filter(k => k.eintrag_id === eintrag.eintrag_id).sort((a, b) => new Date(a.erstellt_am) - new Date(b.erstellt_am));

              return (
                <div key={eintrag.eintrag_id} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                      <span className="text-violet-600 bg-violet-50 text-sm font-bold px-2.5 py-1 rounded-md border border-violet-100 shadow-sm">#{idx + 1}</span> {eintrag.thema}
                    </h4>
                    <div className="flex gap-2 print:hidden">
                      <button onClick={() => setHiddenEntries([...hiddenEntries, eintrag.eintrag_id])} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200/80 rounded-lg shadow-sm transition-colors"><EyeOff size={16} /></button>
                      {isEditable && <button onClick={() => initDetailEintragForm(eintrag)} className="p-2 text-slate-400 hover:text-violet-600 bg-white border border-slate-200/80 rounded-lg shadow-sm transition-colors"><Edit2 size={16} /></button>}
                    </div>
                  </div>
                  <div className="p-5 space-y-6">
                    <div className="flex flex-col gap-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm">
                      <div>
                        <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2.5 flex items-center gap-1.5"><Folder size={14} className="text-violet-400" /> Zuordnung</div>
                        {projektartName || projekt || schritt || unterschritt
                          ? <div className="text-slate-700">
                              {projektartName && <span className="font-semibold text-violet-700">{projektartName}</span>}
                              {projekt && <span className="font-semibold text-slate-800">{projektartName ? ' · ' : ''}{projekt.bezeichnung}</span>}
                              {schritt && <span className="text-slate-500"> / {schritt.bezeichnung}</span>}
                              {unterschritt && <span className="text-slate-500"> / {unterschritt.bezeichnung}</span>}
                            </div>
                          : <span className="text-slate-400 italic">Keine Zuordnung</span>
                        }
                      </div>
                      <div className="border-t border-slate-200/80 pt-4">
                        <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2.5 flex items-center gap-1.5"><Users size={14} className="text-violet-400" /> Teilnehmer & Zeiten</div>
                        {teilnehmer.length > 0
                          ? (
                            <ul className="space-y-1.5">
                              {teilnehmer.map((t) => (
                                <TeilnehmerZeile
                                  key={t.person_id}
                                  personId={t.person_id}
                                  joinedAt={t.joined_at}
                                  getPersonDisplayName={getPersonDisplayName}
                                  getOrganisationLabel={getOrganisationLabel}
                                  isQTacEmployee={isQTacEmployee}
                                />
                              ))}
                            </ul>
                          )
                          : <span className="text-slate-400 italic">Keine Teilnehmer</span>
                        }
                      </div>
                    </div>
                    {(eintrag.erstellt_von_id || eintrag.bearbeitet_von_id) && (
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        {eintrag.erstellt_von_id && (
                          <span>Ersteller: <span className="font-semibold text-slate-600">{getBenutzerDisplayName(eintrag.erstellt_von_id)}</span></span>
                        )}
                        {eintrag.bearbeitet_von_id && (
                          <span>Bearbeiter: <span className="font-semibold text-slate-600">{getBenutzerDisplayName(eintrag.bearbeitet_von_id)}</span></span>
                        )}
                      </div>
                    )}
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inhalt</h5>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{eintrag.text}</p>
                    </div>
                    {eintrag.aufgaben && eintrag.aufgaben.length > 0 && (
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/80 mt-2">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckCircle2 size={14} /> Aufgaben</h5>
                        <ul className="space-y-2.5">
                          {eintrag.aufgaben.map((aufgabe, aIdx) => (
                            <li key={aIdx} className="flex items-center gap-3">
                              <select value={aufgabe.status} onChange={(e) => updateAufgabeStatus(eintrag.eintrag_id, aIdx, e.target.value)} className="text-xs font-bold rounded-lg px-2 py-1.5 border outline-none cursor-pointer transition-colors" style={getTaskStatusColor(aufgabe.status)}>
                                <option value="Offen">Offen</option><option value="Geplant">Geplant</option><option value="In Bearbeitung">In Bearbeitung</option><option value="Erledigt">Erledigt</option>
                              </select>
                              <span className={`text-sm font-medium transition-all ${aufgabe.status === 'Erledigt' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{aufgabe.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><MessageSquare size={14} className="text-violet-400" /> Kommentare ({kommentare.length})</h5>
                      {kommentare.length > 0 && (
                        <div className="space-y-4 mb-4">
                          {kommentare.map(kommentar => (
                            <div key={kommentar.kommentar_id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-700">{getBenutzerDisplayName(kommentar.autor_id)}</span>
                                <span className="text-xs font-medium text-slate-400">{new Date(kommentar.erstellt_am).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} Uhr</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">{kommentar.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3 print:hidden mt-2">
                        <input
                          type="text"
                          placeholder="Kommentar hinzufügen..."
                          className="flex-1 p-3 border border-slate-200/80 rounded-xl outline-none text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-white/50 focus:bg-white transition-all shadow-sm"
                          value={newCommentTexts[eintrag.eintrag_id] || ''}
                          onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [eintrag.eintrag_id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(eintrag.eintrag_id); }}
                        />
                        <button onClick={() => handleAddComment(eintrag.eintrag_id)} disabled={!newCommentTexts[eintrag.eintrag_id]?.trim()} className="px-4 py-3 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"><Send size={18} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isAddingEintrag && detailEintragForm ? (
              <div className="print:hidden"><EntryForm {...entryFormProps} titleText="Neues Gespräch anlegen" /></div>
            ) : (
              !editingEintragId && isEditable && (
                <div className="pt-6 border-t border-slate-200/60 flex justify-center print:hidden">
                  <button onClick={() => initDetailEintragForm(null)} className="p-4 bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"><Plus size={28} /></button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};