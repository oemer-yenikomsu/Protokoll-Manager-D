/**
 * ================================================================================
 * KERN – Frontend-Einstieg (IHK-Projekt, Prüfungsversion)
 * ================================================================================
 * Diese Datei ist bewusst kurz: nur der Startpunkt für React.
 *
 * | Was hier?        | Wo liegt der Rest?              |
 * |------------------|---------------------------------|
 * | <ProtokollApp /> | zusatz/ProtokollApp.jsx (Masken) |
 * | API-Aufrufe      | kern/api.js                     |
 * | Layout/Animation | zusatz/extraDesign.jsx (NF02)   |
 * | F06–F08          | zusatz/ (Tabelle, PDF, Export)   |
 *
 * Herkunft (grob): React-Standard (Komponente rendern); Vorlage: React-Einstieg in der Doku.
 * ================================================================================
 */

// --- 1) Haupt-UI aus Zusatz laden (F01–F08 Oberfläche) -------------------------
import ProtokollApp from '../zusatz/ProtokollApp.jsx';

// --- 2) Nur eine Komponente rendern --------------------------------------------
export default function App() {
  return <ProtokollApp />;
}
