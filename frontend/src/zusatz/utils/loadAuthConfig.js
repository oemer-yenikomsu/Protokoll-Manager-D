import * as api from '../../kern/api.js';
import { SESSION_IDLE_MS_DEFAULT } from '../constants/session.js';

/** Liest idleSeconds vom Backend (einheitlich für Timer und Meldungen). */
export async function loadAuthIdleMs() {
  try {
    const cfg = await api.getAuthConfig();
    const sec = Number(cfg?.idleSeconds);
    if (Number.isFinite(sec) && sec > 0) {
      return { idleMs: sec * 1000, idleSeconds: sec, idleMinutes: Math.max(1, Math.ceil(sec / 60)) };
    }
    const mins = Number(cfg?.idleMinutes) || 30;
    return { idleMs: mins * 60 * 1000, idleSeconds: mins * 60, idleMinutes: mins };
  } catch {
    return {
      idleMs: SESSION_IDLE_MS_DEFAULT,
      idleSeconds: 1800,
      idleMinutes: 30,
    };
  }
}
