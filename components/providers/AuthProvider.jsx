'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext({ user: null, loading: true, refreshUser: () => {}, authError: null });

const ERROR_MESSAGES = {
  'no_code': 'Discord-Anmeldung fehlgeschlagen: Kein Autorisierungscode erhalten.',
  'token_failed': 'Discord-Anmeldung fehlgeschlagen: Token-Austausch gescheitert.',
  'user_failed': 'Discord-Anmeldung fehlgeschlagen: Benutzerdaten konnten nicht geladen werden.',
  'not_member': 'Du bist kein Mitglied des Hamburg Horizon RP Discord-Servers. Bitte tritt zuerst dem Server bei!',
  'auth_failed': 'Discord-Anmeldung fehlgeschlagen: Ein unerwarteter Fehler ist aufgetreten.',
  'discord_denied': 'Discord-Anmeldung abgebrochen: Du hast die Autorisierung abgelehnt.',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user);
      if (data.user) {
        setAuthError(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check URL parameters for auth status
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const auth = params.get('auth');

      if (error) {
        setAuthError(ERROR_MESSAGES[error] || `Anmeldung fehlgeschlagen: ${error}`);
        // Clean URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.pathname);
      }

      if (auth === 'success') {
        // Clean URL params  
        const url = new URL(window.location.href);
        url.searchParams.delete('auth');
        window.history.replaceState({}, '', url.pathname);
      }
    }

    refreshUser();
  }, [refreshUser]);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, authError, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
