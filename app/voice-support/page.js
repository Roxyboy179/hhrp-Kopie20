'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Headphones, Mic, MicOff, PhoneOff, Loader2,
  Volume2, VolumeX, AlertCircle, Lock, Clock,
  Sparkles, Radio, MessageSquare, ShieldCheck, PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useVoiceCall } from '@/hooks/useVoiceCall';
import { useVoiceTranscription } from '@/hooks/useVoiceTranscription';

const HEARTBEAT_MS = 10_000;
const MAX_REASON_LEN = 500;

export default function VoiceSupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [reason, setReason] = useState('');
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [holdMuted, setHoldMuted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef(null);
  const heartbeatTimerRef = useRef(null);

  // Transkript-Messages (lokal + vom Peer empfangen)
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const txChannelRef = useRef(null);

  // ─── WebRTC Voice Call (Callee = User) ───
  const isActive = session?.status === 'active';
  const { connectionState, micError, remoteAudioRef } = useVoiceCall({
    sessionId: isActive ? session?.id : null,
    role: 'callee',
    enabled: Boolean(isActive && user?.id),
    selfId: user?.id ? String(user.id) : null,
    micMuted,
  });

  // ─── Voice Transcription ───
  // Nur starten, wenn Gespräch aktiv UND Mic nicht muted UND WebRTC connected
  const transcriptionEnabled = Boolean(
    isActive && user?.id && !micMuted && connectionState === 'connected'
  );

  const handleFinalTranscript = useCallback(({ text, timestamp }) => {
    if (!session?.id || !user?.id) return;
    const msg = {
      id: `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      speakerId: String(user.id),
      speakerName: user.username || user.global_name || 'User',
      speakerAvatar: user.avatar_url || null,
      text,
      timestamp,
    };
    // Lokal speichern
    messagesRef.current = [...messagesRef.current, msg];
    setMessages(messagesRef.current);
    // An Peer broadcasten
    if (txChannelRef.current) {
      try {
        txChannelRef.current.send({
          type: 'broadcast',
          event: 'transcript',
          payload: msg,
        });
      } catch (e) {
        console.warn('[transcript] broadcast failed', e);
      }
    }
  }, [session?.id, user]);

  useVoiceTranscription({
    enabled: transcriptionEnabled,
    onFinal: handleFinalTranscript,
  });

  // ─── Transkript-Channel (empfängt Messages vom Supporter) ───
  useEffect(() => {
    if (!isActive || !session?.id || !user?.id) {
      txChannelRef.current = null;
      return;
    }
    const client = getSupabaseBrowser();
    if (!client) return;

    const channel = client.channel(`vs_tx_${session.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'transcript' }, ({ payload }) => {
      if (!payload || payload.speakerId === String(user.id)) return;
      messagesRef.current = [...messagesRef.current, payload];
      setMessages(messagesRef.current);
    });

    channel.subscribe();
    txChannelRef.current = channel;

    return () => {
      try { client.removeChannel(channel); } catch {}
      txChannelRef.current = null;
    };
  }, [isActive, session?.id, user?.id]);

  // Messages-Reset wenn Session wechselt
  useEffect(() => {
    if (!session) {
      messagesRef.current = [];
      setMessages([]);
    }
  }, [session?.id, session]);

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
    if (!authLoading && !user) return;
    if (user) fetchMySession();
  }, [user, authLoading, fetchMySession]);

  // Realtime-Updates
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

  // Heartbeat + Audio + Timer
  useEffect(() => {
    if (!session) {
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

    if (audioRef.current) {
      if (session.status === 'waiting') {
        audioRef.current.loop = true;
        audioRef.current.muted = holdMuted;
        audioRef.current.play().catch(() => {});
      } else if (session.status === 'active') {
        audioRef.current.pause();
      }
    }

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
            fetchMySession();
          }
        }
      } catch {}
    };
    sendHb();
    heartbeatTimerRef.current = setInterval(sendHb, HEARTBEAT_MS);

    let waitingPollTimer = null;
    if (session.status === 'waiting') {
      waitingPollTimer = setInterval(() => fetchMySession(), 3000);
    }

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
  }, [session, holdMuted, fetchMySession]);

  // Session auto-beenden bei Page-Close
  useEffect(() => {
    if (!session) return;
    const handleUnload = () => {
      try {
        const blob = new Blob(
          [JSON.stringify({ sessionId: session.id, transcript: messagesRef.current || [] })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/voice-support/end', blob);
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
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
    } catch {
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
        body: JSON.stringify({
          sessionId: session.id,
          transcript: messagesRef.current || [],
        }),
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

  if (authLoading || loadingSession) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginRequiredScreen onLogin={() => router.push('/api/auth/discord')} />;
  }

  return (
    <>
      <audio ref={audioRef} src="/support-voice.mp3" preload="auto" loop />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/[0.08] blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/[0.06] blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-purple-500/[0.05] blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 min-h-screen text-white pt-16 sm:pt-20 pb-16 px-3 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl mb-4">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-white/70 tracking-wide">Voice Support</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              Sprich direkt mit uns
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/50 max-w-lg mx-auto">
              Live Audio-Support – dein Supporter meldet sich per Voice, sobald verfügbar.
            </p>
          </div>

          {/* Main Card */}
          {!session ? (
            <StartCard
              reason={reason}
              setReason={setReason}
              onStart={startSession}
              creating={creating}
            />
          ) : (
            <ActiveSessionCard
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

          {/* Info Pills */}
          {!session && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoPill
                icon={<ShieldCheck className="w-4 h-4" />}
                title="Sicher"
                text="End-to-End verschlüsselt"
              />
              <InfoPill
                icon={<Sparkles className="w-4 h-4" />}
                title="Schnell"
                text="Im Schnitt < 2 Min Wartezeit"
              />
              <InfoPill
                icon={<PhoneCall className="w-4 h-4" />}
                title="Direkt"
                text="Live-Gespräch mit Team"
              />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }

        @keyframes ping-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .ping-ring::before,
        .ping-ring::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid currentColor;
          animation: ping-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .ping-ring::after { animation-delay: 1s; }

        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .wave-bar { animation: wave-bar 1.2s ease-in-out infinite; transform-origin: center; }
      `}</style>
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  COMPONENTS                                                  */
/* ──────────────────────────────────────────────────────────── */

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-xs text-white/30 uppercase tracking-widest">Laden…</p>
      </div>
    </div>
  );
}

function LoginRequiredScreen({ onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
        <div className="p-8 sm:p-10 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-3xl blur-xl" />
            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center backdrop-blur-xl">
              <Lock className="w-8 h-8 text-blue-300" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Login erforderlich</h1>
            <p className="text-sm text-white/50 max-w-sm mx-auto">
              Um Voice Support zu nutzen, melde dich mit deinem Discord-Account an.
            </p>
          </div>
          <Button
            onClick={onLogin}
            className="w-full h-12 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold shadow-xl shadow-[#5865F2]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Mit Discord anmelden
          </Button>
          <p className="text-[11px] text-white/30 leading-relaxed">
            Wir nutzen deinen Discord-Account nur zur Identifikation für den Voice Support.
          </p>
        </div>
      </div>
    </div>
  );
}

function StartCard({ reason, setReason, onStart, creating }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="p-6 sm:p-10 space-y-6">
        {/* Icon + Title */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-2xl blur-lg" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/[0.12] flex items-center justify-center backdrop-blur-xl">
              <Headphones className="w-6 h-6 text-blue-300" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-white leading-tight">
              Voice Support anfordern
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Team meldet sich direkt per Audio
            </p>
          </div>
        </div>

        {/* Reason Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-white/60 uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            Dein Anliegen <span className="text-white/30 normal-case tracking-normal">(optional)</span>
          </label>
          <div className="relative">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LEN))}
              placeholder="Beschreibe kurz, worum es geht – so können wir dir schneller helfen."
              rows={4}
              className="resize-none rounded-2xl bg-black/20 border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-blue-500/20 text-sm leading-relaxed p-4"
              disabled={creating}
            />
            <div className="absolute bottom-3 right-4 text-[10px] text-white/25 font-mono">
              {reason.length}/{MAX_REASON_LEN}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-2xl bg-blue-500/[0.06] border border-blue-500/[0.15] p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-white/70 leading-relaxed">
            Bitte stelle sicher, dass dein <strong className="text-white">Mikrofon</strong> funktioniert.
            Nach dem Start erlaubst du einmalig den Zugriff in deinem Browser.
          </div>
        </div>

        {/* WARNUNG: Kein Missbrauch */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/[0.08] via-orange-500/[0.06] to-red-500/[0.08] border border-red-500/[0.25] p-4 flex gap-3">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-red-500/40 rounded-full blur-md animate-pulse" />
            <ShieldAlert className="relative w-5 h-5 text-red-300 mt-0.5" strokeWidth={2.2} />
          </div>
          <div className="text-xs sm:text-sm text-white/80 leading-relaxed space-y-1.5">
            <div className="font-semibold text-red-200 uppercase tracking-wider text-[11px]">
              ⚠️ Wichtig – Nutzungsregeln
            </div>
            <div>
              Der Voice Support ist ausschließlich für <strong className="text-white">ernste Anliegen</strong> gedacht.
              Missbrauch (z.&nbsp;B. grundloses Aufrufen, Spam, Trolling oder unnötiges Blockieren des Teams)
              kann zu einem <strong className="text-white">dauerhaften Ausschluss vom Support-System</strong> oder
              weiteren Maßnahmen führen.
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStart}
          disabled={creating}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Starte Session…
            </>
          ) : (
            <>
              <PhoneCall className="w-5 h-5 mr-2" />
              Voice Support starten
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ActiveSessionCard({
  session, elapsed, holdMuted, setHoldMuted,
  micMuted, setMicMuted, connectionState, onEnd, formatTime,
}) {
  const isWaiting = session.status === 'waiting';
  const isActive = session.status === 'active';

  // Connection-Label + Farben
  const rtc = (() => {
    if (!isActive) return null;
    switch (connectionState) {
      case 'connected':
        return { text: 'Live verbunden', color: 'text-emerald-300', dot: 'bg-emerald-400' };
      case 'connecting':
        return { text: 'Verbinde Audio…', color: 'text-amber-300', dot: 'bg-amber-400 animate-pulse' };
      case 'failed':
        return { text: 'Audio-Fehler', color: 'text-red-300', dot: 'bg-red-400' };
      default:
        return { text: 'Mikrofon wird initialisiert…', color: 'text-white/50', dot: 'bg-white/40 animate-pulse' };
    }
  })();

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      {/* Top border highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Dynamic glow based on state */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isWaiting ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Status-Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`relative w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'} ${isWaiting ? 'animate-pulse' : ''}`}>
              {isActive && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              {isWaiting ? 'Wartend' : 'Live-Gespräch'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="flex flex-col items-center text-center space-y-4">
          {isWaiting ? (
            <>
              {/* Waiting: Pulsing waves */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-2xl animate-pulse" />
                <div className="absolute inset-3 rounded-full border border-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-6 rounded-full border border-blue-400/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center shadow-2xl">
                  <Headphones className="w-9 h-9 sm:w-11 sm:h-11 text-blue-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Verbinde dich mit einem Supporter…
                </h2>
                <p className="text-sm text-white/50 max-w-sm mx-auto">
                  Bitte kurz warten – das Team wurde informiert und ruft dich gleich an.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Active: Voice Wave Animation */}
              <div className="relative flex items-center justify-center">
                {session.supporter_avatar ? (
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 blur-xl animate-pulse" />
                    <img
                      src={session.supporter_avatar}
                      alt={session.supporter_name}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-emerald-400/40 object-cover shadow-2xl"
                    />
                    {connectionState === 'connected' && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center">
                      <Headphones className="w-10 h-10 text-emerald-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* Voice bars */}
              {connectionState === 'connected' && (
                <div className="flex items-end gap-1 h-5">
                  {[0.8, 1, 0.6, 1.2, 0.9, 1.1, 0.7].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-emerald-400 to-teal-300 rounded-full wave-bar"
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {session.supporter_name || 'Supporter'}
                </h2>
                <p className="text-sm text-white/50">Spricht jetzt mit dir</p>
                {rtc && (
                  <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-black/30 border border-white/[0.06] text-[11px] font-medium uppercase tracking-wider ${rtc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${rtc.dot}`} />
                    <span>{rtc.text}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reason Preview */}
        {session.reason && (
          <div className="rounded-2xl bg-black/20 border border-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                  Dein Anliegen
                </div>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
                  {session.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isActive ? (
            <Button
              onClick={() => setMicMuted(!micMuted)}
              className={`flex-1 sm:flex-none h-14 rounded-2xl px-6 font-semibold transition-all border backdrop-blur-xl ${
                micMuted
                  ? 'bg-red-500/15 border-red-500/30 text-red-200 hover:bg-red-500/25'
                  : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]'
              }`}
              title={micMuted ? 'Mikrofon einschalten' : 'Mikrofon stumm schalten'}
            >
              {micMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
              {micMuted ? 'Mic aus' : 'Mic an'}
            </Button>
          ) : (
            <Button
              onClick={() => setHoldMuted(!holdMuted)}
              className={`flex-1 sm:flex-none h-14 rounded-2xl px-6 font-semibold transition-all border backdrop-blur-xl ${
                holdMuted
                  ? 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                  : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]'
              }`}
              title={holdMuted ? 'Wartemusik an' : 'Wartemusik stumm'}
            >
              {holdMuted ? <VolumeX className="w-5 h-5 mr-2" /> : <Volume2 className="w-5 h-5 mr-2" />}
              {holdMuted ? 'Musik aus' : 'Musik an'}
            </Button>
          )}
          <Button
            onClick={onEnd}
            className="flex-1 h-14 rounded-2xl px-6 font-semibold bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:via-red-500 hover:to-red-600 text-white shadow-xl shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            Auflegen
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ icon, title, text }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-blue-300 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/50 mt-0.5">{text}</div>
        </div>
      </div>
    </div>
  );
}
