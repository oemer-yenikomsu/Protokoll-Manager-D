/**
 * ================================================================================
 * KERN – React starten (Vite-Einstieg, Prüfungsversion)
 * ================================================================================
 * Abschnitt 1: React an #root binden (index.html)
 * Abschnitt 2: App-Komponente laden (kern/App.jsx)
 *
 * Einstieg von außen: src/main.jsx importiert nur diese Datei.
 *
 * Herkunft (grob): Vite/React-Startvorlage (createRoot), projektspezifisch angepasst.
 * ================================================================================
 */

// --- 1) Styles und React-Bibliothek --------------------------------------------
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

// --- 2) Eigene App starten -----------------------------------------------------
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
