'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, Mic, MicOff, PhoneOff, Loader2, Volume2, VolumeX, AlertCircle, Lock, Clock, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useVoiceCall } from '@/hooks/useVoiceCall';

const HEARTBEAT_MS = 10_000; // 10s

export default function VoiceSupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [reason, setReason] = useState('');
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [holdMuted, setHoldMuted] = useState(false); // Wartemusik stumm
  const [micMuted, setMicMuted] = useState(false);   // Mikrofon stumm (aktiver Call)
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef(null);
  const heartbeatTimerRef = useRef(null);

  // ─── WebRTC Voice Call (Callee = User) ───
  const isActive = session?.status === 'active';
  const { connectionState, micError, remoteAudioRef } = useVoiceCall({
    sessionId: isActive ? session?.id : null,
    role: 'callee',
    enabled: Boolean(isActive && user?.id),
    selfId: user?.id ? String(user.id) : null,
    micMuted,
  });

  // Toast bei Mic-Fehler
  useEffect(() => {
    if (micError) toast.error(micError);
  }, [micError]);

  // Session laden
  const fetchMySession = useCallback(async () => {
    try {
      const res = await fetch('/api/voice-support/me', { cache: 'no-store' });
      if (!res.ok) {
        setSession(null);
        return;
      }
      const data = await res.json();
      setSession(data.session || null);
    } catch (e) {
      console.error('[voice-support] fetch error', e);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      // Nicht eingeloggt → zur Login-Seite
      return;
    }
    if (user) fetchMySession();
  }, [user, authLoading, fetchMySession]);

  // Realtime: bei Änderung der Session neu laden
  useEffect(() => {
    if (!user?.id) return;
    const client = getSupabaseBrowser();
    if (!client) return;

    const channel = client
      .channel(`vs_user_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_support_sessions' },
        (payload) => {
          const rowUserId = String(payload?.new?.user_id ?? payload?.old?.user_id ?? '');
          if (rowUserId === String(user.id)) {
            fetchMySession();
          }
        }
      )
      .subscribe();

    return () => {
      try { client.removeChannel(channel); } catch {}
    };
  }, [user?.id, fetchMySession]);

  // Heartbeat senden + Audio managen
  useEffect(() => {
    if (!session) {
      // Kein Session aktiv → Audio stoppen
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      setElapsed(0);
      return;
    }

    // Audio abspielen (looped) – nur solange Session "waiting"
    if (audioRef.current) {
      if (session.status === 'waiting') {
        audioRef.current.loop = true;
        audioRef.current.muted = holdMuted;
        audioRef.current.play().catch((err) => {
          console.warn('[voice-support] autoplay blocked:', err);
        });
      } else if (session.status === 'active') {
        // Supporter hat übernommen → Wartemusik aus
        audioRef.current.pause();
      }
    }

    // Heartbeat-Loop
    const sendHb = async () => {
      try {
        const res = await fetch('/api/voice-support/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id, role: 'user' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'gone') {
            setSession(null);
            toast.info('Voice Support beendet');
          } else if (data.status && data.status !== session.status) {
            // Status hat sich geändert (z. B. waiting → active) – neu laden
            fetchMySession();
          }
        }
      } catch {}
    };
    sendHb();
    heartbeatTimerRef.current = setInterval(sendHb, HEARTBEAT_MS);

    // Schneller Status-Poll während "waiting" – damit der Wechsel auf "active"
    // sofort ankommt, falls Supabase-Realtime mal nicht zuverlässig feuert.
    let waitingPollTimer = null;
    if (session.status === 'waiting') {
      waitingPollTimer = setInterval(() => {
        fetchMySession();
      }, 3000);
    }

    // Elapsed-Timer
    const startTs = new Date(session.created_at).getTime();
    const elapsedTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTs) / 1000));
    }, 1000);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (waitingPollTimer) clearInterval(waitingPollTimer);
      clearInterval(elapsedTimer);
    };
  }, [session, holdMuted]);

  // Beim Verlassen der Seite Session beenden
  useEffect(() => {
    if (!session) return;
    const handleUnload = () => {
      try {
        const blob = new Blob([JSON.stringify({ sessionId: session.id })], { type: 'application/json' });
        navigator.sendBeacon('/api/voice-support/end', blob);
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [session]);

  const startSession = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/voice-support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Fehler beim Starten');
        return;
      }
      setSession(data.session);
      toast.success('Voice Support gestartet 🎧');
    } catch (e) {
      toast.error('Server nicht erreichbar');
    } finally {
      setCreating(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await fetch('/api/voice-support/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });
      setSession(null);
      toast.success('Voice Support beendet');
    } catch {
      toast.error('Fehler beim Beenden');
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Rendering ──────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  // Nicht eingeloggt → Login-Required Card
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4 pt-20">
          <div className="relative max-w-lg w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 backdrop-blur-xl p-10 text-center shadow-2xl">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Lock className="w-10 h-10 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Discord Login erforderlich</h1>
                <p className="text-white/60">
                  Um Voice Support zu nutzen, musst du dich mit Discord einloggen.
                </p>
              </div>
              <Button
                onClick={() => router.push('/api/auth/discord')}
                className="w-full h-12 bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Mit Discord einloggen
              </Button>
              <p className="text-xs text-white/30">
                Wir nutzen deinen Discord-Account nur zur Identifikation für den Voice Support.
              </p>
            </div>
          </div>
        </div>
    );
  }

  return (
    <>
      {/* Audio-Element (immer im DOM, kontrolliert per useEffect) */}
      <audio ref={audioRef} src="/support-voice.mp3" preload="auto" loop />

      {/* Remote-Audio (Supporter-Stream) – wird von useVoiceCall befüllt */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="min-h-screen bg-[#0a0a0b] pt-20 pb-12 px-4">
        {/* Hintergrund-Glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">HHRP Voice Support</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Sprechen statt schreiben
            </h1>
            <p className="text-white/50 max-w-xl mx-auto">
              Direkter Voice-Support durch unser Team – schnell, persönlich und unkompliziert.
            </p>
          </div>

          {loadingSession ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            </div>
          ) : !session ? (
            // ─── Session-Erstellung ─────────────────────
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 backdrop-blur-xl shadow-2xl">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-8 md:p-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-7 h-7 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Voice Support starten</h2>
                    <p className="text-sm text-white/50">
                      Drücke auf Start und unser Team wird benachrichtigt. Sobald jemand übernimmt, kann das Gespräch beginnen.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                    Worum geht's? (optional)
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Kurze Beschreibung deines Anliegens..."
                    maxLength={500}
                    rows={4}
                    className="bg-black/30 border-white/[0.08] text-white placeholder:text-white/25 resize-none rounded-xl focus:border-blue-500/40"
                  />
                  <p className="text-[11px] text-white/30 text-right">{reason.length}/500</p>
                </div>

                {/* Info-Bullets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InfoTile icon={<Clock className="w-4 h-4" />} title="Schnelle Antwort" subtitle="Meist < 5 Min." />
                  <InfoTile icon={<Shield className="w-4 h-4" />} title="Verifiziert" subtitle="Discord-Login" />
                  <InfoTile icon={<Volume2 className="w-4 h-4" />} title="Live Audio" subtitle="Wartemusik aktiv" />
                </div>

                <Button
                  onClick={startSession}
                  disabled={creating}
                  className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verbinde...
                    </>
                  ) : (
                    <>
                      <Headphones className="w-5 h-5 mr-2" />
                      Voice Support starten
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-center text-white/30">
                  Mit dem Start bestätigst du, dass dein Anliegen ernst gemeint ist.
                  Missbrauch kann zu Ban führen.
                </p>
              </div>
            </div>
          ) : (
            // ─── Aktive Session ─────────────────────
            <ActiveSessionView
              session={session}
              elapsed={elapsed}
              holdMuted={holdMuted}
              setHoldMuted={setHoldMuted}
              micMuted={micMuted}
              setMicMuted={setMicMuted}
              connectionState={connectionState}
              onEnd={endSession}
              formatTime={formatTime}
            />
          )}
        </div>
      </div>
    </>
  );
}

function InfoTile({ icon, title, subtitle }) {
  return (
    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-white/60">
          {icon}
        </div>
        <div className="leading-tight">
          <div className="text-xs font-semibold text-white/85">{title}</div>
          <div className="text-[10px] text-white/35">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function ActiveSessionView({ session, elapsed, holdMuted, setHoldMuted, micMuted, setMicMuted, connectionState, onEnd, formatTime }) {
  const isWaiting = session.status === 'waiting';
  const isActive = session.status === 'active';

  // Status-Label für WebRTC-Verbindung (nur wenn aktiv)
  const rtcLabel = (() => {
    if (!isActive) return null;
    switch (connectionState) {
      case 'connected': return { text: 'Mikrofon & Audio verbunden', color: 'text-emerald-300' };
      case 'connecting': return { text: 'Verbinde Audio…', color: 'text-amber-300' };
      case 'failed': return { text: 'Audio-Verbindung fehlgeschlagen', color: 'text-red-300' };
      default: return { text: 'Audio wird initialisiert…', color: 'text-white/50' };
    }
  })();

  return (
    <div className="space-y-4">
      {/* Status-Karte */}
      <div className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl shadow-2xl ${
        isWaiting
          ? 'border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-zinc-950/80 shadow-amber-900/20'
          : 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-zinc-950/80 shadow-emerald-900/20'
      }`}>
        <div className={`absolute -top-32 -right-32 w-96 h-96 ${isWaiting ? 'bg-amber-500/10' : 'bg-emerald-500/10'} rounded-full blur-3xl pointer-events-none`} />

        <div className="relative p-8 md:p-10">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Pulse Icon */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-full ${isWaiting ? 'bg-amber-500/20' : 'bg-emerald-500/20'} animate-ping`} />
              <div className={`relative w-28 h-28 rounded-full ${isWaiting ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 border-amber-500/40' : 'bg-gradient-to-br from-emerald-500/30 to-green-500/20 border-emerald-500/40'} border-2 flex items-center justify-center backdrop-blur-sm`}>
                {isWaiting ? (
                  <Headphones className="w-14 h-14 text-amber-300" />
                ) : (
                  <Mic className="w-14 h-14 text-emerald-300" />
                )}
              </div>
            </div>

            {/* Status Pill */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${
              isWaiting ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
            } border`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inset-0 rounded-full ${isWaiting ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping opacity-75`} />
                <span className={`relative rounded-full h-2 w-2 ${isWaiting ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${isWaiting ? 'text-amber-300' : 'text-emerald-300'}`}>
                {isWaiting ? 'Warte auf Supporter' : 'Verbunden mit Supporter'}
              </span>
            </div>

            {/* Titel */}
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {isWaiting ? 'Verbinde mit Supporter…' : 'Live Gespräch aktiv'}
              </h2>
              <p className="text-white/50">
                {isWaiting
                  ? 'Unser Team wurde benachrichtigt – bitte habe einen Moment Geduld.'
                  : `${session.supporter_name || 'Ein Supporter'} kümmert sich gerade um dich.`}
              </p>
            </div>

            {/* Supporter Info wenn active */}
            {isActive && session.supporter_id && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                {session.supporter_avatar ? (
                  <img src={session.supporter_avatar} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold">
                    {(session.supporter_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-sm font-semibold text-white/90">{session.supporter_name || 'Supporter'}</div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-2 text-white/40 font-mono text-lg">
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsed)}</span>
            </div>

            {/* WebRTC Audio Status */}
            {isActive && rtcLabel && (
              <div className={`flex items-center gap-2 text-xs ${rtcLabel.color}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`relative rounded-full h-2 w-2 ${connectionState === 'connected' ? 'bg-emerald-400' : connectionState === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                </span>
                <span className="font-medium uppercase tracking-wider">{rtcLabel.text}</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 pt-2">
              {isActive ? (
                <Button
                  onClick={() => setMicMuted(!micMuted)}
                  variant="outline"
                  className={`rounded-xl h-14 w-14 p-0 border-white/10 hover:bg-white/[0.05] ${micMuted ? 'bg-red-500/10 border-red-500/30 text-red-300' : ''}`}
                  title={micMuted ? 'Mikrofon an' : 'Mikrofon stumm'}
                >
                  {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              ) : (
                <Button
                  onClick={() => setHoldMuted(!holdMuted)}
                  variant="outline"
                  className="rounded-xl h-14 w-14 p-0 border-white/10 hover:bg-white/[0.05]"
                  title={holdMuted ? 'Wartemusik an' : 'Wartemusik stumm'}
                >
                  {holdMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              )}
              <Button
                onClick={onEnd}
                className="rounded-xl h-14 px-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-red-500/20"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Auflegen
              </Button>
            </div>

            {/* Reason */}
            {session.reason && (
              <div className="w-full max-w-md pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Dein Anliegen</p>
                <p className="text-sm text-white/70">{session.reason}</p>
              </div>
            )}

            {/* Warnung */}
            <div className="flex items-start gap-2 text-xs text-white/35 max-w-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-left">
                Wenn du diese Seite verlässt, wird das Gespräch automatisch beendet.
                Der Supporter erhält eine Benachrichtigung.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
