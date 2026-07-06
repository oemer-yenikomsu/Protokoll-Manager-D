/**
 * Zusatz – Optik (nicht Kern für die Prüfung)
 * Animationen/Hintergrund: Framer-Motion- und Tailwind-Beispiele angepasst;
 * teils mit KI bei komplexeren Animationen (Kundenwunsch).
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export { motion, AnimatePresence };

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

export function DekoHintergrund() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none print:hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-200/30 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-200/30 blur-[120px]" />
    </div>
  );
}

export function LadeSpinner({ className = 'min-h-screen' }) {
  return (
    <div className={`bg-slate-50 flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent" />
    </div>
  );
}

export function IdleSperre({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] print:hidden cursor-pointer p-6"
      aria-label="Sitzung abgelaufen – zur Anmeldung"
    >
      <div className="max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 px-6 py-5 text-center pointer-events-none">
        <p className="text-slate-800 font-semibold">Sitzung abgelaufen</p>
        <p className="text-sm text-slate-500 mt-2">Klicken Sie hier, um sich erneut anzumelden.</p>
      </div>
    </button>
  );
}

export function AnimModal({ show, children, className = '' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          {...fade}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm print:hidden"
        >
          <motion.div {...scaleIn} className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200/60 ${className}`}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
