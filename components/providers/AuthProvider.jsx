'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const AuthContext = createContext({ user: null, loading: true, refreshUser: () => {} });

const ERROR_MESSAGES = {
  'no_code': 'Discord-Anmeldung fehlgeschlagen: Kein Autorisierungscode erhalten.',
  'token_failed': 'Discord-Anmeldung fehlgeschlagen: Token-Austausch gescheitert.',
  'user_failed': 'Discord-Anmeldung fehlgeschlagen: Benutzerdaten konnten nicht geladen werden.',
  'not_member': 'Du bist kein Mitglied des Hamburg Horizon RP Discord-Servers. Bitte tritt zuerst dem Server bei!',
  'auth_failed': 'Discord-Anmeldung fehlgeschlagen: Ein unerwarteter Fehler ist aufgetreten.',
  'discord_denied': 'Discord-Anmeldung abgebrochen: Du hast die Autorisierung abgelehnt.',
};

// Egress-Optimierung: Polling-Intervall stark erhöht (war 5s).
// 60 Sekunden + visibility-aware = ~92% weniger Calls bei normalen Tab-Wechseln.
const POLL_INTERVAL_MS = 60_000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const etagRef = useRef(null); // ETag für If-None-Match -> 304 ohne Body
  const lastFetchAtRef = useRef(0);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'Accept': 'application/json' };
      if (etagRef.current) headers['If-None-Match'] = etagRef.current;
      const res = await fetch('/api/auth/me', { credentials: 'include', headers });
      // 304 Not Modified -> User-State bleibt, kein neues Parsen, 0 Bytes Body
      if (res.status === 304) {
        lastFetchAtRef.current = Date.now();
        return;
      }
      const newEtag = res.headers.get('ETag');
      if (newEtag) etagRef.current = newEtag;
      const data = await res.json();
      setUser(data.user);
      lastFetchAtRef.current = Date.now();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stiller Refresh ohne Loading-State (für Discord-Rollen / Lizenzen)
  const silentRefreshUser = useCallback(async () => {
    try {
      const headers = { 'Accept': 'application/json' };
      if (etagRef.current) headers['If-None-Match'] = etagRef.current;
      const res = await fetch('/api/auth/me', { credentials: 'include', headers });
      if (res.status === 304) {
        lastFetchAtRef.current = Date.now();
        return; // Keine Änderungen -> kein State-Update, kein Bytes-Verbrauch
      }
      const newEtag = res.headers.get('ETag');
      if (newEtag) etagRef.current = newEtag;
      const data = await res.json();
      if (data.user) setUser(data.user);
      lastFetchAtRef.current = Date.now();
    } catch (error) {
      // still ignorieren
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const auth = params.get('auth');

      if (error) {
        setTimeout(() => {
          toast.error('Anmeldung fehlgeschlagen', {
            description: ERROR_MESSAGES[error] || `Fehler: ${error}`,
            duration: 8000,
          });
        }, 500);
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.pathname);
      }

      if (auth === 'success') {
        setTimeout(() => {
          toast.success('Erfolgreich angemeldet', {
            description: 'Willkommen bei Hamburg Horizon RP!',
            duration: 4000,
          });
        }, 500);
        const url = new URL(window.location.href);
        url.searchParams.delete('auth');
        window.history.replaceState({}, '', url.pathname);
      }
    }

    refreshUser();

    // Visibility-aware Polling: pausiert wenn der Tab im Hintergrund ist
    let interval = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        silentRefreshUser();
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Wenn länger als ein Intervall im Hintergrund -> sofort einmal aktualisieren
        if (Date.now() - lastFetchAtRef.current > POLL_INTERVAL_MS) {
          silentRefreshUser();
        }
        start();
      } else {
        stop();
      }
    };

    start();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [refreshUser, silentRefreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
