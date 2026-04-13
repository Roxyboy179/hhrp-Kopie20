'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, FileText, RefreshCw, ChevronRight, ArrowLeft, 
  AlertTriangle, User, Clock, CheckCircle2, XCircle 
} from 'lucide-react';

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
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

export default function MeineBewerbungenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchBewerbungen = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bewerbungen');
      const data = await res.json();
      setBewerbungen(data.bewerbungen || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBewerbungen();
    }
  }, [user]);

  const handleWithdraw = async (id) => {
    if (!confirm('Möchtest du diese Bewerbung wirklich zurückziehen?')) return;
    try {
      const res = await fetch(`/api/bewerbungen/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBewerbungen();
        if (selected?.id === id) setSelected(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Anmeldung erforderlich</h2>
          <p className="text-white/40 mb-6">Du musst angemeldet sein, um deine Bewerbungen zu sehen.</p>
          <Button onClick={() => window.location.href = '/api/auth/discord'} className="bg-[#5865F2] hover:bg-[#4752C4] rounded-xl">
            Mit Discord anmelden
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (selected) {
    const fd = selected.formData || {};
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          <Button variant="ghost" onClick={() => setSelected(null)} className="text-white/50 hover:text-white mb-4 gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
          <GlassCard className="p-6 md:p-10 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold">Bewerbung #{selected.id.substring(0, 8)}</h2>
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

            <Separator className="bg-white/[0.06]" />

            <div className="space-y-1">
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

            {(selected.status === 'Eingereicht' || selected.status === 'In Bearbeitung') && (
              <>
                <Separator className="bg-white/[0.06]" />
                <div className="flex justify-end">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleWithdraw(selected.id)} 
                    className="gap-2 rounded-xl"
                  >
                    <AlertTriangle className="w-4 h-4" /> Zurückziehen
                  </Button>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Meine Bewerbungen</h2>
          <Button 
            variant="ghost" 
            onClick={fetchBewerbungen} 
            className="text-white/40 hover:text-white gap-2 rounded-xl" 
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {bewerbungen.length === 0 ? (
          <GlassCard className="p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white/15" />
            </div>
            <p className="text-white/40 mb-2">Keine Bewerbungen vorhanden</p>
            <p className="text-white/20 text-sm">Schreibe deine erste Bewerbung, um Teil des Teams zu werden.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {bewerbungen.map(b => (
              <GlassCard key={b.id} hover className="p-5" onClick={() => setSelected(b)}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">#{b.id.substring(0, 8)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}>
                        <StatusIcon status={b.status} />
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/30">{formatDateTime(b.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(b.status === 'Eingereicht' || b.status === 'In Bearbeitung') && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleWithdraw(b.id); }} 
                        className="text-red-400/70 hover:text-red-300 hover:bg-red-500/10 text-xs rounded-lg h-7"
                      >
                        Zurückziehen
                      </Button>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
