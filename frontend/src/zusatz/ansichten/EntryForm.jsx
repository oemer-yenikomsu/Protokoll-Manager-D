import React from 'react';
import { Plus, X, Folder, Users, Clock, CheckCircle2, Edit2, Trash2, Search } from 'lucide-react';
import { Autocomplete } from '../komponenten/UIComponents.jsx';
import { getTaskStatusColor } from '../hilfen.js';

export const EntryForm = ({
  titleText, detailEintragForm, editingEintragId,
  bekannteThemen, bekannteAufgaben, tblProjekt, tblSchritt, tblUnterschritt, tblPerson,
  updateDetailEintrag, cancelDetailEintrag, saveDetailEintrag,
  handleCreateThema, handleCreateProjekt, handleCreateSchritt, handleCreateUnterschritt,
  handleCreatePerson, handleCreateAufgabe,
  setDeleteModal, setDetailEintragForm, getCurrentTime, isQTacEmployee, getFullPersonName,
}) => {
  const availablePersons = tblPerson
    .map(p => ({ id: p.person_id, label: getFullPersonName(p.person_id) }))
    .filter(p => !detailEintragForm.teilnehmer.some(t => t.person_id === p.id));

  return (
    <div className="p-6 border-2 border-violet-200 rounded-2xl bg-violet-50/30 relative shadow-sm mb-6 print:hidden">
      <div className="flex justify-between items-center mb-5 border-b border-violet-100 pb-3">
        <h4 className="font-bold text-violet-800 flex items-center gap-2">{editingEintragId ? <Edit2 size={18} /> : <Plus size={18} />} {titleText}</h4>
        <button onClick={cancelDetailEintrag} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thema</label>
        <Autocomplete value={detailEintragForm.thema} options={bekannteThemen.map(t => ({ id: t, label: t }))} onSelect={(id) => updateDetailEintrag('thema', id)} onCreate={(val) => handleCreateThema(val, (v) => updateDetailEintrag('thema', v))} placeholder="Worum ging es in diesem Gespräch?" className="font-semibold bg-white" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 mb-5 shadow-sm">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Folder size={14} className="text-violet-400" /> Optionale Projektzuordnung</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Autocomplete value={detailEintragForm.projekt_id} options={tblProjekt.map(p => ({ id: p.projekt_id, label: p.bezeichnung }))} onSelect={(id) => updateDetailEintrag('projekt_id', id)} onCreate={(val) => handleCreateProjekt(val, (id) => updateDetailEintrag('projekt_id', id))} placeholder="Projekt suchen/anlegen..." />
          <Autocomplete value={detailEintragForm.schritt_id} options={tblSchritt.filter(s => s.projekt_id === parseInt(detailEintragForm.projekt_id)).map(s => ({ id: s.schritt_id, label: s.bezeichnung }))} onSelect={(id) => updateDetailEintrag('schritt_id', id)} onCreate={(val) => handleCreateSchritt(val, detailEintragForm.projekt_id, (id) => updateDetailEintrag('schritt_id', id))} placeholder="Schritt suchen/anlegen..." disabled={!detailEintragForm.projekt_id} />
          <Autocomplete value={detailEintragForm.unterschritt_id} options={tblUnterschritt.filter(u => u.schritt_id === parseInt(detailEintragForm.schritt_id)).map(u => ({ id: u.unterschritt_id, label: u.bezeichnung }))} onSelect={(id) => updateDetailEintrag('unterschritt_id', id)} onCreate={(val) => handleCreateUnterschritt(val, detailEintragForm.schritt_id, (id) => updateDetailEintrag('unterschritt_id', id))} placeholder="Unterschritt suchen/anlegen..." disabled={!detailEintragForm.schritt_id} />
        </div>
      </div>

      <div className="flex flex-col gap-6 mb-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Users size={14} className="text-violet-400" /> Gesprächspartner & Zeiten</label>
          <div className="space-y-2.5 mb-4">
            {detailEintragForm.teilnehmer.map(t => {
              const isQTac = isQTacEmployee(t.person_id);
              return (
                <div key={t.person_id} className={`flex items-center justify-between p-2.5 rounded-xl border shadow-sm ${isQTac ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-slate-200/80'}`}>
                  <div className="flex-1 truncate pr-2"><span className={`text-sm font-semibold ${isQTac ? 'text-violet-800' : 'text-slate-700'}`}>{getFullPersonName(t.person_id)}</span></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
                      <Clock size={14} className="text-slate-400" />
                      <input type="time" className="text-xs outline-none font-medium text-slate-700 bg-transparent w-16" value={t.joined_at} onChange={(e) => setDetailEintragForm(prev => ({ ...prev, teilnehmer: prev.teilnehmer.map(pt => pt.person_id === t.person_id ? { ...pt, joined_at: e.target.value } : pt) }))} />
                    </div>
                    <button onClick={() => setDetailEintragForm(prev => ({ ...prev, teilnehmer: prev.teilnehmer.filter(pt => pt.person_id !== t.person_id) }))} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <Autocomplete value="" options={availablePersons} onSelect={(id) => setDetailEintragForm(prev => ({ ...prev, teilnehmer: [...prev.teilnehmer, { person_id: id, joined_at: getCurrentTime() }] }))} onCreate={(val) => handleCreatePerson(val, (id) => setDetailEintragForm(prev => ({ ...prev, teilnehmer: [...prev.teilnehmer, { person_id: id, joined_at: getCurrentTime() }] })))} placeholder="Teilnehmer suchen/anlegen..." icon={Search} />
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gesprächsinhalt</label>
            <textarea rows="4" className="w-full p-3 border border-slate-200/80 rounded-xl outline-none resize-none text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm transition-all" value={detailEintragForm.text} onChange={e => updateDetailEintrag('text', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} /> Aufgaben (optional)</label>
            <div className="space-y-2.5 mb-3">
              {detailEintragForm.aufgaben.map((aufgabe, aIdx) => (
                <div key={aIdx} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <select value={aufgabe.status} onChange={(e) => { const newAufgaben = [...detailEintragForm.aufgaben]; newAufgaben[aIdx].status = e.target.value; updateDetailEintrag('aufgaben', newAufgaben); }} className="text-xs font-bold rounded-lg px-2 py-1.5 border outline-none cursor-pointer transition-colors" style={getTaskStatusColor(aufgabe.status)}>
                      <option value="Offen">Offen</option><option value="Geplant">Geplant</option><option value="In Bearbeitung">In Bearbeitung</option><option value="Erledigt">Erledigt</option>
                    </select>
                    <span className={`text-sm font-medium ${aufgabe.status === 'Erledigt' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{aufgabe.text}</span>
                  </div>
                  <button onClick={() => updateDetailEintrag('aufgaben', detailEintragForm.aufgaben.filter((_, i) => i !== aIdx))} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                </div>
              ))}
            </div>
            <Autocomplete value="" options={bekannteAufgaben.map(a => ({ id: a, label: a }))} onSelect={(id) => updateDetailEintrag('aufgaben', [...detailEintragForm.aufgaben, { text: id, status: 'Offen' }])} onCreate={(val) => handleCreateAufgabe(val, (v) => updateDetailEintrag('aufgaben', [...detailEintragForm.aufgaben, { text: v, status: 'Offen' }]))} placeholder="Aufgabe suchen oder neu anlegen..." icon={Plus} className="bg-slate-50 border-slate-200" />
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
          <button onClick={saveDetailEintrag} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center font-semibold shadow-md shadow-violet-500/20 transition-all active:scale-95"><Edit2 size={18} className="mr-2" /> Speichern</button>
        </div>
      </div>
    </div>
  );
};