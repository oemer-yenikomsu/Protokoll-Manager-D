import React, { useState } from 'react';
import { FileText, LogIn } from 'lucide-react';
import { DekoHintergrund } from '../extraDesign.jsx';

export function Login({ onLogin, error, loading }) {
  const [benutzername, setBenutzername] = useState('');
  const [passwort, setPasswort] = useState('');

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
            <input
              id="login-pass"
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              disabled={loading}
            />
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
        <p className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
          Demo: Benutzer <span className="font-mono text-slate-500">demo</span>, Passwort{' '}
          <span className="font-mono text-slate-500">Demo2026!</span>
        </p>
      </div>
    </div>
  );
}
