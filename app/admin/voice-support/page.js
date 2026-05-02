'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Headphones, Mic, PhoneOff, Loader2, Volume2, Save, RefreshCw, Clock, User, Users, Sparkles } from 'lucide-react';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const HEARTBEAT_MS = 10_000;

export default function AdminVoiceSupportPage() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const heartbeatRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/voice-support/list', { cache: 'no-store' });
      if (!res.ok) {
        setSessions([]);
        return;
      }
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error('[admin-voice] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) fetchSessions();
  }, [admin, fetchSessions]);

  // Realtime
  useEffect(() => {
    if (!admin) return;
    const client = getSupabaseBrowser();
    if (!client) return;

    const channel = client
      .channel('vs_admin_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_support_sessions' },
        () => fetchSessions()
      )
      .subscribe();

    return () => { try { client.removeChannel(channel); } catch {} };
  }, [admin, fetchSessions]);

  // Polling-Fallback alle 15s
  useEffect(() => {
    if (!admin) return;
    const id = setInterval(() => fetchSessions(), 15_000);
    return () => clearInterval(id);
  }, [admin, fetchSessions]);

  // Heartbeat senden für aktive Session
  useEffect(() => {
    const activeSession = sessions.find((s) => s.id === activeSessionId && s.supporter_id === admin?.discordUserId);
    if (!activeSession) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    const send = async () => {
      try {
        await fetch('/api/voice-support/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSession.id, role: 'supporter' }),
        });
      } catch {}
    };
    send();
    heartbeatRef.current = setInterval(send, HEARTBEAT_MS);
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [activeSessionId, sessions, admin]);

  // Beim Verlassen Session beenden
  useEffect(() => {
    const handleUnload = () => {
      if (!activeSessionId) return;
      const activeSession = sessions.find((s) => s.id === activeSessionId);
      if (!activeSession || activeSession.supporter_id !== admin?.discordUserId) return;
      try {
        const blob = new Blob([JSON.stringify({ sessionId: activeSession.id })], { type: 'application/json' });
        navigator.sendBeacon('/api/voice-support/end', blob);
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [activeSessionId, sessions, admin]);

  const claim = async (sessionId) => {
    try {
      const res = await fetch(`/api/voice-support/claim/${sessionId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Fehler beim Übernehmen');
        return;
      }
      setActiveSessionId(sessionId);
      setNotesDraft(data.session?.notes || '');
      toast.success('Session übernommen 🎧');
      fetchSessions();
    } catch {
      toast.error('Server-Fehler');
    }
  };

  const endSession = async (sessionId) => {
    try {
      await fetch(`/api/voice-support/admin-end/${sessionId}`, { method: 'POST' });
      toast.success('Session beendet & gelöscht');
      if (activeSessionId === sessionId) setActiveSessionId(null);
      fetchSessions();
    } catch {
      toast.error('Fehler beim Beenden');
    }
  };

  const saveNotes = async (sessionId) => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/voice-support/update/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (!res.ok) {
        toast.error('Speichern fehlgeschlagen');
        return;
      }
      toast.success('Notizen gespeichert');
      fetchSessions();
    } catch {
      toast.error('Server-Fehler');
    } finally {
      setSavingNotes(false);
    }
  };

  const formatDuration = (created) => {
    const sec = Math.floor((Date.now() - new Date(created).getTime()) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (authLoading || !admin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  const waitingSessions = sessions.filter((s) => s.status === 'waiting');
  const activeSessions = sessions.filter((s) => s.status === 'active');
  const mySession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-2">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Admin · Voice Support</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Voice Support Verwaltung</h1>
            <p className="text-sm text-white/50 mt-1">
              Übernimm wartende Sessions, betreue Nutzer und beende Sessions wenn nötig.
            </p>
          </div>
          <Button
            onClick={fetchSessions}
            variant="outline"
            className="rounded-xl border-white/10 hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <StatCard icon={<Headphones className="w-4 h-4 text-amber-400" />} label="Wartend" value={waitingSessions.length} accent="amber" />
          <StatCard icon={<Mic className="w-4 h-4 text-emerald-400" />} label="Aktiv" value={activeSessions.length} accent="emerald" />
          <StatCard icon={<Users className="w-4 h-4 text-blue-400" />} label="Gesamt" value={sessions.length} accent="blue" />
        </div>
      </div>

      {/* Aktive Session (eigene) */}
      {mySession && mySession.supporter_id === admin.discordUserId && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">🎧 Deine aktive Session</h2>
          <ActiveSessionPanel
            session={mySession}
            notesDraft={notesDraft}
            setNotesDraft={setNotesDraft}
            onSaveNotes={() => saveNotes(mySession.id)}
            onEnd={() => endSession(mySession.id)}
            savingNotes={savingNotes}
            formatDuration={formatDuration}
          />
        </div>
      )}

      {/* Wartende Sessions */}
      {waitingSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">⏳ Wartende Anfragen</h2>
          <div className="space-y-3">
            {waitingSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onClaim={() => claim(s.id)}
                onEnd={() => endSession(s.id)}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        </div>
      )}

      {/* Andere aktive Sessions */}
      {activeSessions.filter((s) => s.id !== activeSessionId).length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">🟢 Weitere aktive Sessions</h2>
          <div className="space-y-3">
            {activeSessions
              .filter((s) => s.id !== activeSessionId)
              .map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  active
                  onEnd={() => endSession(s.id)}
                  formatDuration={formatDuration}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && !loading && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Headphones className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Keine offenen Sessions</h3>
          <p className="text-sm text-white/40 mt-1">Sobald jemand Voice Support anfragt, erscheint die Session hier.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent = 'blue' }) {
  const accents = {
    amber: 'border-amber-500/20 from-amber-500/5',
    emerald: 'border-emerald-500/20 from-emerald-500/5',
    blue: 'border-blue-500/20 from-blue-500/5',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-transparent p-4 ${accents[accent]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

function SessionCard({ session, active = false, onClaim, onEnd, formatDuration }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm p-5 ${
      active
        ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-zinc-950/60'
        : 'border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-zinc-950/60'
    }`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {session.user_avatar ? (
          <img src={session.user_avatar} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-bold flex-shrink-0">
            {(session.user_name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{session.user_name || 'Unbekannt'}</span>
            <span className="text-[11px] text-white/30 font-mono">{session.user_id}</span>
            {active && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold uppercase tracking-wider">
                Aktiv
              </span>
            )}
          </div>
          {active && session.supporter_name && (
            <div className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Supporter: <span className="text-white/80 font-medium">{session.supporter_name}</span>
            </div>
          )}
          {session.reason && (
            <p className="text-sm text-white/65 mt-2 line-clamp-2">{session.reason}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(session.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {!active && (
            <Button
              onClick={onClaim}
              className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold"
            >
              <Headphones className="w-4 h-4 mr-2" />
              Übernehmen
            </Button>
          )}
          <Button
            onClick={onEnd}
            variant="outline"
            className="rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Beenden
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActiveSessionPanel({ session, notesDraft, setNotesDraft, onSaveNotes, onEnd, savingNotes, formatDuration }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-zinc-950/60 to-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8 space-y-6">
        {/* Header mit User */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {session.user_avatar ? (
              <img src={session.user_avatar} alt="" className="w-16 h-16 rounded-2xl border border-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-2xl text-white font-bold">
                {(session.user_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300">Live</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{session.user_name || 'Unbekannt'}</h3>
              <p className="text-xs text-white/40 font-mono">{session.user_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-white/10">
            <Clock className="w-4 h-4 text-white/50" />
            <span className="font-mono text-white/80">{formatDuration(session.created_at)}</span>
          </div>
        </div>

        {/* Anliegen */}
        {session.reason && (
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Anliegen des Users</label>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/75">
              {session.reason}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">📝 Notizen (nur für Admins)</label>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Was wurde besprochen? Lösung? Folge-Maßnahmen?"
            rows={5}
            maxLength={4000}
            className="bg-black/30 border-white/[0.08] text-white placeholder:text-white/25 resize-none rounded-xl focus:border-emerald-500/40"
          />
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-white/30">{notesDraft.length}/4000</p>
            <Button
              onClick={onSaveNotes}
              disabled={savingNotes}
              size="sm"
              className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10"
            >
              {savingNotes ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              Notizen speichern
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
          <Button
            onClick={onEnd}
            className="flex-1 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-red-500/20"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            Session beenden & löschen
          </Button>
        </div>
      </div>
    </div>
  );
}
