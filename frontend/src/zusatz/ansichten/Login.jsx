import React, { useState } from 'react';
import { Eye, EyeOff, FileText, LogIn } from 'lucide-react';
import { DekoHintergrund } from '../extraDesign.jsx';

export function Login({ onLogin, error, loading }) {
  const [benutzername, setBenutzername] = useState('');
  const [passwort, setPasswort] = useState('');
  const [passwortSichtbar, setPasswortSichtbar] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(benutzername.trim(), passwort);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
      <DekoHintergrund />
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-violet-500/20">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Protokoll-Manager</h1>
            <p className="text-sm text-slate-500">Bitte anmelden</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="login-user">Benutzername</label>
            <input
              id="login-user"
              type="text"
              autoComplete="username"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              value={benutzername}
              onChange={(e) => setBenutzername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="login-pass">Passwort</label>
            <div className="relative">
              <input
                id="login-pass"
                type={passwortSichtbar ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setPasswortSichtbar((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50"
                aria-label={passwortSichtbar ? 'Passwort verbergen' : 'Passwort anzeigen'}
                disabled={loading}
              >
                {passwortSichtbar ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !benutzername.trim() || !passwort}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md shadow-violet-500/25"
          >
            <LogIn size={18} />
            {loading ? 'Anmeldung…' : 'Anmelden'}
          </button>
        </form>
        <div className="mt-6 text-xs text-slate-400 text-center leading-relaxed space-y-1">
          <p>
            Passwort für alle Demo-Konten:{' '}
            <span className="font-mono text-slate-500">Demo2026!</span>
          </p>
          <p className="font-mono text-slate-500 text-[11px] leading-5">
            user · mitarbeiter · admin · developer · master
          </p>
        </div>
      </div>
    </div>
  );
}
