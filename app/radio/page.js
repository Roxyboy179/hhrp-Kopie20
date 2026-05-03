'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, Music2, Play, PhoneOff, Loader2, Volume2, VolumeX,
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
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/* ──────────────────────────────────────────────────────────── */
/*  AUDIO WAVE (Canvas-basiert, zeigt Remote-Audio-Level)       */
/* ──────────────────────────────────────────────────────────── */

function LiveAudioWave({ audioEl, playing, bars = 12 }) {
  const [levels, setLevels] = useState(() => Array(bars).fill(0.2));
  const rafRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const srcRef = useRef(null);

  useEffect(() => {
    if (!audioEl || !playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    try {
      if (!ctxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctxRef.current = new AudioCtx();
      }
      if (!srcRef.current) {
        srcRef.current = ctxRef.current.createMediaElementSource(audioEl);
        analyserRef.current = ctxRef.current.createAnalyser();
        analyserRef.current.fftSize = 64;
        srcRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctxRef.current.destination);
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
    } catch (e) {
      // MediaElementSource kann nur einmal pro Element erstellt werden – bei HMR ggf. fallback
      console.warn('[radio] audio analyser init failed', e);
      return;
    }

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.max(1, Math.floor(data.length / bars));

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const next = [];
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += data[i * step + j] || 0;
        }
        const avg = sum / step / 255;
        next.push(Math.max(0.12, Math.min(1, avg * 1.5)));
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioEl, playing, bars]);

  return (
    <div className="flex items-end justify-center gap-1 h-14 sm:h-16">
      {levels.map((v, i) => (
        <span
          key={i}
          className="w-1.5 sm:w-2 rounded-full bg-gradient-to-t from-fuchsia-400 via-pink-400 to-amber-300 transition-all duration-75"
          style={{ height: `${Math.round(v * 100)}%` }}
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
  const [shuffled, setShuffled] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loops, setLoops] = useState(0); // Wie oft Playlist neu gemischt wurde

  const audioRef = useRef(null);
  const [connecting, setConnecting] = useState(false); // "Verbinde mit HHRP Radio…"

  // Tracks laden – zuerst statische tracks.json (immer verfügbar, auch auf jedem Deploy),
  // dann die API (für frisch hinzugefügte Tracks ohne Rebuild).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded = [];
      // 1) Statische JSON aus /public/radio/tracks.json versuchen
      try {
        const r1 = await fetch('/radio/tracks.json', { cache: 'no-store' });
        if (r1.ok) {
          const d1 = await r1.json();
          if (Array.isArray(d1?.tracks)) loaded = d1.tracks;
        }
      } catch {}

      // 2) API-Endpoint – falls er mehr Tracks kennt (neu hinzugefügte Dateien),
      //    verwende die API-Liste.
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

  const currentTrack = shuffled[index] || null;

  // Start-Funktion: Shuffle + Play (mit "Verbinde mich…" Phase)
  const startListening = useCallback(async () => {
    if (!tracks || tracks.length === 0) {
      toast.error('Keine Musik verfügbar');
      return;
    }
    const list = shuffleArray(tracks);
    setShuffled(list);
    setIndex(0);
    setLoops(0);
    setConnecting(true);
    setListening(true);
    // Audio-Element wird im Effect gestartet, da sich src erst dann ändert
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
    setLoops(0);
  }, []);

  // Bei Wechsel des current-Tracks: Audio laden + play
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

  // Volume/Mute ändern
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
    el.muted = muted;
  }, [volume, muted]);

  // Audio-Events
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      // Nächster Track; wenn am Ende, neue Shuffle-Runde
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= shuffled.length) {
          // Playlist komplett durch → neu mischen
          const reshuffled = shuffleArray(tracks);
          setShuffled(reshuffled);
          setLoops((l) => l + 1);
          return 0;
        }
        return next;
      });
    };

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
  }, [shuffled, tracks]);

  // Verhindern, dass User pausiert/spult (Audio-Element hat keine UI-Controls,
  // aber zur Sicherheit: wenn pausiert wird (z.B. systemseitig), weiter abspielen solange listening)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPause = () => {
      if (listening && !el.ended) {
        // Kleiner Delay, dann versuchen, wieder zu starten (wenn es wirklich ungewollt war)
        setTimeout(() => {
          if (listening && el.paused && !el.ended) {
            el.play().catch(() => {});
          }
        }, 200);
      }
    };
    el.addEventListener('pause', onPause);
    return () => el.removeEventListener('pause', onPause);
  }, [listening]);

  // Seek blockieren: wenn currentTime geändert wird, zurücksetzen (nur gegen manuelle Browser-Versuche)
  const lastTimeRef = useRef(0);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onSeeking = () => {
      // Erlauben nur natürliche Wiedergabe: diff <= 2s
      const diff = Math.abs((el.currentTime || 0) - lastTimeRef.current);
      if (diff > 2 && listening) {
        el.currentTime = lastTimeRef.current;
      }
    };
    const onTime = () => {
      lastTimeRef.current = el.currentTime || 0;
    };
    el.addEventListener('seeking', onSeeking);
    el.addEventListener('timeupdate', onTime);
    return () => {
      el.removeEventListener('seeking', onSeeking);
      el.removeEventListener('timeupdate', onTime);
    };
  }, [listening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        try { el.pause(); el.src = ''; } catch {}
      }
    };
  }, []);

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <>
      {/* Hidden Audio Element (keine Controls für User!) */}
      <audio ref={audioRef} preload="auto" />

      {/* Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-500/[0.08] blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/[0.06] blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-pink-500/[0.05] blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 min-h-screen text-white pt-16 sm:pt-20 pb-16 px-3 sm:px-6">
        <div className="max-w-3xl mx-auto">
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
              Lehn dich zurück und lass die Musik laufen – zufällige Playlist, rund um die Uhr.
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
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              setVolume={setVolume}
              muted={muted}
              setMuted={setMuted}
              onStop={stopListening}
              audioEl={audioRef.current}
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

        @keyframes disc-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .disc-spin { animation: disc-spin 18s linear infinite; }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  SUB-COMPONENTS                                              */
/* ──────────────────────────────────────────────────────────── */

function LoadingCard() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      <div className="p-10 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-fuchsia-300 animate-spin" />
        <p className="text-xs text-white/40 uppercase tracking-widest">Lade Playlist…</p>
      </div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      <div className="p-8 sm:p-10 text-center space-y-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 rounded-3xl blur-xl" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Music2 className="w-8 h-8 text-fuchsia-200" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Noch keine Musik</h2>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Im Ordner <code className="font-mono text-fuchsia-300">/public/radio/</code> liegen
            aktuell keine MP3-Dateien. Lege einfach welche rein – sie erscheinen automatisch.
          </p>
        </div>
      </div>
    </div>
  );
}

function StartCard({ onStart }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-10 space-y-6">
        {/* Icon + Title (wie Voice Support) */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/40 to-amber-500/40 rounded-2xl blur-lg" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 border border-white/[0.12] flex items-center justify-center backdrop-blur-xl">
              <Radio className="w-6 h-6 text-fuchsia-200" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-white leading-tight">
              Radio starten
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Lehn dich zurück und genieß die Musik.
            </p>
          </div>
        </div>

        {/* Hero Disc (wie Voice Support Hero) */}
        <div className="flex flex-col items-center text-center space-y-4 py-4 sm:py-6">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/25 to-amber-500/25 blur-2xl animate-pulse" />
            <div className="absolute inset-3 rounded-full border border-fuchsia-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-6 rounded-full border border-fuchsia-400/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <Radio className="w-9 h-9 sm:w-11 sm:h-11 text-fuchsia-200" />
            </div>
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
    </div>
  );
}

function ConnectingCard({ onCancel }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Status Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative w-2.5 h-2.5 rounded-full bg-amber-400">
              <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300">
              Verbinde…
            </span>
          </div>
        </div>

        {/* Pulsing Hero (exakt Voice-Support-Stil) */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 blur-2xl animate-pulse" />
            <div className="absolute inset-3 rounded-full border border-fuchsia-400/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-6 rounded-full border border-fuchsia-400/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 border border-white/[0.15] backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <Radio className="w-9 h-9 sm:w-11 sm:h-11 text-fuchsia-200" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Verbinde mich mit dem HHRP Radio
            </h2>
            <p className="text-sm text-white/50 max-w-sm mx-auto inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Bitte warten…
            </p>
          </div>
        </div>

        {/* Abbrechen Button */}
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full h-12 rounded-2xl font-semibold bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.1] text-white/70 hover:text-white transition"
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

function NowPlayingCard({
  track, playing, currentTime, duration,
  volume, setVolume, muted, setMuted, onStop, audioEl,
}) {
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Status-Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative w-2.5 h-2.5 rounded-full bg-fuchsia-400">
              <span className="absolute inset-0 rounded-full bg-fuchsia-400 animate-ping opacity-60" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              On Air
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-fuchsia-200 text-[11px] font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            <span>Live</span>
          </div>
        </div>

        {/* Hero Disc (rotierend wenn playing) */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-40 h-40 sm:w-52 sm:h-52">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-amber-500/30 blur-2xl animate-pulse" />
            <div className={`relative w-full h-full rounded-full bg-black border border-white/20 shadow-2xl flex items-center justify-center ${playing ? 'disc-spin' : ''}`}>
              <div className="absolute inset-3 rounded-full border border-white/10" />
              <div className="absolute inset-6 rounded-full border border-white/10" />
              <div className="absolute inset-10 rounded-full border border-white/10" />
              <div className="absolute inset-16 rounded-full border border-white/10" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-inner">
                <Radio className="w-9 h-9 text-black/80" strokeWidth={2.2} />
              </div>
              <div className="absolute w-2 h-2 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Live Wave */}
          <LiveAudioWave audioEl={audioEl} playing={playing} bars={14} />

          {/* Track Name */}
          <div className="space-y-1.5 max-w-full px-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-300/80">
              Jetzt läuft
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              {track?.name || '—'}
            </h2>
            <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-black/30 border border-white/[0.06] text-[11px] font-medium uppercase tracking-wider text-fuchsia-200">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              <span>{playing ? 'Live' : 'Lädt…'}</span>
            </div>
          </div>
        </div>

        {/* Progress-Bar (read-only, keine Interaktion) */}
        <div className="space-y-2">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="rounded-2xl bg-black/20 border border-white/[0.06] p-4 flex items-center gap-3">
          <button
            onClick={() => setMuted(!muted)}
            className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 flex items-center justify-center transition"
            title={muted ? 'Ton an' : 'Stumm'}
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
            className="flex-1 h-1 appearance-none rounded-full bg-white/[0.1] accent-fuchsia-400 cursor-pointer"
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

        {/* Hinweis */}
        <p className="text-center text-[11px] text-white/30 leading-relaxed">
          Kein Pausieren, kein Vorspulen – die Musik läuft durch. Viel Spaß beim Hören!
        </p>
      </div>
    </div>
  );
}
