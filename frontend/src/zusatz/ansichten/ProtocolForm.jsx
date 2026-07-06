import React from 'react';
import { motion } from '../extraDesign.jsx';
import { ArrowLeft, FileText, MessageSquare, Folder, Users, Clock, CheckCircle2, Plus, Trash2, Edit2, Search, X } from 'lucide-react';
import { Autocomplete } from '../komponenten/UIComponents.jsx';
import { ZuordnungFields } from '../komponenten/ZuordnungFields.jsx';
import { TeilnehmerBlock } from '../komponenten/TeilnehmerBlock.jsx';
import { getTaskStatusColor } from '../hilfen.js';

export const Create = ({
  editingProtokollId, formState, setFormState,
  bekannteTypen, bekannteOrte, bekannteThemen, bekannteAufgaben,
  tblProjektart, tblProjekt, tblSchritt, tblUnterschritt, tblPerson,
  addEintrag, removeEintrag, updateEintrag, handleCreateSubmit,
  handleCreateTyp, handleCreateOrt, handleCreateThema, handleCreateAufgabe,
  handleCreateProjektart, handleCreateProjekt, handleCreateSchritt, handleCreateUnterschritt, handleCreatePerson,
  handleCreateOrganisation, handleUpdatePersonOrg, personAutocompleteOptions, organisationAutocompleteOptions,
  setView, isQTacEmployee, getPersonDisplayName, getOrganisationLabel, getCurrentTime,
  handleCancelCreate,
  canEditPersonOrganisation,
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6 pb-12 relative z-0">
    <div className="flex items-center gap-4">
      <button onClick={handleCancelCreate} className="p-2.5 text-slate-500 hover:text-slate-800 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-200/60 hover:border-slate-300 transition-all"><ArrowLeft size={20} /></button>
      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{editingProtokollId ? `Protokoll #${editingProtokollId} bearbeiten` : 'Neues Protokoll'}</h2>
    </div>

    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-8 space-y-10">
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2"><FileText className="text-violet-500" /> 1. Basisdaten</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Typ</label><Autocomplete value={formState.typ} options={bekannteTypen.map(t => ({ id: t, label: t }))} onSelect={(id) => setFormState({...formState, typ: id})} onCreate={(val) => handleCreateTyp(val, (v) => setFormState({...formState, typ: v}))} placeholder="Typ suchen/anlegen..." /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Datum</label><input type="date" className="w-full p-2.5 border border-slate-200/80 rounded-xl outline-none text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-white/50 focus:bg-white transition-all" value={formState.datum} onChange={e => setFormState({...formState, datum: e.target.value})} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Ort</label><Autocomplete value={formState.ort} options={bekannteOrte.map(o => ({ id: o, label: o }))} onSelect={(id) => setFormState({...formState, ort: id})} onCreate={(val) => handleCreateOrt(val, (v) => setFormState({...formState, ort: v}))} placeholder="Ort suchen/anlegen..." /></div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="text-violet-500" /> 2. Gespräche / Einträge</h3></div>
        <div className="space-y-8">
          {formState.eintraege.map((eintrag, idx) => {
            return (
              <div key={idx} className="p-6 border border-slate-200/80 rounded-2xl bg-slate-50/50 relative shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex items-center gap-3">
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100 shadow-sm">Gespräch #{idx + 1}</span>
                  {formState.eintraege.length > 1 && <button onClick={() => removeEintrag(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm"><Trash2 size={16} /></button>}
                </div>
                <div className="mb-5 pr-32">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thema</label>
                  <Autocomplete value={eintrag.thema} options={bekannteThemen.map(t => ({ id: t, label: t }))} onSelect={(id) => updateEintrag(idx, 'thema', id)} onCreate={(val) => handleCreateThema(val, (v) => updateEintrag(idx, 'thema', v))} placeholder="Worum ging es in diesem Gespräch?" className="font-semibold bg-white" />
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 mb-5 shadow-sm">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Folder size={14} className="text-violet-400" /> Projektzuordnung</label>
                  <ZuordnungFields
                    values={eintrag}
                    onChange={(field, id) => updateEintrag(idx, field, id)}
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
                  teilnehmer={eintrag.teilnehmer}
                  teilnehmerPick={eintrag.teilnehmer_pick}
                  onTeilnehmerPickChange={(pick) => {
                    const updated = [...formState.eintraege];
                    updated[idx] = { ...updated[idx], teilnehmer_pick: pick };
                    setFormState((prev) => ({ ...prev, eintraege: updated }));
                  }}
                  onTeilnehmerChange={(list) => {
                    const updated = [...formState.eintraege];
                    updated[idx] = { ...updated[idx], teilnehmer: list };
                    setFormState((prev) => ({ ...prev, eintraege: updated }));
                  }}
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
                <div className="flex flex-col gap-6 mb-4">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gesprächsinhalt</label>
                      <textarea rows="4" className="w-full p-3 border border-slate-200/80 rounded-xl outline-none resize-none text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white/50 focus:bg-white shadow-sm transition-all" value={eintrag.text} onChange={e => updateEintrag(idx, 'text', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} /> Aufgaben (optional)</label>
                      <div className="space-y-2.5 mb-3">
                        {eintrag.aufgaben.map((aufgabe, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <select value={aufgabe.status} onChange={(e) => { const updated = [...formState.eintraege]; updated[idx].aufgaben[aIdx].status = e.target.value; setFormState(prev => ({ ...prev, eintraege: updated })); }} className="text-xs font-bold rounded-lg px-2 py-1.5 border outline-none cursor-pointer transition-colors" style={getTaskStatusColor(aufgabe.status)}>
                                <option value="Offen">Offen</option><option value="Geplant">Geplant</option><option value="In Bearbeitung">In Bearbeitung</option><option value="Erledigt">Erledigt</option>
                              </select>
                              <span className={`text-sm font-medium ${aufgabe.status === 'Erledigt' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{aufgabe.text}</span>
                            </div>
                            <button onClick={() => updateEintrag(idx, 'aufgaben', eintrag.aufgaben.filter((_, i) => i !== aIdx))} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                          </div>
                        ))}
                      </div>
                      <Autocomplete value="" options={bekannteAufgaben.map(a => ({ id: a, label: a }))} onSelect={(id) => updateEintrag(idx, 'aufgaben', [...eintrag.aufgaben, { text: id, status: 'Offen' }])} onCreate={(val) => handleCreateAufgabe(val, (v) => updateEintrag(idx, 'aufgaben', [...eintrag.aufgaben, { text: v, status: 'Offen' }]))} placeholder="Aufgabe suchen oder neu anlegen..." icon={Plus} className="bg-slate-50 border-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-center">
            <button onClick={addEintrag} className="p-4 text-violet-600 bg-violet-50 rounded-full border border-violet-200 hover:bg-violet-100 shadow-sm hover:shadow-md transition-all active:scale-95"><Plus size={28} /></button>
          </div>
        </div>
      </section>
      <div className="pt-8 border-t border-slate-200/60 flex justify-end gap-4">
        <button onClick={handleCancelCreate} className="px-6 py-3 border border-slate-200/80 rounded-xl hover:bg-slate-50 text-slate-600 font-semibold transition-colors shadow-sm">Abbrechen</button>
        <button onClick={handleCreateSubmit} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center font-semibold shadow-md shadow-violet-500/20 transition-all active:scale-95"><Edit2 size={20} className="mr-2" /> Speichern</button>
      </div>
    </div>
  </motion.div>
);