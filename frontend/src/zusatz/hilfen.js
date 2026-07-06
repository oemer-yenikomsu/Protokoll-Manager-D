export const getTypeColor = (typ) => {
  const colors = {
    'Besprechung': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    'Telefonat': 'bg-sky-50 text-sky-700 ring-sky-600/20',
    'Messe': 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20',
    'Vor-Ort-Termin': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    'Nachbesprechung': 'bg-teal-50 text-teal-700 ring-teal-600/20'
  };
  return colors[typ] || 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
};

export const getTaskStatusColor = (status) => {
  switch(status) {
    case 'Offen': return { backgroundColor: '#cdd1ef', color: '#1e1e2f', borderColor: '#b8bde0' };
    case 'Geplant': return { backgroundColor: '#c8e7f2', color: '#0f4a66', borderColor: '#a0d4e8' };
    case 'In Bearbeitung': return { backgroundColor: '#d1e79b', color: '#3f5211', borderColor: '#bdd678' };
    case 'Erledigt': return { backgroundColor: '#90d36a', color: '#1a4007', borderColor: '#72be4a' };
    default: return { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#e2e8f0' };
  }
};