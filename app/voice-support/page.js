'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Headphones, Mic, MicOff, PhoneOff, Loader2,
  Volume2, VolumeX, AlertCircle, Lock, Clock,
  Sparkles, Radio, MessageSquare, ShieldCheck, PhoneCall,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useVoiceCall } from '@/hooks/useVoiceCall';

const HEARTBEAT_MS = 10_000;
const MAX_REASON_LEN = 500;

/* ────────────────────────────────────────────────────────────
   APPLE LIQUID-GLASS STYLE TOKENS
   ──────────────────────────────────────────────────────────── */

// Multi-layer inset highlights + outer diffuse shadow = echter Glass-Bevel
const GLASS_SHADOW =
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),inset_0_-1px_0_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_-20px_rgba(0,0,0,0.55),0_10px_30px_-10px_rgba(0,0,0,0.35)]';

const GLASS_SHADOW_SM =
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),inset_0_-1px_0_0_rgba(255,255,255,0.04),0_12px_32px_-12px_rgba(0,0,0,0.45)]';

const GLASS_BASE =
  'bg-white/[0.07] backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/[0.14]';

// Specular highlight als Pseudo-Element (oben Lichtkante)
const GLASS_SPECULAR = `
  before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px
  before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent
  before:pointer-events-none
`;

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

  // WebRTC Voice Call (Callee = User)
  const isActive = session?.status === 'active';
  const { connectionState, micError, remoteAudioRef } = useVoiceCall({
    sessionId: isActive ? session?.id : null,
    role: 'callee',
    enabled: Boolean(isActive && user?.id),
    selfId: user?.id ? String(user.id) : null,
    micMuted,
  });

  useEffect(() => {
    if (micError) toast.error(micError);
  }, [micError]);

  const fetchMySession = useCallback(async () => {
    try {
      const res = await fetch('/api/voice-support/me', { cache: 'no-store' });
      if (!res.ok) { setSession(null); return; }
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
          if (rowUserId === String(user.id)) fetchMySession();
        }
      )
      .subscribe();

    return () => { try { client.removeChannel(channel); } catch {} };
  }, [user?.id, fetchMySession]);

  useEffect(() => {
    if (!session) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      if (heartbeatTimerRef.current) { clearInterval(heartbeatTimerRef.current); heartbeatTimerRef.current = null; }
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
          if (data.status === 'gone') { setSession(null); toast.info('Voice Support beendet'); }
          else if (data.status && data.status !== session.status) fetchMySession();
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
      if (heartbeatTimerRef.current) { clearInterval(heartbeatTimerRef.current); heartbeatTimerRef.current = null; }
      if (waitingPollTimer) clearInterval(waitingPollTimer);
      clearInterval(elapsedTimer);
    };
  }, [session, holdMuted, fetchMySession]);

  useEffect(() => {
    if (!session) return;
    const handleUnload = () => {
      try {
        const blob = new Blob([JSON.stringify({ sessionId: session.id })], { type: 'application/json' });
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
      if (!res.ok) { toast.error(data.error || 'Fehler beim Starten'); return; }
      setSession(data.session);
      toast.success('Voice Support gestartet 🎧');
    } catch {
      toast.error('Server nicht erreichbar');
    } finally { setCreating(false); }
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
    } catch { toast.error('Fehler beim Beenden'); }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (authLoading || loadingSession) return <LoadingScreen />;
  if (!user) return <LoginRequiredScreen onLogin={() => router.push('/api/auth/discord')} />;

  return (
    <>
      <audio ref={audioRef} src="/support-voice.mp3" preload="auto" loop />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ═══ APPLE GLASS CANVAS ═══ */}
      <div className="relative min-h-screen overflow-hidden bg-[#030610] text-white">
        {/* 1) Farbige Mesh-Gradients (das "Licht", das durchs Glas scheint) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-float-slow"
               style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)' }} />
          <div className="absolute top-[-5%] right-[-15%] w-[60%] h-[60%] rounded-full blur-[120px] animate-float-slow"
               style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)', animationDelay: '3s' }} />
          <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] rounded-full blur-[140px] animate-float-slow"
               style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.35) 0%, transparent 70%)', animationDelay: '6s' }} />
          <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] rounded-full blur-[100px] animate-float-slow"
               style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)', animationDelay: '9s' }} />
        </div>

        {/* 2) Grain/Noise Overlay (Mattglas-Körnung) */}
        <div
          className="fixed inset-0 z-[1] pointer-events-none opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          }}
        />

        {/* 3) Vignette */}
        <div className="fixed inset-0 z-[2] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.5)_100%)]" />

        {/* ═══ CONTENT LAYER ═══ */}
        <div className="relative z-10 pt-20 sm:pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 sm:mb-10 text-center">
              <GlassPill>
                <Radio className="w-3.5 h-3.5 text-white/80" />
                <span className="text-[11px] font-semibold text-white/90 tracking-[0.14em] uppercase">
                  Voice Support
                </span>
              </GlassPill>
              <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent leading-[1.05]"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', letterSpacing: '-0.03em' }}>
                Sprich mit uns.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-white/60 max-w-md mx-auto leading-relaxed">
                Live Audio-Support direkt im Browser.<br className="hidden sm:inline" />
                Ein Supporter meldet sich per Voice, sobald jemand verfügbar ist.
              </p>
            </div>

            {!session ? (
              <StartCard reason={reason} setReason={setReason} onStart={startSession} creating={creating} />
            ) : (
              <ActiveSessionCard
                session={session} elapsed={elapsed}
                holdMuted={holdMuted} setHoldMuted={setHoldMuted}
                micMuted={micMuted} setMicMuted={setMicMuted}
                connectionState={connectionState} onEnd={endSession}
                formatTime={formatTime}
              />
            )}

            {!session && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InfoPill icon={<ShieldCheck className="w-4 h-4" />} title="Sicher" text="P2P verschlüsselt" tint="emerald" />
                <InfoPill icon={<Sparkles className="w-4 h-4" />} title="Schnell" text="Meist &lt; 2 Min" tint="amber" />
                <InfoPill icon={<PhoneCall className="w-4 h-4" />} title="Direkt" text="Live mit Team" tint="sky" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.08); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }

        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        .wave-bar { animation: wave-bar 1.1s ease-in-out infinite; transform-origin: center; }

        @keyframes halo-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .halo-pulse { animation: halo-pulse 3s ease-in-out infinite; }
      `}</style>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   REUSABLE GLASS PRIMITIVES
   ════════════════════════════════════════════════════════════ */

function GlassPill({ children }) {
  return (
    <div className={`relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${GLASS_BASE} ${GLASS_SHADOW_SM} overflow-hidden`}>
      <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LOADING + LOGIN
   ════════════════════════════════════════════════════════════ */

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#030610] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl halo-pulse" />
          <Loader2 className="relative w-9 h-9 text-white/80 animate-spin" />
        </div>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.25em]">Laden</p>
      </div>
    </div>
  );
}

function LoginRequiredScreen({ onLogin }) {
  return (
    <div className="relative min-h-screen bg-[#030610] flex items-center justify-center px-4 pt-20 overflow-hidden">
      {/* Colorful background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
             style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)' }} />
      </div>

      <div className={`relative w-full max-w-md rounded-[32px] overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW}`}>
        <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="p-9 sm:p-10 text-center space-y-7">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-[-8px] bg-gradient-to-br from-indigo-400/40 to-pink-400/40 rounded-[28px] blur-2xl" />
            <div className={`relative w-full h-full rounded-[22px] ${GLASS_BASE} ${GLASS_SHADOW_SM} flex items-center justify-center overflow-hidden`}>
              <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <Lock className="w-8 h-8 text-white/90" strokeWidth={2} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', letterSpacing: '-0.025em' }}>
              Login erforderlich
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Melde dich mit Discord an, um Voice Support zu nutzen.
            </p>
          </div>
          <Button
            onClick={onLogin}
            className="w-full h-12 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold shadow-[0_10px_30px_-5px_rgba(88,101,242,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Mit Discord anmelden
          </Button>
          <p className="text-[11px] text-white/35 leading-relaxed">
            Wir nutzen deinen Discord-Account nur zur Identifikation.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   START CARD
   ════════════════════════════════════════════════════════════ */

function StartCard({ reason, setReason, onStart, creating }) {
  return (
    <div className={`relative rounded-[32px] overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW}`}>
      {/* Top specular highlight */}
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none" />
      {/* Diagonal shine */}
      <span className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent blur-sm pointer-events-none" />

      <div className="relative p-7 sm:p-10 space-y-7">
        {/* Icon + Title Row */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-[-6px] bg-gradient-to-br from-indigo-400/50 to-sky-400/50 rounded-3xl blur-xl" />
            <div className={`relative w-14 h-14 rounded-2xl ${GLASS_BASE} ${GLASS_SHADOW_SM} flex items-center justify-center overflow-hidden`}>
              <span className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <Headphones className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-[22px] font-semibold text-white tracking-tight leading-tight"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', letterSpacing: '-0.02em' }}>
              Voice Support anfordern
            </h2>
            <p className="text-[13px] text-white/55 mt-0.5">Team meldet sich direkt per Audio</p>
          </div>
        </div>

        {/* Reason textarea */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-[10px] font-semibold text-white/50 uppercase tracking-[0.14em]">
            <MessageSquare className="w-3.5 h-3.5" />
            Dein Anliegen
            <span className="text-white/30 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <div className="relative group">
            {/* Inner glow focus ring */}
            <div className={`relative rounded-2xl overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW_SM} transition-all group-focus-within:border-white/25 group-focus-within:bg-white/[0.09]`}>
              <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LEN))}
                placeholder="Beschreibe kurz, worum es geht …"
                rows={4}
                className="relative resize-none bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed p-4 pb-8"
                disabled={creating}
              />
              <div className="absolute bottom-2.5 right-4 text-[10px] text-white/35 font-mono tabular-nums">
                {reason.length}/{MAX_REASON_LEN}
              </div>
            </div>
          </div>
        </div>

        {/* Tip box */}
        <div className={`relative rounded-2xl overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW_SM} p-4 flex gap-3`}>
          <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="absolute inset-[-4px] bg-blue-400/40 rounded-full blur-md" />
            <AlertCircle className="relative w-4 h-4 text-blue-200" strokeWidth={2.2} />
          </div>
          <div className="text-[13px] text-white/75 leading-relaxed">
            Bitte stelle sicher, dass dein <strong className="text-white font-semibold">Mikrofon</strong> funktioniert.
            Du erlaubst einmalig den Zugriff im Browser.
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={creating}
          className="group relative w-full h-14 rounded-2xl overflow-hidden font-semibold text-base transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_12px_40px_-8px_rgba(59,130,246,0.55)] rounded-2xl" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <div className="relative flex items-center justify-center gap-2 text-white drop-shadow-sm">
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starte Session…
              </>
            ) : (
              <>
                <PhoneCall className="w-5 h-5" strokeWidth={2.2} />
                Voice Support starten
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ACTIVE SESSION CARD
   ════════════════════════════════════════════════════════════ */

function ActiveSessionCard({
  session, elapsed, holdMuted, setHoldMuted,
  micMuted, setMicMuted, connectionState, onEnd, formatTime,
}) {
  const isWaiting = session.status === 'waiting';
  const isActive = session.status === 'active';

  const rtc = (() => {
    if (!isActive) return null;
    switch (connectionState) {
      case 'connected': return { text: 'Live verbunden', color: 'text-emerald-200', dot: 'bg-emerald-300' };
      case 'connecting': return { text: 'Verbinde Audio…', color: 'text-amber-200', dot: 'bg-amber-300 animate-pulse' };
      case 'failed': return { text: 'Audio-Fehler', color: 'text-red-200', dot: 'bg-red-300' };
      default: return { text: 'Mikrofon wird initialisiert…', color: 'text-white/60', dot: 'bg-white/50 animate-pulse' };
    }
  })();

  return (
    <div className={`relative rounded-[32px] overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW}`}>
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none" />

      {/* State-abhängiger Color-Wash (nur im Glas sichtbar) */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 65%)' }} />
      </div>
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isWaiting ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)' }} />
      </div>

      <div className="relative p-6 sm:p-10 space-y-7 sm:space-y-8">
        {/* Top status bar */}
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${GLASS_BASE} ${GLASS_SHADOW_SM} overflow-hidden relative`}>
            <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <span className={`relative w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-amber-300'}`}>
              <span className={`absolute inset-0 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-amber-300'} animate-ping opacity-60`} />
            </span>
            <span className="text-[10px] font-semibold text-white/85 uppercase tracking-[0.14em]">
              {isWaiting ? 'Wartend' : 'Live-Gespräch'}
            </span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${GLASS_BASE} ${GLASS_SHADOW_SM} overflow-hidden relative`}>
            <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <Clock className="w-3 h-3 text-white/70" strokeWidth={2.5} />
            <span className="text-[11px] font-mono tabular-nums text-white/90">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-5 py-2">
          {isWaiting ? (
            <>
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                <div className="absolute inset-[-10px] rounded-full blur-3xl halo-pulse"
                     style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)' }} />
                <div className="absolute inset-4 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute inset-8 rounded-full border border-white/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.7s' }} />
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full ${GLASS_BASE} ${GLASS_SHADOW_SM} flex items-center justify-center overflow-hidden`}>
                  <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  <Headphones className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_2px_8px_rgba(99,102,241,0.6)]" strokeWidth={1.8} />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[22px] sm:text-3xl font-bold text-white tracking-tight"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', letterSpacing: '-0.025em' }}>
                  Verbinde dich…
                </h2>
                <p className="text-sm text-white/55 max-w-sm mx-auto leading-relaxed">
                  Das Team wurde informiert und meldet sich gleich per Voice.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-[-20px] blur-3xl halo-pulse"
                     style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.55) 0%, transparent 70%)' }} />
                {session.supporter_avatar ? (
                  <div className="relative">
                    <img
                      src={session.supporter_avatar}
                      alt={session.supporter_name}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
                      style={{
                        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25), 0 0 0 3px rgba(52,211,153,0.35), 0 20px 60px -10px rgba(52,211,153,0.6)',
                      }}
                    />
                    {connectionState === 'connected' && (
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-300/40 animate-ping" style={{ animationDuration: '2s' }} />
                    )}
                  </div>
                ) : (
                  <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ${GLASS_BASE} ${GLASS_SHADOW_SM} flex items-center justify-center overflow-hidden`}>
                    <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <Headphones className="w-10 h-10 text-emerald-200" strokeWidth={1.8} />
                  </div>
                )}
              </div>

              {/* Audio waves */}
              {connectionState === 'connected' && (
                <div className="flex items-end gap-1 h-5">
                  {[0.6, 1, 0.45, 1.2, 0.85, 1.05, 0.55].map((h, i) => (
                    <span
                      key={i}
                      className="w-[3px] bg-gradient-to-t from-emerald-400/80 to-teal-200 rounded-full wave-bar shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <h2 className="text-[22px] sm:text-3xl font-bold text-white tracking-tight"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', letterSpacing: '-0.025em' }}>
                  {session.supporter_name || 'Supporter'}
                </h2>
                <p className="text-sm text-white/55">Spricht jetzt mit dir</p>
                {rtc && (
                  <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${GLASS_BASE} ${GLASS_SHADOW_SM} relative overflow-hidden ${rtc.color}`}>
                    <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className={`w-1.5 h-1.5 rounded-full ${rtc.dot}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{rtc.text}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Anliegen */}
        {session.reason && (
          <div className={`relative rounded-2xl overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW_SM} p-4`}>
            <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-1.5">
                  Dein Anliegen
                </div>
                <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                  {session.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isActive ? (
            <GlassButton
              onClick={() => setMicMuted(!micMuted)}
              active={micMuted}
              activeColor="red"
              icon={micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              label={micMuted ? 'Mic aus' : 'Mic an'}
            />
          ) : (
            <GlassButton
              onClick={() => setHoldMuted(!holdMuted)}
              active={holdMuted}
              activeColor="white"
              icon={holdMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              label={holdMuted ? 'Musik aus' : 'Musik an'}
            />
          )}
          {/* End-Button */}
          <button
            onClick={onEnd}
            className="group relative flex-1 h-14 rounded-2xl overflow-hidden font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-red-600" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-60" />
            <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_12px_40px_-8px_rgba(239,68,68,0.55)] rounded-2xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="relative flex items-center justify-center gap-2 text-white">
              <PhoneOff className="w-5 h-5" strokeWidth={2.2} />
              <span>Auflegen</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function GlassButton({ onClick, active, activeColor, icon, label }) {
  const activeStyles = {
    red: 'bg-red-500/[0.15] border-red-300/30 text-red-100',
    white: 'bg-white/[0.04] border-white/[0.1] text-white/60',
  };
  return (
    <button
      onClick={onClick}
      className={`group relative flex-1 sm:flex-none sm:min-w-[160px] h-14 rounded-2xl overflow-hidden font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] ${
        active
          ? activeStyles[activeColor] || activeStyles.white
          : `${GLASS_BASE} text-white`
      } ${GLASS_SHADOW_SM}`}
    >
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative flex items-center justify-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   INFO PILL
   ════════════════════════════════════════════════════════════ */

function InfoPill({ icon, title, text, tint = 'sky' }) {
  const tintBg = {
    emerald: 'rgba(52,211,153,0.25)',
    amber: 'rgba(251,191,36,0.25)',
    sky: 'rgba(56,189,248,0.25)',
  }[tint];
  const tintText = {
    emerald: 'text-emerald-100',
    amber: 'text-amber-100',
    sky: 'text-sky-100',
  }[tint];

  return (
    <div className={`relative rounded-2xl overflow-hidden ${GLASS_BASE} ${GLASS_SHADOW_SM} p-4 transition-all hover:bg-white/[0.1]`}>
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      <div className="flex items-start gap-3">
        <div className="relative w-9 h-9 flex-shrink-0">
          <div className="absolute inset-[-4px] rounded-xl blur-md" style={{ background: tintBg }} />
          <div className={`relative w-full h-full rounded-xl ${GLASS_BASE} flex items-center justify-center ${tintText}`}>
            <span className="absolute inset-x-1.5 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            {icon}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white tracking-tight">{title}</div>
          <div className="text-[11px] text-white/55 mt-0.5" dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      </div>
    </div>
  );
}
