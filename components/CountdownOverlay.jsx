'use client';

/**
 * CountdownOverlay
 * ----------------
 * Vollbild-Cooldown-System für Hamburg Horizon RP.
 *
 * Phasen:
 *   1. "cooldown"  – vom 01.05.2026 00:00 bis 04.05.2026 00:00 (Europe/Berlin)
 *                    -> Live-Countdown, Musik (M83 – Outro), nicht schließbar
 *   2. "goodbye"   – 20s nach Ablauf des Cooldowns
 *                    -> "Goodbye V0.0.1 Beta" Verabschiedung mit Animation
 *   3. "welcome"   – 20s nach Goodbye
 *                    -> "Hello V1" Willkommen mit Animation & Effekten
 *   4. null        – Overlay aus, normale Seite sichtbar
 *
 * Test-Query-Parameter (für die Vorschau):
 *   ?cooldown=preview-cooldown
 *   ?cooldown=preview-goodbye
 *   ?cooldown=preview-welcome
 *   ?cooldown=skip               (überspringt das Overlay komplett)
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Sparkles, Heart, Rocket, Music2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

// CEST = UTC+2 im Mai. 01.05.2026 00:00 CEST  =>  30.04.2026 22:00 UTC
const COOLDOWN_START_UTC = Date.UTC(2026, 3, 30, 22, 0, 0); // April = Monat 3 (0-indexed)
// 04.05.2026 00:00 CEST  =>  03.05.2026 22:00 UTC
const COOLDOWN_END_UTC   = Date.UTC(2026, 4, 3, 22, 0, 0);  // Mai = Monat 4 (0-indexed)

const GOODBYE_DURATION_MS = 20_000;
const WELCOME_DURATION_MS = 20_000;

const LS_GOODBYE_SEEN = 'hhrp-cooldown-goodbye-seen';
const LS_WELCOME_SEEN = 'hhrp-cooldown-welcome-seen';

const AUDIO_SRC = '/audio/m83-outro.mp3';

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

const padStart2 = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const formatDuration = (ms) => {
  if (ms <= 0) return { d: '00', h: '00', m: '00', s: '00', total: 0 };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d: padStart2(d), h: padStart2(h), m: padStart2(m), s: padStart2(s), total: ms };
};

const getQueryParam = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
};

const safeLSGet = (k) => {
  try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; }
};
const safeLSSet = (k, v) => {
  try { if (typeof window !== 'undefined') localStorage.setItem(k, v); } catch {}
};

// ---------------------------------------------------------------------------
// Komponente
// ---------------------------------------------------------------------------

export default function CountdownOverlay() {
  const [now, setNow] = useState(() => Date.now());
  const [phase, setPhase] = useState(null); // 'cooldown' | 'goodbye' | 'welcome' | null
  const [phaseStart, setPhaseStart] = useState(null); // timestamp wann die aktuelle Phase begann
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef(null);
  const previewRef = useRef(null); // 'preview-cooldown' | 'preview-goodbye' | 'preview-welcome' | 'skip' | null
  const interactionCleanupRef = useRef(null);

  // -----------------------------------------------------------------------
  // Initialisierung (Phase ermitteln)
  // -----------------------------------------------------------------------
  useEffect(() => {
    setMounted(true);
    const preview = getQueryParam('cooldown');
    previewRef.current = preview;

    if (preview === 'skip') {
      setPhase(null);
      return;
    }

    if (preview === 'preview-cooldown') {
      setPhase('cooldown');
      setPhaseStart(Date.now());
      return;
    }
    if (preview === 'preview-goodbye') {
      setPhase('goodbye');
      setPhaseStart(Date.now());
      return;
    }
    if (preview === 'preview-welcome') {
      setPhase('welcome');
      setPhaseStart(Date.now());
      return;
    }

    // Echte Logik
    const t = Date.now();
    if (t < COOLDOWN_START_UTC) {
      // Vor dem Cooldown: kein Overlay
      setPhase(null);
      return;
    }
    if (t >= COOLDOWN_START_UTC && t < COOLDOWN_END_UTC) {
      setPhase('cooldown');
      setPhaseStart(COOLDOWN_START_UTC);
      return;
    }
    // Nach Cooldown: prüfen, ob Goodbye/Welcome bereits gesehen wurde
    const goodbyeSeen = safeLSGet(LS_GOODBYE_SEEN) === '1';
    const welcomeSeen = safeLSGet(LS_WELCOME_SEEN) === '1';

    if (!goodbyeSeen) {
      setPhase('goodbye');
      setPhaseStart(Date.now());
    } else if (!welcomeSeen) {
      setPhase('welcome');
      setPhaseStart(Date.now());
    } else {
      setPhase(null);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Tick
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!phase) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase]);

  // -----------------------------------------------------------------------
  // Phasen-Übergänge
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!phase) return;
    const isPreview = !!previewRef.current && previewRef.current.startsWith('preview-');

    if (phase === 'cooldown') {
      // Wenn Cooldown abläuft -> goodbye
      if (!isPreview && Date.now() >= COOLDOWN_END_UTC) {
        setPhase('goodbye');
        setPhaseStart(Date.now());
      }
    } else if (phase === 'goodbye') {
      if (phaseStart && Date.now() - phaseStart >= GOODBYE_DURATION_MS) {
        if (!isPreview) safeLSSet(LS_GOODBYE_SEEN, '1');
        setPhase('welcome');
        setPhaseStart(Date.now());
      }
    } else if (phase === 'welcome') {
      if (phaseStart && Date.now() - phaseStart >= WELCOME_DURATION_MS) {
        if (!isPreview) safeLSSet(LS_WELCOME_SEEN, '1');
        setPhase(null);
      }
    }
  }, [now, phase, phaseStart]);

  // -----------------------------------------------------------------------
  // Body-Scroll während Overlay sperren
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!mounted) return;
    if (phase) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [phase, mounted]);

  // -----------------------------------------------------------------------
  // Musiksteuerung – startet automatisch in der Cooldown-Phase
  // -----------------------------------------------------------------------
  const tryStartMusic = useCallback((opts = {}) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.45;
    // Wenn bereits abspielt, nichts tun
    if (!audio.paused && !audio.ended) {
      setMusicEnabled(true);
      return;
    }
    // Optional: Stummgeschaltet starten (umgeht die meisten Autoplay-Sperren),
    // danach automatisch entstummen.
    const allowMutedFallback = opts.allowMutedFallback !== false;
    audio.muted = false;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          setMusicEnabled(true);
          setMuted(false);
          // Falls schon Listener registriert sind, abräumen
          if (interactionCleanupRef.current) {
            interactionCleanupRef.current();
            interactionCleanupRef.current = null;
          }
        })
        .catch(() => {
          // Erster Versuch (mit Ton) blockiert -> stumm versuchen, dann beim ersten Input entstummen
          if (allowMutedFallback) {
            try {
              audio.muted = true;
              const p2 = audio.play();
              if (p2 && typeof p2.then === 'function') {
                p2.then(() => {
                  setMusicEnabled(true);
                  setMuted(true);
                }).catch(() => {
                  setMusicEnabled(false);
                });
              }
            } catch {
              setMusicEnabled(false);
            }
          } else {
            setMusicEnabled(false);
          }
        });
    }
  }, []);

  // Global silent interaction listeners – erste Berührung/Klick/Tippen aktiviert Audio.
  // Kein sichtbarer Hinweis, kein extra Knopf nötig.
  const attachSilentInteractionListeners = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (interactionCleanupRef.current) return; // bereits aktiv

    const handler = () => {
      const audio = audioRef.current;
      if (!audio) return;
      // Sicherstellen, dass der Sound an ist
      audio.muted = false;
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setMusicEnabled(true);
          setMuted(false);
        }).catch(() => { /* ignorieren – nächster Input versucht es erneut */ });
      } else {
        setMusicEnabled(true);
        setMuted(false);
      }
      // Listener entfernen, wenn erfolgreich oder nach erstem Versuch
      cleanup();
    };

    const events = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll', 'mousemove'];
    const opts = { capture: true, passive: true };
    events.forEach((ev) => window.addEventListener(ev, handler, opts));

    const cleanup = () => {
      events.forEach((ev) => window.removeEventListener(ev, handler, opts));
      interactionCleanupRef.current = null;
    };
    interactionCleanupRef.current = cleanup;
  }, []);

  useEffect(() => {
    if (phase === 'cooldown') {
      // 1) Sofort versuchen abzuspielen (mit Mute-Fallback)
      const t = setTimeout(() => {
        tryStartMusic({ allowMutedFallback: true });
        // 2) Falls noch nicht entstummt: bei erster Interaktion automatisch aktivieren
        attachSilentInteractionListeners();
      }, 150);
      return () => clearTimeout(t);
    }
    // In anderen Phasen Musik stoppen
    if (audioRef.current && phase !== 'cooldown') {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      setMusicEnabled(false);
      if (interactionCleanupRef.current) {
        interactionCleanupRef.current();
        interactionCleanupRef.current = null;
      }
    }
  }, [phase, tryStartMusic, attachSilentInteractionListeners]);

  // Aufräumen beim Unmount
  useEffect(() => {
    return () => {
      if (interactionCleanupRef.current) {
        interactionCleanupRef.current();
        interactionCleanupRef.current = null;
      }
    };
  }, []);

  const toggleMute = useCallback((e) => {
    e?.stopPropagation?.();
    const a = audioRef.current;
    if (!a) return;
    if (!musicEnabled) {
      tryStartMusic({ allowMutedFallback: false });
      return;
    }
    a.muted = !a.muted;
    setMuted(a.muted);
  }, [musicEnabled, tryStartMusic]);

  // -----------------------------------------------------------------------
  // Berechnungen für Render
  // -----------------------------------------------------------------------
  const remaining = useMemo(() => {
    if (phase !== 'cooldown') return formatDuration(0);
    const isPreview = previewRef.current === 'preview-cooldown';
    if (isPreview) {
      // Im Preview: Fake-Countdown ab "jetzt + 2 Tage 03:14:07"
      const fakeEnd = (phaseStart || Date.now()) + 2 * 86400_000 + 3 * 3600_000 + 14 * 60_000 + 7_000;
      return formatDuration(fakeEnd - now);
    }
    return formatDuration(COOLDOWN_END_UTC - now);
  }, [phase, now, phaseStart]);

  const goodbyeProgress = useMemo(() => {
    if (phase !== 'goodbye' || !phaseStart) return 0;
    return Math.min(1, (now - phaseStart) / GOODBYE_DURATION_MS);
  }, [phase, phaseStart, now]);

  const welcomeProgress = useMemo(() => {
    if (phase !== 'welcome' || !phaseStart) return 0;
    return Math.min(1, (now - phaseStart) / WELCOME_DURATION_MS);
  }, [phase, phaseStart, now]);

  // -----------------------------------------------------------------------
  // Sanfte Phasenübergänge (Crossfade) und Overlay-Ein-/Ausblendung
  // -----------------------------------------------------------------------
  const [renderPhase, setRenderPhase] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (phase === renderPhase) return;

    if (phase === null) {
      // Komplettes Overlay sanft ausblenden
      setIsExiting(true);
      const t = setTimeout(() => {
        setRenderPhase(null);
        setIsExiting(false);
      }, 600);
      return () => clearTimeout(t);
    }

    if (renderPhase === null) {
      // Erstes Einblenden
      setRenderPhase(phase);
      setIsExiting(false);
      return;
    }

    // Phasenwechsel -> Crossfade
    setIsExiting(true);
    const t = setTimeout(() => {
      setRenderPhase(phase);
      setIsExiting(false);
    }, 380);
    return () => clearTimeout(t);
  }, [phase, renderPhase]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (!mounted || !renderPhase) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] select-none co-overlay ${isExiting ? 'co-overlay-exit' : 'co-overlay-enter'}`}
      style={{
        background:
          renderPhase === 'welcome'
            ? 'radial-gradient(ellipse at center, #0a1628 0%, #050505 70%)'
            : '#050505',
        WebkitOverflowScrolling: 'touch'
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Persistentes <audio>-Element */}
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" loop playsInline />

      {/* Animierte Hintergrund-Effekte */}
      <BackgroundFx phase={renderPhase} />

      {/* Inhalt nach Phase – mit key remountet bei Phasenwechsel für Crossfade */}
      <div
        key={renderPhase + (isExiting ? '-out' : '-in')}
        className={`relative h-full w-full ${isExiting ? 'co-content-exit' : 'co-content-enter'}`}
      >
        {renderPhase === 'cooldown' && (
          <CooldownContent
            remaining={remaining}
            musicEnabled={musicEnabled}
            muted={muted}
            onToggleMute={toggleMute}
          />
        )}
        {renderPhase === 'goodbye' && <GoodbyeContent progress={goodbyeProgress} />}
        {renderPhase === 'welcome' && <WelcomeContent progress={welcomeProgress} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hintergrund-FX
// ---------------------------------------------------------------------------
function BackgroundFx({ phase }) {
  const isWelcome = phase === 'welcome';
  return (
    <>
      {/* Grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 70%)'
        }}
      />
      {/* Blobs */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: isWelcome
            ? 'radial-gradient(circle, rgba(34,197,94,0.30), transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)',
          animation: 'co-blob 14s ease-in-out infinite'
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[640px] h-[640px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: isWelcome
            ? 'radial-gradient(circle, rgba(59,130,246,0.30), transparent 70%)'
            : 'radial-gradient(circle, rgba(168,85,247,0.22), transparent 70%)',
          animation: 'co-blob 18s ease-in-out infinite reverse'
        }}
      />
      {/* Noise */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Cooldown-Phase
// ---------------------------------------------------------------------------
function CooldownContent({ remaining, musicEnabled, muted, onToggleMute }) {
  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        {/* Logo */}
        <div
          className="relative mb-8 sm:mb-10"

        >
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.45), transparent 70%)',
              filter: 'blur(40px)',
              animation: 'co-pulse-glow 3.5s ease-in-out infinite'
            }}
          />
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)'
            }}
          >
            <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
          </div>
          <div
            aria-hidden
            className="absolute inset-[-10px] rounded-[28px] border border-dashed pointer-events-none"
            style={{ borderColor: 'rgba(99,102,241,0.35)', animation: 'co-spin-slow 22s linear infinite' }}
          />
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
          style={{
            background: 'rgba(99,102,241,0.10)',
            borderColor: 'rgba(99,102,241,0.30)'
            }}
        >
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
          </span>
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-indigo-200">
            Live · Beta-Verabschiedung
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-center text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-3"

        >
          Willkommen bei <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300">HHRP</span>
        </h1>
        <p
          className="text-center text-base sm:text-xl text-white/60 mb-10 sm:mb-12 max-w-2xl"

        >
          Ein neues Kapitel beginnt.
        </p>

        {/* Countdown */}
        <div
          className="grid grid-cols-4 gap-2 sm:gap-4 mb-10 sm:mb-12"

        >
          {[
            { label: 'Tage',     value: remaining.d },
            { label: 'Stunden',  value: remaining.h },
            { label: 'Minuten',  value: remaining.m },
            { label: 'Sekunden', value: remaining.s },
          ].map((seg) => (
            <div
              key={seg.label}
              className="relative w-[74px] sm:w-[120px] md:w-[140px] rounded-2xl px-2 py-3 sm:py-4 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 18px 40px -18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.55), transparent)' }}
              />
              <div className="text-3xl sm:text-5xl md:text-6xl font-bold tabular-nums text-white tracking-tight">
                {seg.value}
              </div>
              <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-white/45 font-semibold mt-1">
                {seg.label}
              </div>
            </div>
          ))}
        </div>

        {/* Story-Karte */}
        <div
          className="relative max-w-2xl w-full rounded-3xl p-6 sm:p-8 mb-8 sm:mb-10 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,28,0.88), rgba(8,8,12,0.92))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 80px -30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04)',
            backdropFilter: 'blur(28px)'
            }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.55), transparent)' }}
          />
          <p className="text-white/80 text-sm sm:text-[15px] leading-relaxed">
            Nach einer erfolgreichen Testphase verabschieden wir uns von unserer ersten Version{' '}
            <span className="font-semibold text-white">V0.0.1 Beta</span>.
            Diese Zeit hat den Grundstein für alles gelegt, was jetzt kommt.
          </p>
          <p className="text-white/80 text-sm sm:text-[15px] leading-relaxed mt-3">
            Mit Stolz arbeiten wir aktuell an unserer ersten vollständigen Version:
          </p>

          <div className="my-5 sm:my-6 flex items-center justify-center">
            <div
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border"
              style={{
                background:
                  'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(34,211,238,0.16), rgba(34,197,94,0.18))',
                borderColor: 'rgba(255,255,255,0.10)'
              }}
            >
              <Rocket className="w-5 h-5 text-white" />
              <div>
                <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                  V1 – Bald verfügbar
                </div>
                <div className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-white/55 font-semibold">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-sm sm:text-[14.5px] leading-relaxed">
            Unsere neue Version bringt Verbesserungen, Stabilität und ein weiterentwickeltes Erlebnis
            für die gesamte Community.
          </p>

          <div
            className="mt-6 p-4 rounded-2xl flex items-start gap-3"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.22)'
            }}
          >
            <Music2 className="w-5 h-5 text-indigo-200 flex-shrink-0 mt-0.5" />
            <p className="text-white/75 text-sm leading-relaxed">
              Zum Abschied der Beta-Phase nutzen wir den Track{' '}
              <span className="text-white font-semibold">„M83 – Outro (Dwayne L)"</span> als
              musikalischen Abschluss dieser Ära – ruhig, emotional und passend für einen Neuanfang.
            </p>
          </div>
        </div>

        {/* Goodbye/Hello Hinweis */}
        <div
          className="text-center mb-2"

        >
          <p className="text-white/85 text-base sm:text-lg">
            Goodbye <span className="font-semibold">V0.0.1 Beta</span> 👋
          </p>
          <p className="text-white text-lg sm:text-xl font-semibold tracking-tight">
            Hello V1
          </p>
          <p className="text-white/45 text-xs sm:text-sm mt-2">
            Bleibt gespannt – der Release steht kurz bevor.
          </p>
        </div>

        {/* Audio-Steuerung – kleiner Mute-Toggle, kein extra Klick zum Starten nötig */}
        <div className="mt-8">
          <button
            onClick={onToggleMute}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(16px)'
            }}
            title={muted ? 'Musik einschalten' : 'Musik stummschalten'}
            aria-label={muted ? 'Musik einschalten' : 'Musik stummschalten'}
          >
            {muted || !musicEnabled ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="tabular-nums">
              M83 – Outro · {muted ? 'stumm' : (musicEnabled ? 'läuft' : 'startet…')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goodbye-Phase (20s)
// ---------------------------------------------------------------------------
function GoodbyeContent({ progress }) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-6">
      {/* Sparkles als kleine schwebende Partikel */}
      <FloatingParticles color="rgba(244,114,182,0.6)" count={18} />

      <div
        className="relative text-center max-w-2xl"

      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
          style={{
            background: 'rgba(244,114,182,0.10)',
            borderColor: 'rgba(244,114,182,0.30)'
            }}
        >
          <Heart className="w-3.5 h-3.5 text-pink-300" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-pink-200">
            Danke für die Beta-Reise
          </span>
        </div>

        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight mb-4"

        >
          Goodbye{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200">
            V0.0.1 Beta
          </span>{' '}
          👋
        </h1>

        <p
          className="text-white/70 text-base sm:text-xl leading-relaxed mb-10"

        >
          Eine Ära geht zu Ende. Danke an alle, die mit uns die ersten Schritte
          gegangen sind – euer Feedback hat alles geprägt, was jetzt kommt.
        </p>

        {/* Animierte Glow-Linie */}
        <div
          className="mx-auto w-40 h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(244,114,182,0.8), transparent)',
            boxShadow: '0 0 20px rgba(244,114,182,0.5)'
            }}
        />
      </div>

      {/* Fortschrittsbalken */}
      <PhaseProgressBar progress={progress} colorFrom="#f472b6" colorTo="#fb923c" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome-Phase (20s)
// ---------------------------------------------------------------------------
function WelcomeContent({ progress }) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-6">
      <FloatingParticles color="rgba(94,234,212,0.6)" count={26} />

      <div
        className="relative text-center max-w-2xl"

      >
        {/* Ring-Logo mit Glow */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6">
          <div
            aria-hidden
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.5), transparent 70%)',
              filter: 'blur(40px)',
              animation: 'co-pulse-glow 2.4s ease-in-out infinite'
            }}
          />
          <div
            className="relative w-full h-full rounded-3xl overflow-hidden border"
            style={{
              borderColor: 'rgba(255,255,255,0.14)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)'
            }}
          >
            <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
          </div>
          <div
            aria-hidden
            className="absolute inset-[-10px] rounded-[28px] border border-dashed"
            style={{ borderColor: 'rgba(34,197,94,0.4)', animation: 'co-spin-slow 18s linear infinite' }}
          />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
          style={{
            background: 'rgba(34,197,94,0.10)',
            borderColor: 'rgba(34,197,94,0.30)'
            }}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-emerald-200">
            Ein neues Kapitel beginnt
          </span>
        </div>

        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-4"

        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300">
            Hello V1
          </span>
        </h1>

        <p
          className="text-white/75 text-base sm:text-xl leading-relaxed mb-2"

        >
          Willkommen in unserer ersten vollständigen Version.
        </p>
        <p
          className="text-white/55 text-sm sm:text-base leading-relaxed mb-10"

        >
          Mehr Stabilität. Mehr Funktionen. Ein weiterentwickeltes Erlebnis für die gesamte Community.
        </p>

        {/* Shimmering Trennlinie */}
        <div
          className="mx-auto w-56 h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(94,234,212,0.9), rgba(99,102,241,0.7), transparent)',
            backgroundSize: '200% 100%',
            animation: 'co-shine 2.6s linear infinite',
            boxShadow: '0 0 20px rgba(94,234,212,0.45)'
          }}
        />
      </div>

      <PhaseProgressBar progress={progress} colorFrom="#34d399" colorTo="#60a5fa" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schwebende Partikel
// ---------------------------------------------------------------------------
function FloatingParticles({ color, count = 20 }) {
  // Stabile Pseudo-Zufallszahlen, damit kein SSR/CSR-Mismatch entsteht
  const items = useMemo(() => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 9301 + 49297;
      const r1 = ((seed * 233280) % 233281) / 233281;
      const r2 = ((seed * 16807) % 2147483647) / 2147483647;
      const r3 = ((seed * 48271) % 2147483647) / 2147483647;
      out.push({
        left: `${(r1 * 100).toFixed(2)}%`,
        top: `${(r2 * 100).toFixed(2)}%`,
        size: 4 + Math.floor(r3 * 6),
        dx: `${(r1 - 0.5) * 240}px`,
        dy: `${(r2 - 0.5) * 240}px`,
        delay: `${(r3 * 6).toFixed(2)}s`,
        dur: `${(4 + r1 * 6).toFixed(2)}s`
      });
    }
    return out;
  }, [count]);

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '9999px',
            background: color,
            boxShadow: `0 0 12px ${color}`,
            ['--dx']: p.dx,
            ['--dy']: p.dy,
            animation: `co-particle ${p.dur} ease-out ${p.delay} infinite`
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase-Progress-Bar (unten)
// ---------------------------------------------------------------------------
function PhaseProgressBar({ progress, colorFrom, colorTo }) {
  return (
    <div
      className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-[min(420px,80vw)]"

    >
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-linear"
          style={{
            width: `${Math.round(progress * 100)}%`,
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
            boxShadow: `0 0 12px ${colorFrom}`
          }}
        />
      </div>
      <div className="mt-2 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-white/40 font-semibold">
        Bitte warten · {Math.max(0, Math.ceil(20 - progress * 20))}s
      </div>
    </div>
  );
}
