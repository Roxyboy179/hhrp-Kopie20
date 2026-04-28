'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminAuthContext = createContext({
  admin: null,
  loading: true,
  setAdmin: () => {},
  refreshAdmin: () => {},
  logout: () => {},
});

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      const data = await res.json();
      if (data.admin) {
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
      return data;
    } catch (error) {
      console.error('[AdminAuth] Refresh error:', error);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('[AdminAuth] Logout error:', e);
    }
    setAdmin(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshAdmin();
      setLoading(false);
    };
    init();

    // Egress-optimiert: alle 60s statt 15s, visibility-aware
    let interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      refreshAdmin();
    }, 60000);
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshAdmin();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }
    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [refreshAdmin]);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, setAdmin, refreshAdmin, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
