'use client';

import { useState, useEffect } from 'react';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { AdminTable, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableHead, AdminTableCell } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, RefreshCw, Search, Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { useRouter } from 'next/navigation';

export default function LogsPage() {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/admin');
    }
  }, [admin, loading, router]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchLogs();
  }, [admin]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }
    const filtered = logs.filter(log => 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System Logs</h1>
          <p className="text-white/60 text-sm mt-1">{filteredLogs.length} Einträge</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchLogs}
          disabled={isLoading}
          className="gap-2 rounded-xl border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      <AdminCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Logs durchsuchen..."
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
          />
        </div>
      </AdminCard>

      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead>Zeitpunkt</AdminTableHead>
            <AdminTableHead>Benutzer</AdminTableHead>
            <AdminTableHead>Aktion</AdminTableHead>
            <AdminTableHead>Details</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {filteredLogs.map((log, i) => (
            <AdminTableRow key={i}>
              <AdminTableCell>
                <div className="text-white/60 text-xs">
                  {new Date(log.timestamp).toLocaleString('de-DE')}
                </div>
              </AdminTableCell>
              <AdminTableCell>
                <div className="font-medium">{log.user || 'System'}</div>
              </AdminTableCell>
              <AdminTableCell>
                <div className="text-white/80">{log.action}</div>
              </AdminTableCell>
              <AdminTableCell>
                <div className="text-white/60 text-sm">{log.details || '-'}</div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
          {filteredLogs.length === 0 && (
            <AdminTableRow>
              <AdminTableCell colSpan={4}>
                <div className="text-center py-8 text-white/40">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Keine Logs gefunden</p>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          )}
        </AdminTableBody>
      </AdminTable>
    </div>
  );
}
