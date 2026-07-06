/** Leitet projektart_id aus Eintrag, Schritt oder Projekt ab (Formular-Vorausfüllung). */
export function resolveProjektartId(entry, tblSchritt, tblProjekt) {
  if (entry.projektart_id) return entry.projektart_id;
  if (entry.schritt_id) {
    const s = tblSchritt.find(x => x.schritt_id === entry.schritt_id);
    if (s?.projektart_id) return s.projektart_id;
  }
  if (entry.projekt_id) {
    const p = tblProjekt.find(x => x.projekt_id === entry.projekt_id);
    if (p?.projektart_id) return p.projektart_id;
  }
  return '';
}

export function getProjektartLabel(id, tblProjektart) {
  const pa = tblProjektart.find(p => p.projektart_id === id);
  return pa ? pa.bezeichnung : '';
}
