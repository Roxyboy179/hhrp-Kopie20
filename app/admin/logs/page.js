'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Filter, ChevronLeft, ChevronRight, Clock, RefreshCw, Loader2
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

const ACTION_LABELS = {
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout',
  BEWERBUNG_EINGEREICHT: 'Bewerbung eingereicht',
  BEWERBUNG_ZURÜCKGEZOGEN: 'Bewerbung zurückgezogen',
  BEWERBUNG_STATUS_GEÄNDERT: 'Bewerbungs-Status geändert',
  BEWERBUNG_GELÖSCHT: 'Bewerbung gelöscht',
  BEWERBUNG_SETTINGS_GEÄNDERT: 'Bewerbungs-Einstellungen geändert',
  ADMIN_ACCOUNT_ERSTELLT: 'Admin-Account erstellt',
  ADMIN_ACCOUNT_GELÖSCHT: 'Admin-Account gelöscht',
  ADMIN_ACCOUNT_DEAKTIVIERT: 'Admin-Account deaktiviert',
  ADMIN_ACCOUNT_AKTIVIERT: 'Admin-Account aktiviert',
  PASSWORT_GEÄNDERT: 'Passwort geändert',
  ADMIN_LOGIN: 'Admin Login',
  ADMIN_LOGOUT: 'Admin Logout',
};

// Subtile Bedeutungs-Akzente (monochrom mit Tönung)
const ACTION_COLORS = {
  USER_LOGIN: 'text-blue-300/90',
  ADMIN_LOGIN: 'text-blue-300/90',
  BEWERBUNG_EINGEREICHT: 'text-green-300/90',
  BEWERBUNG_STATUS_GEÄNDERT: 'text-yellow-300/90',
  BEWERBUNG_GELÖSCHT: 'text-red-300/90',
  ADMIN_ACCOUNT_GELÖSCHT: 'text-red-300/90',
  ADMIN_ACCOUNT_DEAKTIVIERT: 'text-orange-300/90',
  PASSWORT_GEÄNDERT: 'text-purple-300/90',
};

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
  border: '1px solid rgba(255,255,255,0.07)',
};
const inputClass = 'bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 focus:border-white/30 rounded-xl h-10';

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    actionType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
    // Egress-optimiert: 30s + visibility-aware
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchLogs();
    }, 30000);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchLogs();
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
  }, [page, filters]);

  // Echtzeit: Logs live aktualisieren sobald ein neuer Log-Eintrag entsteht
  useRealtime({
    'log.created': () => {
      if (page === 1) fetchLogs();
    },
  });

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: new Date(filters.startDate).toISOString() }),
        ...(filters.endDate && { endDate: new Date(filters.endDate).toISOString() }),
      });

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (e) {
      console.error('Fehler beim Laden der Logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/admin')}
            className="mb-4 gap-2 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white/75 hover:text-white text-[12.5px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Button>
          
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Aktivitäts-Logs</h1>
              <p className="text-white/45 text-[13px] mt-1.5">
                Alle System-Aktivitäten · <span className="text-white/70 tabular-nums">{total}</span> Einträge gesamt
              </p>
            </div>
            <Button
              onClick={fetchLogs}
              className="gap-2 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.15] text-white/75 hover:text-white text-[12.5px] font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-5 p-4 md:p-5 rounded-2xl relative overflow-hidden" style={cardStyle}>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
          />
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.08]"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }}
            >
              <Filter className="w-3.5 h-3.5 text-white/70" />
            </div>
            <h3 className="text-white/85 font-semibold text-[13.5px] tracking-tight">Filter</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1.5 block">Aktion</label>
              <select
                value={filters.actionType}
                onChange={(e) => { setFilters({ ...filters, actionType: e.target.value }); setPage(1); }}
                className="w-full bg-white/[0.04] border border-white/[0.1] text-white rounded-xl p-2.5 text-[12.5px] h-10 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 [&>option]:bg-slate-900 [&>option]:text-white"
              >
                <option value="">Alle Aktionen</option>
                {Object.keys(ACTION_LABELS).map(key => (
                  <option key={key} value={key}>{ACTION_LABELS[key]}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1.5 block">User ID</label>
              <Input
                value={filters.userId}
                onChange={(e) => { setFilters({ ...filters, userId: e.target.value }); setPage(1); }}
                placeholder="Discord ID suchen..."
                className={inputClass}
              />
            </div>
            
            <div>
              <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1.5 block">Von Datum</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
                className={inputClass}
              />
            </div>
            
            <div>
              <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1.5 block">Bis Datum</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Logs Tabelle */}
        <div className="rounded-2xl overflow-hidden relative" style={cardStyle}>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-white/55 uppercase tracking-wider">Zeit</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-white/55 uppercase tracking-wider">Aktion</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-white/55 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-white/55 uppercase tracking-wider">Ziel</th>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-white/55 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white/40 mx-auto" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-white/35 text-[13px]">
                      Keine Logs gefunden
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 text-[11.5px] text-white/55 whitespace-nowrap font-mono">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[12.5px] font-medium ${ACTION_COLORS[log.action_type] || 'text-white/80'}`}>
                          {ACTION_LABELS[log.action_type] || log.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-white/85">
                        {log.username || 'Unbekannt'}
                        <br />
                        <span className="text-[10.5px] text-white/30 font-mono">{log.user_id}</span>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-white/60">
                        {log.target_username ? (
                          <>
                            {log.target_username}
                            <br />
                            <span className="text-[10.5px] text-white/30 font-mono">{log.target_user_id}</span>
                          </>
                        ) : (
                          <span className="text-white/25">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/40">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-[11.5px] hover:text-white/70 transition-colors">Anzeigen</summary>
                            <pre
                              className="mt-2 text-[10.5px] p-2.5 rounded-lg overflow-x-auto max-w-md"
                              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}
                            >
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[12px] text-white/45">
                Seite <span className="text-white/75 tabular-nums">{page}</span> von <span className="text-white/75 tabular-nums">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div
          className="mt-5 p-3.5 rounded-xl text-[12px] flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
        >
          <Clock className="w-3.5 h-3.5 text-white/45" />
          Logs werden automatisch nach 60 Tagen gelöscht.
        </div>
      </div>
    </div>
  );
}
