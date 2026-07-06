/** Anzeige für Personen ohne Firmenzuordnung (gesperrt oder ohne org_id). */
export const ORG_LABEL_PRIVAT = 'Privat';

/** Entwurf in Teilnehmer-/Organisationsfeldern (bleibt bis Hinzufügen oder Speichern). */
export const emptyTeilnehmerPick = () => ({ person: '', person_id: '', org: '', org_id: '' });

/** Aktuelle Organisations-Zuordnung einer Person für das Picker-Feld. */
export const orgPickFromPerson = (person) => {
  if (!person?.org_id) return { org_id: '', org: '' };
  return { org_id: String(person.org_id), org: '' };
};
