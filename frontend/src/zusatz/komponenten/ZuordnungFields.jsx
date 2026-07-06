import React from 'react';
import { Autocomplete } from './UIComponents.jsx';

/** Kaskade: Projektart -> Prozessschritt -> Prozessunterschritt; Projekt (gefiltert nach Projektart). */
export const ZuordnungFields = ({
  values,
  onChange,
  tblProjektart,
  tblProjekt,
  tblSchritt,
  tblUnterschritt,
  handleCreateProjektart,
  handleCreateSchritt,
  handleCreateUnterschritt,
  handleCreateProjekt,
  showProjekt = true,
}) => {
  const projektartId = values.projektart_id;
  const schrittId = values.schritt_id;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Projektart <span className="text-red-500">*</span>
        </label>
        <Autocomplete
          value={projektartId}
          options={tblProjektart.map(pa => ({ id: pa.projektart_id, label: pa.bezeichnung }))}
          onSelect={(id) => onChange('projektart_id', id)}
          onCreate={(val) => handleCreateProjektart(val, (id) => onChange('projektart_id', id))}
          placeholder={'Projektart w\u00e4hlen\u2026'}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prozessschritt</label>
        <Autocomplete
          value={schrittId}
          options={tblSchritt
            .filter(s => s.projektart_id === parseInt(projektartId))
            .map(s => ({ id: s.schritt_id, label: s.bezeichnung }))}
          onSelect={(id) => onChange('schritt_id', id)}
          onCreate={(val) => handleCreateSchritt(val, projektartId, (id) => onChange('schritt_id', id))}
          placeholder="Schritt suchen/anlegen..."
          disabled={!projektartId}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prozessunterschritt</label>
        <Autocomplete
          value={values.unterschritt_id}
          options={tblUnterschritt
            .filter(u => u.schritt_id === parseInt(schrittId))
            .map(u => ({ id: u.unterschritt_id, label: u.bezeichnung }))}
          onSelect={(id) => onChange('unterschritt_id', id)}
          onCreate={(val) => handleCreateUnterschritt(val, schrittId, (id) => onChange('unterschritt_id', id))}
          placeholder="Unterschritt suchen/anlegen..."
          disabled={!schrittId}
        />
      </div>
      {showProjekt && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Projekt</label>
          <Autocomplete
            value={values.projekt_id}
            options={tblProjekt
              .filter(p => p.projektart_id === parseInt(projektartId))
              .map(p => ({ id: p.projekt_id, label: p.bezeichnung }))}
            onSelect={(id) => onChange('projekt_id', id)}
            onCreate={(val) => handleCreateProjekt(val, projektartId, (id) => onChange('projekt_id', id))}
            placeholder="Projekt suchen/anlegen..."
            disabled={!projektartId}
          />
        </div>
      )}
    </div>
  );
};
