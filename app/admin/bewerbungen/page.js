'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, RefreshCw, ArrowLeft, User, AlertTriangle,
  Clock, CheckCircle2, XCircle, Filter, Search, Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusColor(status) {
  switch (status) {
    case 'Eingereicht': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'In Bearbeitung': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Angenommen': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Abgelehnt': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Zurückgezogen': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

function StatusIcon({ status }) {
  switch (status) {
    case 'Eingereicht': return <Clock className="w-3.5 h-3.5" />;
    case 'In Bearbeitung': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'Angenommen': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Abgelehnt': return <XCircle className="w-3.5 h-3.5" />;
    case 'Zurückgezogen': return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-1.5">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white/80 text-sm whitespace-pre-wrap">{value || '-'}</span>
    </div>
  );
}

export default function AdminBewerbungenPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!data.admin) {
          router.push('/admin');
          return;
        }
        setAdmin(data.admin);
        await fetchBewerbungen();
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();

    // Auto-Refresh alle 10 Sekunden
    const interval = setInterval(() => {
      fetchBewerbungen();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchBewerbungen = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bewerbungen');
      const data = await res.json();
      setBewerbungen(data.bewerbungen || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, status) => {
    try {
      const body = action ? { action } : { status };
      const res = await fetch(`/api/admin/bewerbungen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        await fetchBewerbungen();
        if (selected?.id === id) setSelected(data.bewerbung);
      } else {
        alert(data.error || 'Fehler');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (selected) {
    const fd = selected.formData || {};
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setSelected(null)} 
          className="text-white/50 hover:text-white gap-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Button>

        <GlassCard className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Bewerbung #{selected.id.substring(0, 8)}</h2>
              <p className="text-sm text-white/35 mt-1">Eingereicht am {formatDateTime(selected.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(selected.status)}`}>
              <StatusIcon status={selected.status} />
              {selected.status}
            </span>
          </div>

          {selected.claimedByName && (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Wird bearbeitet von: {selected.claimedByName}
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#5865F2]/[0.08] border border-[#5865F2]/20">
            <h4 className="text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wider">Discord-Daten</h4>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <div><span className="text-white/40">Name:</span> <span className="text-white/80">{selected.username}</span></div>
              <div><span className="text-white/40">E-Mail:</span> <span className="text-white/80">{selected.email || '-'}</span></div>
              <div><span className="text-white/40">Seit:</span> <span className="text-white/80">{selected.discordCreatedAt ? formatDate(selected.discordCreatedAt) : '-'}</span></div>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Bewerbungsdaten</h4>
            <DetailRow label="Vorname" value={fd.vorname} />
            <DetailRow label="Alter" value={fd.alter} />
            <DetailRow label="Roblox-Name" value={fd.robloxName} />
            <DetailRow label="Spielzeit" value={fd.spielzeit} />
            <DetailRow label="Fraktion" value={fd.fraktion} />
            <DetailRow label="Anderer Server" value={fd.andererServer} />
            <DetailRow label="Bann/Warn" value={fd.bannWarn} />
            <DetailRow label="Warum Team?" value={fd.warumTeam} />
            <DetailRow label="Geduldig?" value={fd.geduldig} />
            <DetailRow label="Stunden/Woche" value={fd.stundenProWoche} />
            <DetailRow label="Fail-RP Lösung" value={fd.failRpLoesung} />
            <DetailRow label="Streit-Lösung" value={fd.streitLoesung} />
            <DetailRow label="Mikro" value={fd.hatMikro ? 'Ja' : 'Nein'} />
            <DetailRow label="Kennt Regeln" value={fd.kenntRegeln ? 'Ja' : 'Nein'} />
            <DetailRow label="Bleibt nett" value={fd.bleibtNett ? 'Ja' : 'Nein'} />
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="flex flex-wrap gap-3">
            {!selected.claimedBy && selected.status === 'Eingereicht' && (
              <Button onClick={() => handleAction(selected.id, 'claim')} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                Übernehmen
              </Button>
            )}
            {selected.claimedBy === admin?.discordUserId && (
              <>
                <Button onClick={() => handleAction(selected.id, 'unclaim')} variant="outline" className="rounded-xl border-white/10">
                  Freigeben
                </Button>
                <Button onClick={() => handleAction(selected.id, null, 'Angenommen')} className="bg-green-600 hover:bg-green-700 rounded-xl">
                  Annehmen
                </Button>
                <Button onClick={() => handleAction(selected.id, null, 'Abgelehnt')} className="bg-red-600 hover:bg-red-700 rounded-xl">
                  Ablehnen
                </Button>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  const filtered = bewerbungen.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.username.toLowerCase().includes(search.toLowerCase()) && !b.id.includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bewerbungen</h1>
          <p className="text-white/40 text-sm mt-1">{bewerbungen.length} Bewerbungen insgesamt</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchBewerbungen} 
          className="gap-2 rounded-xl border-white/10"
        >
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['all', 'Eingereicht', 'In Bearbeitung', 'Angenommen', 'Abgelehnt'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="rounded-xl"
              size="sm"
            >
              {f === 'all' ? 'Alle' : f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Filter className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Keine Bewerbungen gefunden</p>
          </GlassCard>
        ) : (
          filtered.map(b => (
            <GlassCard key={b.id} hover className="p-5" onClick={() => setSelected(b)}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">#{b.id.substring(0, 8)}</span>
                    <span className="text-white/60">{b.username}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}>
                      <StatusIcon status={b.status} />
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/30">{formatDateTime(b.createdAt)}</p>
                  {b.claimedByName && (
                    <p className="text-xs text-yellow-300 mt-1">Bearbeitet von: {b.claimedByName}</p>
                  )}
                </div>
                <Eye className="w-5 h-5 text-white/30" />
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
