import React from 'react';
import { Users, Clock, Search, Plus, X } from 'lucide-react';
import { Autocomplete } from './UIComponents.jsx';
import { emptyTeilnehmerPick, orgPickFromPerson, ORG_LABEL_PRIVAT } from '../utils/teilnehmerPick.js';

const isNumericId = (id) =>
  typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(String(id)));

/** Nur Anzeige: Teilnehmer · Organisation · Uhrzeit in einer Zeile. */
export const TeilnehmerZeile = ({ personId, joinedAt, getPersonDisplayName, getOrganisationLabel, isQTacEmployee }) => {
  const isQTac = isQTacEmployee(personId);
  const org = getOrganisationLabel(personId);
  return (
    <li className={`flex flex-nowrap items-center gap-x-2 min-w-0 bg-white border px-3 py-2 rounded-lg text-sm shadow-sm ${isQTac ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200/80'}`}>
      <span className={`font-semibold shrink-0 truncate max-w-[40%] ${isQTac ? 'text-violet-700' : 'text-slate-800'}`}>
        {getPersonDisplayName(personId)}
      </span>
      <span className="text-slate-300 shrink-0">·</span>
      <span className="text-slate-600 truncate min-w-0">{org || ORG_LABEL_PRIVAT}</span>
      <span className="ml-auto shrink-0 text-slate-500 flex items-center gap-1 font-medium">
        <Clock size={12} className="text-slate-400" />
        {joinedAt} Uhr
      </span>
    </li>
  );
};

/**
 * Liste + Hinzufügen: Teilnehmer | Organisation | Uhrzeit.
 * Bei bestehender Person: Organisation aus Stammdaten vorbelegen.
 * Zuordnung änderbar nur innerhalb 72h nach Personen-Anlage (nur person.org_id, nicht Org-Stammdaten).
 */
export const TeilnehmerBlock = ({
  teilnehmer,
  onTeilnehmerChange,
  teilnehmerPick,
  onTeilnehmerPickChange,
  tblPerson,
  personOptions,
  orgOptions,
  getPersonDisplayName,
  getOrganisationLabel,
  isQTacEmployee,
  getCurrentTime,
  onCreatePerson,
  onCreateOrganisation,
  onUpdatePersonOrg,
  canEditPersonOrganisation = () => true,
  disabled = false,
}) => {
  const pick = teilnehmerPick ?? emptyTeilnehmerPick();
  const setPick = (next) => onTeilnehmerPickChange?.(typeof next === 'function' ? next(pick) : next);

  const usedIds = new Set(teilnehmer.map((t) => t.person_id));
  const availablePersons = personOptions.filter((p) => !usedIds.has(p.id));

  const getPickedPerson = () => {
    if (!pick.person_id) return null;
    const n = parseInt(pick.person_id, 10);
    if (Number.isNaN(n)) return null;
    return tblPerson.find((p) => p.person_id === n) ?? null;
  };

  const pickedPerson = getPickedPerson();
  /** Neue Person (Entwurf) oder Person < 72h: Zuordnung im Picker änderbar. */
  const pickOrgEditable = !pickedPerson || canEditPersonOrganisation(pickedPerson);

  const clearPick = () => setPick(emptyTeilnehmerPick());

  const resolveOrgId = async () => {
    if (pick.org_id !== '' && pick.org_id != null) {
      const n = parseInt(pick.org_id, 10);
      if (!Number.isNaN(n)) return n;
    }
    const name = (pick.org || '').trim();
    if (!name) return null;
    return onCreateOrganisation(name);
  };

  const assignOrgToPerson = async (personId, orgId) => {
    if (orgId == null || !onUpdatePersonOrg) return;
    const person = tblPerson.find((p) => p.person_id === personId);
    if (person && !canEditPersonOrganisation(person)) return;
    await onUpdatePersonOrg(personId, orgId);
  };

  const addTeilnehmer = async (personId) => {
    if (!personId) return;
    onTeilnehmerChange([
      ...teilnehmer,
      { person_id: personId, joined_at: getCurrentTime() },
    ]);
    clearPick();
  };

  const handleSelectPerson = (id, label) => {
    if (id === '' || id == null) {
      setPick({ ...pick, person: '', person_id: '', org: '', org_id: '' });
      return;
    }
    if (isNumericId(id)) {
      const person = tblPerson.find((p) => p.person_id === parseInt(id, 10));
      setPick({
        ...pick,
        person_id: String(id),
        person: '',
        ...orgPickFromPerson(person),
      });
    } else {
      setPick({ ...pick, person_id: '', person: String(label ?? id).trim() });
    }
  };

  const handlePersonCreateDraft = (val) => {
    const name = val.trim();
    if (!name) return;
    setPick({ ...pick, person: name, person_id: '' });
    return name;
  };

  const handleSelectOrg = (id, label) => {
    if (!pickOrgEditable) return;
    if (id === '' || id == null) {
      setPick({ ...pick, org: '', org_id: '' });
      return;
    }
    if (isNumericId(id)) {
      setPick({ ...pick, org_id: String(id), org: '' });
    } else {
      setPick({ ...pick, org_id: '', org: String(label ?? id).trim() });
    }
  };

  const handleOrgCreateDraft = (val) => {
    if (!pickOrgEditable) return;
    const name = val.trim();
    if (!name) return;
    setPick({ ...pick, org: name, org_id: '' });
    return name;
  };

  const handleAddClick = async () => {
    if (pickedPerson) {
      let orgId = null;
      if (pickOrgEditable) {
        orgId = await resolveOrgId();
        await assignOrgToPerson(pickedPerson.person_id, orgId);
      }
      await addTeilnehmer(pickedPerson.person_id);
      return;
    }
    const orgId = await resolveOrgId();
    const name = (pick.person || '').trim();
    if (!name) return;
    const personId = await onCreatePerson(name, orgId);
    if (personId) await addTeilnehmer(personId);
  };

  const updateJoinedAt = (personId, joined_at) => {
    onTeilnehmerChange(
      teilnehmer.map((t) => (t.person_id === personId ? { ...t, joined_at } : t))
    );
  };

  const removeTeilnehmer = (personId) => {
    onTeilnehmerChange(teilnehmer.filter((t) => t.person_id !== personId));
  };

  const handleRowOrgChange = async (personId, orgId) => {
    const parsed = orgId === '' || orgId == null ? null : parseInt(orgId, 10);
    const person = tblPerson.find((p) => p.person_id === personId);
    if (person && !canEditPersonOrganisation(person)) return;
    if (onUpdatePersonOrg) await onUpdatePersonOrg(personId, parsed);
  };

  const personFieldValue = pick.person_id || pick.person || '';
  const orgFieldValue = pick.org_id || pick.org || '';

  const lockedOrgDisplayValue = () => {
    if (!pickedPerson) return ORG_LABEL_PRIVAT;
    return getOrganisationLabel(pickedPerson.person_id) || ORG_LABEL_PRIVAT;
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Users size={14} className="text-violet-400" /> Teilnehmer & Zeiten
      </label>
      <div className="space-y-2.5 mb-4">
        {teilnehmer.map((t) => {
          const isQTac = isQTacEmployee(t.person_id);
          const person = tblPerson.find((p) => p.person_id === t.person_id);
          const rowOrgValue = person?.org_id ?? '';
          const orgEditable = !disabled && canEditPersonOrganisation(person);
          return (
            <div
              key={t.person_id}
              className={`flex flex-nowrap items-center gap-2 sm:gap-3 p-2.5 rounded-xl border shadow-sm min-w-0 ${isQTac ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-slate-200/80'}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className={`text-sm font-semibold shrink-0 truncate max-w-[36%] ${isQTac ? 'text-violet-800' : 'text-slate-800'}`}>
                  {getPersonDisplayName(t.person_id)}
                </span>
                <span className="text-slate-300 shrink-0 hidden sm:inline">·</span>
                <div className="min-w-[8rem] flex-1 max-w-xs">
                  {orgEditable ? (
                    <Autocomplete
                      value={rowOrgValue}
                      options={orgOptions}
                      onSelect={(id) => handleRowOrgChange(t.person_id, id)}
                      onCreate={(val) => onCreateOrganisation(val).then((oid) => { if (oid) handleRowOrgChange(t.person_id, oid); })}
                      placeholder="Organisation…"
                      className="text-xs py-1.5"
                    />
                  ) : (
                    <span className="text-xs text-slate-600 py-1.5 block truncate">
                      {getOrganisationLabel(t.person_id) || ORG_LABEL_PRIVAT}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
                  <Clock size={14} className="text-slate-400" />
                  <input
                    type="time"
                    className="text-xs outline-none font-medium text-slate-700 bg-transparent w-16"
                    value={t.joined_at}
                    disabled={disabled}
                    onChange={(e) => updateJoinedAt(t.person_id, e.target.value)}
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTeilnehmer(t.person_id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!disabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Teilnehmer</label>
            <Autocomplete
              value={personFieldValue}
              options={availablePersons}
              onSelect={handleSelectPerson}
              onCreate={handlePersonCreateDraft}
              placeholder="Name / Benutzername…"
              icon={Search}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Organisation {pickOrgEditable ? '(optional)' : ''}
            </label>
            <Autocomplete
              value={pickOrgEditable ? orgFieldValue : lockedOrgDisplayValue()}
              options={orgOptions}
              onSelect={handleSelectOrg}
              onCreate={handleOrgCreateDraft}
              placeholder={pickOrgEditable ? 'Organisation wählen…' : ORG_LABEL_PRIVAT}
              disabled={!pickOrgEditable}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={handleAddClick}
              className="px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 flex items-center gap-2"
            >
              <Plus size={16} /> Teilnehmer hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
