'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton';
import { 
  User, FileText, CheckCircle2, XCircle, Clock, 
  Calendar, Shield, ArrowRight, Loader2, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function timeAgo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StatusBadge({ status }) {
  const map = {
    'Eingereicht': { bg: 'rgba(var(--theme-accent-rgb), 0.08)', color: 'rgba(var(--theme-accent-rgb), 0.6)', icon: <Clock className="w-3 h-3" /> },
    'In Bearbeitung': { bg: 'rgba(234,179,8,0.1)', color: '#eab308', icon: <Clock className="w-3 h-3" /> },
    'Angenommen': { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', icon: <CheckCircle2 className="w-3 h-3" /> },
    'Abgelehnt': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: <XCircle className="w-3 h-3" /> },
    'Zurückgezogen': { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] || map['Eingereicht'];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.icon} {status}
    </span>
  );
}

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bewerbungen, setBewerbungen] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchBewerbungen();
  }, [user]);

  const fetchBewerbungen = async () => {
    try {
      const res = await fetch('/api/meine-bewerbungen', { credentials: 'include' });
      const data = await res.json();
      setBewerbungen(data.bewerbungen || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
      </div>
    );
  }

  const stats = {
    total: bewerbungen.length,
    angenommen: bewerbungen.filter(b => b.status === 'Angenommen').length,
    abgelehnt: bewerbungen.filter(b => b.status === 'Abgelehnt').length,
    offen: bewerbungen.filter(b => ['Eingereicht', 'In Bearbeitung'].includes(b.status)).length,
  };

  const avatarUrl = user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : null;

  return (
    <div className="min-h-screen px-6 py-24 page-transition-enter">
      <div className="max-w-4xl mx-auto">

        {/* Profile Header */}
        <GlassCard className="p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-24 h-24 md:w-28 md:h-28 rounded-3xl" style={{ boxShadow: '0 0 0 3px rgba(var(--theme-accent-rgb), 0.15)' }} />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(var(--theme-accent-rgb), 0.1)' }}>
                  <User className="w-10 h-10" style={{ color: 'var(--theme-accent)' }} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2" style={{ borderColor: 'rgba(0,0,0,0.8)' }} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{user.globalName || user.username}</h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>@{user.username}</p>
              
              <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 text-xs glass rounded-lg px-3 py-1.5">
                  <Hash className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
                  <span style={{ color: 'rgba(var(--theme-accent-rgb), 0.5)' }}>ID: {user.id}</span>
                </div>
                {user.adminLevel > 0 && (
                  <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ background: 'rgba(var(--theme-accent-rgb), 0.08)', color: 'var(--theme-accent)' }}>
                    <Shield className="w-3 h-3" />
                    Teamler
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action */}
            <Button
              onClick={() => router.push('/bewerbung')}
              className="rounded-xl"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              <FileText className="w-4 h-4 mr-2" /> Neue Bewerbung
            </Button>
          </div>
        </GlassCard>

        {/* Stats */}
        {dataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="glass rounded-2xl p-5"><Skeleton height="2rem" width="3rem" className="mx-auto mb-2" /><Skeleton height="0.75rem" width="60%" className="mx-auto" /></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Gesamt', value: stats.total, icon: <FileText className="w-4 h-4" /> },
              { label: 'Offen', value: stats.offen, icon: <Clock className="w-4 h-4" /> },
              { label: 'Angenommen', value: stats.angenommen, icon: <CheckCircle2 className="w-4 h-4" /> },
              { label: 'Abgelehnt', value: stats.abgelehnt, icon: <XCircle className="w-4 h-4" /> },
            ].map((s, i) => (
              <GlassCard key={i} className="p-5 text-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(var(--theme-accent-rgb), 0.08)', color: 'var(--theme-accent)' }}>{s.icon}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(var(--theme-accent-rgb), 0.35)' }}>{s.label}</div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Bewerbungsverlauf */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Bewerbungsverlauf</h2>
          <span className="text-xs" style={{ color: 'rgba(var(--theme-accent-rgb), 0.3)' }}>{bewerbungen.length} Bewerbung{bewerbungen.length !== 1 ? 'en' : ''}</span>
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-2xl p-5"><Skeleton height="1rem" width="40%" className="mb-2" /><Skeleton height="0.75rem" width="70%" /></div>)}
          </div>
        ) : bewerbungen.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-4" style={{ color: 'rgba(var(--theme-accent-rgb), 0.15)' }} />
            <p className="text-white/60 mb-4">Du hast noch keine Bewerbungen eingereicht.</p>
            <Button onClick={() => router.push('/bewerbung')} className="rounded-xl" style={{ background: 'var(--theme-accent)', color: '#000' }}>
              Jetzt bewerben <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {bewerbungen.map((b, i) => (
              <GlassCard key={b.id || i} className="p-5" hover>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white truncate">{b.bewerbungType || b.bewerbung_type || 'Bewerbung'}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {timeAgo(b.createdAt || b.created_at)}</span>
                      {b.claimedBy && <span>Bearbeiter: {b.claimedBy}</span>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(var(--theme-accent-rgb), 0.2)' }} />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
