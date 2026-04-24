'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, X, Wrench, Calendar, Flag, AlertTriangle } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────
// Countdown Logic
// ──────────────────────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [diff, setDiff] = useState(() => {
    if (!targetDate) return null;
    return new Date(targetDate).getTime() - Date.now();
  });

  useEffect(() => {
    if (!targetDate) return;
    const update = () => setDiff(new Date(targetDate).getTime() - Date.now());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (diff === null) return null;

  const parts = {
    isStarted: diff <= 0,
    totalMs: diff,
    days:    Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours:   Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
    seconds: Math.max(0, Math.floor((diff % (1000 * 60)) / 1000)),
  };
  return parts;
}

function formatCountdown(cd) {
  if (!cd) return '';
  if (cd.isStarted) return 'Wartung läuft';
  if (cd.days > 0) {
    return `${cd.days}d ${cd.hours}h`;
  }
  if (cd.hours > 0) {
    return `${cd.hours}h ${cd.minutes}m`;
  }
  if (cd.minutes > 0) {
    return `${cd.minutes}m ${String(cd.seconds).padStart(2, '0')}s`;
  }
  return `${cd.seconds}s`;
}

// ──────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────
export function WartungsBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dismissal-Key basiert auf Start-Zeitpunkt, damit User pro Wartung 1x wegklicken kann
  const dismissKey = useMemo(() => {
    if (!status?.wartung_start) return 'hhrp-wartung-dismissed-default';
    return `hhrp-wartung-dismissed-${status.wartung_start}`;
  }, [status?.wartung_start]);

  useEffect(() => {
    setMounted(true);
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Prüfe Dismissal für diese spezifische Wartung
  useEffect(() => {
    if (typeof window === 'undefined' || !status?.wartung_start) return;
    const stored = localStorage.getItem(dismissKey);
    setDismissed(stored === '1');
  }, [dismissKey, status?.wartung_start]);

  const countdown = useCountdown(status?.wartung_start);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system-status/public', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Fehler beim Laden des Wartungsstatus:', e);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(dismissKey, '1');
    }
  };

  if (!mounted || !status?.geplante_wartung || dismissed) return null;

  // Urgency-Level basierend auf Countdown
  const isActive = countdown?.isStarted;
  const isUrgent = !isActive && countdown && countdown.totalMs < 15 * 60 * 1000; // < 15 Min
  const isSoon = !isActive && !isUrgent && countdown && countdown.totalMs < 60 * 60 * 1000; // < 1 Std

  // Farb-Akzente je nach Dringlichkeit (bleiben warm/rot, da bedeutungsvoll)
  const accent = isActive
    ? { primary: 'rgba(239, 68, 68, 0.95)',  soft: 'rgba(239, 68, 68, 0.14)', softer: 'rgba(239, 68, 68, 0.06)', dot: '#ef4444' }
    : isUrgent
      ? { primary: 'rgba(249, 115, 22, 0.95)', soft: 'rgba(249, 115, 22, 0.14)', softer: 'rgba(249, 115, 22, 0.06)', dot: '#f97316' }
      : isSoon
        ? { primary: 'rgba(234, 179, 8, 0.95)',  soft: 'rgba(234, 179, 8, 0.14)',  softer: 'rgba(234, 179, 8, 0.06)',  dot: '#eab308' }
        : { primary: 'rgba(255, 255, 255, 0.82)', soft: 'rgba(255, 255, 255, 0.06)', softer: 'rgba(255, 255, 255, 0.02)', dot: '#e5e5e5' };

  const title = isActive
    ? 'Wartungsarbeiten laufen'
    : isUrgent
      ? 'Wartung steht kurz bevor'
      : 'Geplante Wartungsarbeiten';

  return (
    <div
      className="fixed top-0 left-0 right-0 w-full z-[100] animate-[wartung-slide-down_0.4s_cubic-bezier(0.22,1,0.36,1)]"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        className="w-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(14,14,16,0.92) 0%, rgba(10,10,12,0.96) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
        }}
      >
        {/* Subtle warm gradient overlay for meaning */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, ${accent.softer} 0%, transparent 30%, transparent 70%, ${accent.softer} 100%)`,
          }}
        />

        {/* Top accent line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent.primary}, transparent)`,
            opacity: 0.5,
          }}
        />

        {/* Urgency shimmer if < 15 Min or active */}
        {(isUrgent || isActive) && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accent.soft} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'wartung-shimmer 3s linear infinite',
            }}
          />
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3 relative">
          <div className="flex items-center gap-3">
            {/* Icon Bubble */}
            <div
              className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border relative"
              style={{
                background: `linear-gradient(135deg, ${accent.soft}, rgba(255,255,255,0.02))`,
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {isActive ? (
                <AlertTriangle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: accent.primary }} />
              ) : (
                <Wrench className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: accent.primary }} />
              )}
              {/* Pulsing dot for urgency */}
              {(isUrgent || isActive) && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse ring-2 ring-black/80"
                  style={{ background: accent.dot, boxShadow: `0 0 8px ${accent.primary}` }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12.5px] sm:text-[13.5px] font-semibold text-white tracking-tight">
                  {title}
                </span>

                {/* Countdown badge */}
                {countdown && !isActive && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold border tabular-nums"
                    style={{
                      color: accent.primary,
                      background: accent.soft,
                      borderColor: `${accent.primary.replace('0.95', '0.25')}`,
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    <span>in {formatCountdown(countdown)}</span>
                  </span>
                )}

                {/* Active badge */}
                {isActive && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold border"
                    style={{
                      color: accent.primary,
                      background: accent.soft,
                      borderColor: `${accent.primary.replace('0.95', '0.25')}`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent.dot, boxShadow: `0 0 6px ${accent.primary}` }} />
                    <span>LIVE</span>
                  </span>
                )}
              </div>

              {/* Message — hidden on very small screens if too long */}
              <p className="text-[11px] sm:text-[12px] text-white/55 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-1">
                {status.wartung_nachricht || 'Wir führen Wartungsarbeiten durch, um unseren Service zu verbessern.'}
              </p>

              {/* Date Info (desktop only – mobile stays compact) */}
              {(status.wartung_start || status.wartung_ende) && (
                <div className="hidden sm:flex flex-wrap items-center gap-3 mt-1 text-[11px] text-white/40 tabular-nums">
                  {status.wartung_start && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 flex-shrink-0 text-white/30" />
                      <span className="whitespace-nowrap">
                        {new Date(status.wartung_start).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} Uhr
                      </span>
                    </span>
                  )}
                  {status.wartung_ende && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="flex items-center gap-1.5">
                        <Flag className="w-3 h-3 flex-shrink-0 text-white/30" />
                        <span className="whitespace-nowrap">
                          bis {new Date(status.wartung_ende).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} Uhr
                        </span>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.06] active:scale-90"
              aria-label="Banner schließen"
            >
              <X className="w-3.5 h-3.5 text-white/55 hover:text-white/90 transition-colors" />
            </button>
          </div>

          {/* Countdown Progress Bar (bottom, only if < 1h remaining) */}
          {countdown && !isActive && countdown.totalMs < 60 * 60 * 1000 && (
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div
                className="h-full transition-[width] duration-1000 linear"
                style={{
                  width: `${Math.max(0, Math.min(100, (countdown.totalMs / (60 * 60 * 1000)) * 100))}%`,
                  background: `linear-gradient(90deg, ${accent.primary}, ${accent.primary.replace('0.95', '0.5')})`,
                  boxShadow: `0 0 8px ${accent.primary}`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
