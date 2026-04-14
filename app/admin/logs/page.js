'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, User, Settings, Trash2, Clock, Filter, 
  ChevronLeft, ChevronRight, Search, Download, RefreshCw
} from 'lucide-react';

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

const ACTION_COLORS = {
  USER_LOGIN: 'text-blue-400',
  ADMIN_LOGIN: 'text-blue-400',
  BEWERBUNG_EINGEREICHT: 'text-green-400',
  BEWERBUNG_STATUS_GEÄNDERT: 'text-yellow-400',
  BEWERBUNG_GELÖSCHT: 'text-red-400',
  ADMIN_ACCOUNT_GELÖSCHT: 'text-red-400',
  ADMIN_ACCOUNT_DEAKTIVIERT: 'text-orange-400',
  PASSWORT_GEÄNDERT: 'text-purple-400',
};

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
    const interval = setInterval(fetchLogs, 10000); // Auto-refresh alle 10s
    return () => clearInterval(interval);
  }, [page, filters]);

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
    <div className="min-h-screen bg-[#080808] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="mb-4 text-white/60 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Aktivitäts-Logs</h1>
              <p className="text-white/40 text-sm">Alle System-Aktivitäten • {total} Einträge gesamt</p>
            </div>
            <Button
              onClick={fetchLogs}
              variant="outline"
              className="rounded-xl border-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-white/40" />
            <h3 className="text-white/80 font-semibold">Filter</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-2 block">Aktion</label>
              <select
                value={filters.actionType}
                onChange={(e) => { setFilters({ ...filters, actionType: e.target.value }); setPage(1); }}
                className="w-full bg-white/[0.03] border-white/[0.06] text-white rounded-xl p-2.5 text-sm"
              >
                <option value="">Alle Aktionen</option>
                {Object.keys(ACTION_LABELS).map(key => (
                  <option key={key} value={key}>{ACTION_LABELS[key]}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-white/40 text-xs mb-2 block">User ID</label>
              <Input
                value={filters.userId}
                onChange={(e) => { setFilters({ ...filters, userId: e.target.value }); setPage(1); }}
                placeholder="Discord ID suchen..."
                className="bg-white/[0.03] border-white/[0.06] text-white rounded-xl"
              />
            </div>
            
            <div>
              <label className="text-white/40 text-xs mb-2 block">Von Datum</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
                className="bg-white/[0.03] border-white/[0.06] text-white rounded-xl"
              />
            </div>
            
            <div>
              <label className="text-white/40 text-xs mb-2 block">Bis Datum</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
                className="bg-white/[0.03] border-white/[0.06] text-white rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Logs Tabelle */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Zeit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Aktion</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Ziel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-white/40">
                      Lade Logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-white/40">
                      Keine Logs gefunden
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${ACTION_COLORS[log.action_type] || 'text-white/80'}`}>
                          {ACTION_LABELS[log.action_type] || log.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {log.username || 'Unbekannt'}
                        <br />
                        <span className="text-xs text-white/30">{log.user_id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {log.target_username ? (
                          <>
                            {log.target_username}
                            <br />
                            <span className="text-xs text-white/30">{log.target_user_id}</span>
                          </>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-xs hover:text-white/60">Anzeigen</summary>
                            <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
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
            <div className="px-4 py-4 border-t border-white/[0.06] flex items-center justify-between">
              <div className="text-sm text-white/40">
                Seite {page} von {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <p className="text-blue-300/70 text-sm">
            <Clock className="w-4 h-4 inline mr-2" />
            Logs werden automatisch nach 60 Tagen gelöscht.
          </p>
        </div>
      </div>
    </div>
  );
}
