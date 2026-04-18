'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminTable, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableHead, AdminTableCell } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { FileText, Clock, CheckCircle2, XCircle, Loader2, Eye, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_COLORS = {
  'Eingereicht': 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  'In Bearbeitung': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
  'Angenommen': 'bg-green-500/10 border-green-500/20 text-green-300',
  'Abgelehnt': 'bg-red-500/10 border-red-500/20 text-red-300'
};

export default function BewerbungenPage() {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const [bewerbungen, setBewerbungen] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBewerbungen = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/bewerbungen');
      const data = await res.json();
      setBewerbungen(data.bewerbungen || []);
      setFiltered(data.bewerbungen || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !admin) router.push('/admin');
    if (admin) fetchBewerbungen();
  }, [admin, loading]);

  useEffect(() => {
    let result = bewerbungen;
    
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    
    if (searchTerm) {
      result = result.filter(b => 
        b.characterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.discordUsername?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFiltered(result);
  }, [searchTerm, statusFilter, bewerbungen]);

  const stats = {
    total: bewerbungen.length,
    eingereicht: bewerbungen.filter(b => b.status === 'Eingereicht').length,
    inBearbeitung: bewerbungen.filter(b => b.status === 'In Bearbeitung').length,
    angenommen: bewerbungen.filter(b => b.status === 'Angenommen').length,
    abgelehnt: bewerbungen.filter(b => b.status === 'Abgelehnt').length
  };

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
          <h1 className="text-3xl font-bold text-white">Bewerbungen</h1>
          <p className="text-white/60 text-sm mt-1">{filtered.length} von {bewerbungen.length} Bewerbungen</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchBewerbungen}
          disabled={isLoading}
          className="gap-2 rounded-xl border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard icon={FileText} label="Gesamt" value={stats.total} color="blue" />
        <AdminStatCard icon={Clock} label="Eingereicht" value={stats.eingereicht} color="blue" />
        <AdminStatCard icon={Clock} label="In Bearbeitung" value={stats.inBearbeitung} color="yellow" />
        <AdminStatCard icon={CheckCircle2} label="Angenommen" value={stats.angenommen} color="green" />
        <AdminStatCard icon={XCircle} label="Abgelehnt" value={stats.abgelehnt} color="red" />
      </div>

      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminCard className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nach Name oder Discord suchen..."
              className="pl-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
            />
          </div>
        </AdminCard>
        
        <AdminCard className="p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="Eingereicht">Eingereicht</SelectItem>
              <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="Angenommen">Angenommen</SelectItem>
              <SelectItem value="Abgelehnt">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>
        </AdminCard>
      </div>

      {/* Table */}
      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead>Charakter</AdminTableHead>
            <AdminTableHead>Discord</AdminTableHead>
            <AdminTableHead>Status</AdminTableHead>
            <AdminTableHead>Eingereicht</AdminTableHead>
            <AdminTableHead>Aktionen</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {filtered.map((bewerbung) => (
            <AdminTableRow key={bewerbung.id}>
              <AdminTableCell>
                <div className="font-medium">{bewerbung.characterName}</div>
                <div className="text-xs text-white/60">{bewerbung.characterAge} Jahre</div>
              </AdminTableCell>
              <AdminTableCell>
                <div className="text-white/80">{bewerbung.discordUsername}</div>
              </AdminTableCell>
              <AdminTableCell>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[bewerbung.status]}`}>
                  {bewerbung.status}
                </span>
              </AdminTableCell>
              <AdminTableCell>
                <div className="text-white/60 text-xs">
                  {new Date(bewerbung.createdAt).toLocaleDateString('de-DE')}
                </div>
              </AdminTableCell>
              <AdminTableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/admin/bewerbungen/${bewerbung.id}`)}
                  className="gap-2 rounded-xl border-white/10"
                >
                  <Eye className="w-3 h-3" />
                  Ansehen
                </Button>
              </AdminTableCell>
            </AdminTableRow>
          ))}
          {filtered.length === 0 && (
            <AdminTableRow>
              <AdminTableCell colSpan={5}>
                <div className="text-center py-12 text-white/40">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p className="text-lg mb-1">Keine Bewerbungen gefunden</p>
                  <p className="text-sm">Ändere die Filter oder warte auf neue Bewerbungen</p>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          )}
        </AdminTableBody>
      </AdminTable>
    </div>
  );
}
