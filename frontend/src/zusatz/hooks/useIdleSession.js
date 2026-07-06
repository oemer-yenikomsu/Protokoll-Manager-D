import { useEffect, useRef } from 'react';

/**
 * Inaktivität: Vergleicht jede Sekunde mit sessionDeadline (Unix-Sekunden).
 * deadline wird bei Nutzeraktion verlängert und beim Login vom Server gesetzt.
 */
export function useIdleSession({
  active,
  idleSeconds,
  sessionDeadline,
  onBumpDeadline,
  onIdleExpire,
}) {
  const deadlineRef = useRef(sessionDeadline);
  const activeRef = useRef(active);
  const onExpireRef = useRef(onIdleExpire);
  const onBumpRef = useRef(onBumpDeadline);

  useEffect(() => {
    deadlineRef.current = sessionDeadline;
  }, [sessionDeadline]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onExpireRef.current = onIdleExpire;
  }, [onIdleExpire]);

  useEffect(() => {
    onBumpRef.current = onBumpDeadline;
  }, [onBumpDeadline]);

  useEffect(() => {
    if (!active || idleSeconds <= 0) return undefined;

    const bump = () => onBumpRef.current?.();

    const activityEvents = ['pointerdown', 'keydown', 'touchstart'];
    activityEvents.forEach((ev) =>
      document.addEventListener(ev, bump, { capture: true, passive: true })
    );

    const tick = window.setInterval(() => {
      if (!activeRef.current) return;
      const now = Math.floor(Date.now() / 1000);
      if (deadlineRef.current > 0 && now >= deadlineRef.current) {
        onExpireRef.current?.();
      }
    }, 1000);

    return () => {
      window.clearInterval(tick);
      activityEvents.forEach((ev) =>
        document.removeEventListener(ev, bump, { capture: true })
      );
    };
  }, [active, idleSeconds]);
}
