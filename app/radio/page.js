'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, Music2, Play, PhoneOff, Loader2, Volume2, VolumeX, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ──────────────────────────────────────────────────────────── */
/*  UTILS                                                       */
/* ──────────────────────────────────────────────────────────── */

// Fisher–Yates Shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s) {
  if (!Number.isFinite(s) || s < 0) return '00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

/* ──────────────────────────────────────────────────────────── */
/*  FAUX AUDIO WAVE (CSS only, berührt NICHT den AudioContext)  */
/*  → Wichtig für Background-Playback auf iOS/Android PWAs.     */
/* ──────────────────────────────────────────────────────────── */

function LiveAudioWave({ playing, bars = 9 }) {
  return (
    <div className="flex items-end justify-center gap-1 h-6">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-gradient-to-t from-fuchsia-400 to-pink-300 ${
            playing ? 'wave-bar-live' : 'wave-bar-idle'
          }`}
          style={{
            height: `${30 + (i % 3) * 20}%`,
            animationDelay: `${(i * 0.12).toFixed(2)}s`,
            animationDuration: `${(0.8 + (i % 4) * 0.15).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                   */
/* ──────────────────────────────────────────────────────────── */

export default function RadioPage() {
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [listening, setListening] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [shuffled, setShuffled] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0); // Gesamt-Zuhör-Dauer in Sekunden

  const audioRef = useRef(null);
  const startedAtRef = useRef(null);
  const currentTrack = shuffled[index] || null;

  // Next-Track Helper (damit Media Session & Ended-Handler beide drauf zugreifen)
  const gotoNextTrack = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= shuffled.length) {
        const reshuffled = shuffleArray(tracks);
        setShuffled(reshuffled);
        return 0;
      }
      return next;
    });
  }, [shuffled, tracks]);

  // Tracks laden – statische tracks.json → API als Fallback
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded = [];
      try {
        const r1 = await fetch('/radio/tracks.json', { cache: 'no-store' });
        if (r1.ok) {
          const d1 = await r1.json();
          if (Array.isArray(d1?.tracks)) loaded = d1.tracks;
        }
      } catch {}
      try {
        const r2 = await fetch('/api/radio/tracks', { cache: 'no-store' });
        if (r2.ok) {
          const d2 = await r2.json();
          if (Array.isArray(d2?.tracks) && d2.tracks.length >= loaded.length) {
            loaded = d2.tracks;
          }
        }
      } catch {}
      if (!cancelled) {
        setTracks(loaded);
        setLoadingTracks(false);
        if (loaded.length === 0) {
          toast.error('Radio-Playlist konnte nicht geladen werden');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Elapsed-Timer (nur wenn wirklich playing)
  useEffect(() => {
    if (!playing) return;
    if (!startedAtRef.current) startedAtRef.current = Date.now() - elapsed * 1000;
    const iv = setInterval(() => {
      const diff = Math.floor((Date.now() - (startedAtRef.current || Date.now())) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(iv);
  }, [playing]); // eslint-disable-line

  // Start-Funktion
  const startListening = useCallback(() => {
    if (!tracks || tracks.length === 0) {
      toast.error('Keine Musik verfügbar');
      return;
    }
    const list = shuffleArray(tracks);
    setShuffled(list);
    setIndex(0);
    setConnecting(true);
    setListening(true);
    setElapsed(0);
    startedAtRef.current = null;
  }, [tracks]);

  // Stop/Verlassen
  const stopListening = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      try {
        el.pause();
        el.src = '';
        el.removeAttribute('src');
        el.load();
      } catch {}
    }
    setListening(false);
    setConnecting(false);
    setPlaying(false);
    setShuffled([]);
    setIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setElapsed(0);
    startedAtRef.current = null;
  }, []);

  // Audio laden + play bei Track-Wechsel
  useEffect(() => {
    if (!listening || !currentTrack) return;
    const el = audioRef.current;
    if (!el) return;

    el.src = currentTrack.url;
    el.volume = muted ? 0 : volume;
    el.muted = muted;
    el.load();

    const playPromise = el.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          setPlaying(true);
          setConnecting(false);
        })
        .catch((err) => {
          console.warn('[radio] autoplay failed', err);
          setPlaying(false);
          setConnecting(false);
          toast.error('Automatische Wiedergabe wurde vom Browser blockiert. Klick erneut auf Radio hören.');
          setListening(false);
        });
    }
  }, [listening, currentTrack, currentTrack?.url]); // eslint-disable-line

  // Volume/Mute
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
    el.muted = muted;
  }, [volume, muted]);

  // Audio-Events (Next-Track on ended, Zeit-Tracking)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { gotoNextTrack(); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [gotoNextTrack]);

  // Media Session API: Zeigt Song-Name + Controls auf Sperrbildschirm / Notification Center / 
  // Bluetooth-Kopfhörer. Ermöglicht Background-Playback auf iOS / Android PWAs.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!listening || !currentTrack) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {}
      return;
    }

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.name,
        artist: 'HHRP Radio',
        album: 'Hamburg Horizon Radio',
        artwork: [
          { src: '/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      });
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    } catch (e) {
      console.warn('[radio] MediaSession metadata error', e);
    }

    // Action Handlers
    const handlers = {
      play: () => {
        const el = audioRef.current;
        if (el) el.play().catch(() => {});
      },
      pause: () => {
        const el = audioRef.current;
        if (el) el.pause();
      },
      stop: () => stopListening(),
      // Keine Seek/Skip-Actions: User soll nur zuhören (kein Vorspulen)
    };
    const unsupported = [];
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        unsupported.push(action);
      }
    }
    // Seek/next/previous explizit DEAKTIVIEREN (falls Browser sie sonst zeigt)
    for (const action of ['seekto', 'seekbackward', 'seekforward', 'nexttrack', 'previoustrack']) {
      try { navigator.mediaSession.setActionHandler(action, null); } catch {}
    }

    return () => {
      for (const action of Object.keys(handlers)) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      }
    };
  }, [listening, currentTrack, playing]); // eslint-disable-line

  // Seek blockieren (User darf nicht innerhalb des Songs springen)
  const lastTimeRef = useRef(0);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onSeeking = () => {
      const diff = Math.abs((el.currentTime || 0) - lastTimeRef.current);
      if (diff > 2 && listening) el.currentTime = lastTimeRef.current;
    };
    const onTime = () => { lastTimeRef.current = el.currentTime || 0; };
    el.addEventListener('seeking', onSeeking);
    el.addEventListener('timeupdate', onTime);
    return () => {
      el.removeEventListener('seeking', onSeeking);
      el.removeEventListener('timeupdate', onTime);
    };
  }, [listening]);

  // Cleanup
  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) { try { el.pause(); el.src = ''; } catch {} }
    };
  }, []);

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <>
      {/* Hidden Audio Element - playsInline für iOS Background-Playback */}
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        x-webkit-airplay="allow"
      />

      {/* Animated Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-500/[0.08] blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/[0.06] blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-pink-500/[0.05] blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 min-h-screen text-white pt-16 sm:pt-20 pb-16 px-3 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl mb-4">
              <Radio className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="text-xs font-medium text-white/70 tracking-wide">HHRP Radio</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              Hamburg Horizon Radio
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/50 max-w-lg mx-auto">
              Lehn dich zurück und lass die Musik laufen.
            </p>
          </div>

          {loadingTracks ? (
            <LoadingCard />
          ) : tracks.length === 0 ? (
            <EmptyCard />
          ) : !listening ? (
            <StartCard onStart={startListening} />
          ) : connecting ? (
            <ConnectingCard onCancel={stopListening} />
          ) : (
            <NowPlayingCard
              track={currentTrack}
              playing={playing}
              elapsed={elapsed}
              volume={volume}
              setVolume={setVolume}
              muted={muted}
              setMuted={setMuted}
              onStop={stopListening}
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }

        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1); }
        }
        .wave-bar { animation: wave-bar 1s ease-in-out infinite; transform-origin: bottom; }

        @keyframes wave-live {
          0% { transform: scaleY(0.3); }
          25% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
          75% { transform: scaleY(0.9); }
          100% { transform: scaleY(0.3); }
        }
        .wave-bar-live {
          animation: wave-live 0.9s ease-in-out infinite;
          transform-origin: bottom;
        }
        .wave-bar-idle {
          opacity: 0.5;
          transform: scaleY(0.5);
          transform-origin: bottom;
        }

        input[type="range"].volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #f0abfc, #fbbf24);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.85);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        input[type="range"].volume-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #f0abfc, #fbbf24);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.85);
        }
      `}</style>
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  CARD SHELL (wiederverwendbar, Voice-Support-Look)           */
/* ──────────────────────────────────────────────────────────── */

function CardShell({ children, glowColor = 'fuchsia' }) {
  const glowMap = {
    fuchsia: 'bg-fuchsia-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
    slate: 'bg-slate-500/10',
  };
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] ${glowMap[glowColor]} rounded-full blur-3xl`} />
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  LOADING / EMPTY                                             */
/* ──────────────────────────────────────────────────────────── */

function LoadingCard() {
  return (
    <CardShell glowColor="slate">
      <div className="relative p-10 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-fuchsia-300 animate-spin" />
        <p className="text-xs text-white/40 uppercase tracking-widest">Lade Playlist…</p>
      </div>
    </CardShell>
  );
}

function EmptyCard() {
  return (
    <CardShell glowColor="slate">
      <div className="relative p-8 sm:p-10 text-center space-y-4">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 rounded-3xl blur-xl" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 border border-white/[0.12] flex items-center justify-center backdrop-blur-xl">
            <Music2 className="w-8 h-8 text-fuchsia-200" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Radio aktuell offline</h2>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Aktuell läuft kein Stream. Bitte versuch es später erneut.
          </p>
        </div>
      </div>
    </CardShell>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  START CARD (Voice-Support-Layout)                           */
/* ──────────────────────────────────────────────────────────── */

function StartCard({ onStart }) {
  return (
    <CardShell glowColor="fuchsia">
      <div className="relative p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Status Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative w-2.5 h-2.5 rounded-full bg-fuchsia-400/80" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              Bereit
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>00:00</span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 blur-2xl animate-pulse" />
            <div className="absolute inset-3 rounded-full border border-fuchsia-400/20" />
            <div className="absolute inset-6 rounded-full border border-fuchsia-400/15" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <Radio className="w-9 h-9 sm:w-11 sm:h-11 text-fuchsia-200" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Radio starten
            </h2>
            <p className="text-sm text-white/50 max-w-sm mx-auto">
              Klick auf Play und lass dich überraschen, was gerade läuft.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStart}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 hover:from-fuchsia-400 hover:via-pink-400 hover:to-amber-300 text-black shadow-xl shadow-fuchsia-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play className="w-5 h-5 mr-2" fill="currentColor" />
          HHRP Radio hören
        </Button>
      </div>
    </CardShell>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  CONNECTING CARD (Voice-Support-Waiting-Stil)                */
/* ──────────────────────────────────────────────────────────── */

function ConnectingCard({ onCancel }) {
  return (
    <CardShell glowColor="amber">
      <div className="relative p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Status Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse">
              <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
              Verbindet
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>00:00</span>
          </div>
        </div>

        {/* Hero mit pulsierenden Ringen (wie Voice Support Waiting) */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 blur-2xl animate-pulse" />
            <div className="absolute inset-3 rounded-full border border-fuchsia-400/25 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-6 rounded-full border border-fuchsia-400/35 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <Radio className="w-9 h-9 sm:w-11 sm:h-11 text-fuchsia-200" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Verbinde mich mit dem HHRP Radio
            </h2>
            <p className="text-sm text-white/50 max-w-sm mx-auto inline-flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Bitte warten…
            </p>
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full h-12 rounded-2xl font-semibold bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.1] text-white/70 hover:text-white transition"
        >
          Abbrechen
        </Button>
      </div>
    </CardShell>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  NOW PLAYING CARD (Voice-Support-Active-Stil)                */
/* ──────────────────────────────────────────────────────────── */

function NowPlayingCard({
  track, playing, elapsed,
  volume, setVolume, muted, setMuted, onStop,
}) {

  return (
    <CardShell glowColor="fuchsia">
      <div className="relative p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Status Header (On Air + Elapsed Time) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative w-2.5 h-2.5 rounded-full bg-fuchsia-400">
              <span className="absolute inset-0 rounded-full bg-fuchsia-400 animate-ping opacity-60" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              On Air
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Hero Visual (pulsierende Ringe um Radio-Icon, wie Voice Support Active) */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center">
                <Radio className="w-10 h-10 text-fuchsia-200" />
              </div>
              {playing && (
                <div className="absolute inset-0 rounded-full border-2 border-fuchsia-400/30 animate-ping" style={{ animationDuration: '2s' }} />
              )}
            </div>
          </div>

          {/* Live Wave (echt, basierend auf Audio) */}
          {playing && (
            <LiveAudioWave playing={playing} bars={9} />
          )}
          {!playing && (
            <div className="flex items-end gap-1 h-6">
              {[0.6, 0.9, 0.7, 1, 0.8, 1, 0.6, 0.9, 0.7].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-fuchsia-400/50 to-pink-300/50 rounded-full wave-bar"
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          )}

          {/* Track Name */}
          <div className="space-y-1.5 max-w-full px-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              {track?.name || '—'}
            </h2>
            <p className="text-sm text-white/50">
              {playing ? 'Läuft gerade' : 'Lädt…'}
            </p>
            <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-black/30 border border-white/[0.06] text-[11px] font-medium uppercase tracking-wider ${playing ? 'text-fuchsia-200' : 'text-amber-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${playing ? 'bg-fuchsia-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              <span>{playing ? 'Live' : 'Buffering'}</span>
            </div>
          </div>
        </div>

        {/* Progress-Bar (read-only) */}
        <div className="rounded-2xl bg-black/20 border border-white/[0.06] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative w-2 h-2 rounded-full bg-fuchsia-400">
              <span className="absolute inset-0 rounded-full bg-fuchsia-400 animate-ping opacity-70" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
              Live-Übertragung
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs font-mono tabular-nums">
            <Radio className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>HHRP · FM</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="rounded-2xl bg-black/20 border border-white/[0.06] p-4 flex items-center gap-3">
          <button
            onClick={() => setMuted(!muted)}
            className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white flex items-center justify-center transition flex-shrink-0"
            title={muted ? 'Ton an' : 'Stumm'}
            aria-label={muted ? 'Ton an' : 'Stumm'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (v > 0 && muted) setMuted(false);
            }}
            className="volume-slider flex-1 h-1 appearance-none rounded-full bg-white/[0.1] accent-fuchsia-400 cursor-pointer"
          />
          <div className="w-10 text-right text-[11px] font-mono text-white/50 tabular-nums">
            {Math.round((muted ? 0 : volume) * 100)}%
          </div>
        </div>

        {/* Stop Button */}
        <Button
          onClick={onStop}
          className="w-full h-14 rounded-2xl px-6 font-semibold bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:via-red-500 hover:to-red-600 text-white shadow-xl shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          Radio verlassen
        </Button>
      </div>
    </CardShell>
  );
}
