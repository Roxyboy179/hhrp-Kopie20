'use client';

import { useState, useEffect } from 'react';
import { Wrench, Clock, AlertTriangle, RefreshCw, Calendar, Flag, CheckCircle2 } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────
// Live Countdown Hook
// ──────────────────────────────────────────────────────────────────────────
function useLiveCountdown(targetDate) {
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

  return {
    isExpired: diff <= 0,
    totalMs: diff,
    days:    Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours:   Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
    seconds: Math.max(0, Math.floor((diff % (1000 * 60)) / 1000)),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Countdown Cell (single numeric block)
// ──────────────────────────────────────────────────────────────────────────
function CountdownCell({ value, label }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-xl min-w-[60px] relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
      />
      <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9.5px] sm:text-[10.5px] text-white/35 uppercase tracking-[0.1em] mt-1.5 font-medium">
        {label}
      </span>
    </div>
  );
}

export default function WartungPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    // Auto-Refresh alle 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-Reload wenn Wartung vorbei
  useEffect(() => {
    if (status && !status.wartungsmodus) {
      // Wartung wurde beendet → Redirect zur Startseite
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  }, [status?.wartungsmodus]);

  const fetchStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/system-status/public?_=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Fehler beim Laden des Wartungsstatus:', e);
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  const countdownToEnd = useLiveCountdown(status?.wartung_ende);
  const isEndingSoon = countdownToEnd && !countdownToEnd.isExpired && countdownToEnd.totalMs < 5 * 60 * 1000;

  // Formatiert Zeitraum "HH:MM Uhr" Format
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' Uhr';
  };

  const message = status?.wartung_nachricht || 'Wir führen gerade Wartungsarbeiten durch, um HHRP noch besser zu machen.';
  const hasEndTime = !!status?.wartung_ende;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: '#050506' }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(234,179,8,0.05), transparent 60%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse 40% 30% at 50% 80%, rgba(249,115,22,0.04), transparent 60%)',
        }}
      />

      {/* Grid Pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-2xl w-full relative animate-[fade-in-up_0.6s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Card Container */}
        <div
          className="rounded-3xl p-7 sm:p-9 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(18,18,20,0.92) 0%, rgba(10,10,12,0.96) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top gradient line */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.4), transparent)',
            }}
          />

          {/* Logo + Icon Header */}
          <div className="flex flex-col items-center text-center">
            {/* Server Logo with animated ring */}
            <div className="relative mb-5">
              {/* Outer pulsing ring */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl animate-ping"
                style={{
                  background: 'rgba(234,179,8,0.15)',
                  animationDuration: '2.5s',
                }}
              />
              <div
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center border overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(249,115,22,0.08))',
                  borderColor: 'rgba(234,179,8,0.25)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(234,179,8,0.1)',
                }}
              >
                <img src="/logo.webp" alt="HHRP" className="w-full h-full object-cover" />
              </div>

              {/* Wrench badge (bottom-right) */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-xl flex items-center justify-center border-2 animate-[wrench-spin_4s_ease-in-out_infinite]"
                style={{
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.9), rgba(249,115,22,0.9))',
                  borderColor: '#050506',
                  boxShadow: '0 4px 12px rgba(234,179,8,0.35)',
                }}
              >
                <Wrench className="w-4 h-4 text-black/85" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Wartungsarbeiten
            </h1>

            {/* Subtitle pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-3 border"
              style={{
                background: 'rgba(234,179,8,0.08)',
                borderColor: 'rgba(234,179,8,0.22)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#eab308', boxShadow: '0 0 6px #eab308' }}
              />
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgba(253,224,71,0.95)' }}>
                Live · Wir arbeiten daran
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="mt-7 text-center">
            <p className="text-[14.5px] sm:text-[15px] text-white/70 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Live Countdown (only if end time exists and not expired) */}
          {hasEndTime && countdownToEnd && !countdownToEnd.isExpired && (
            <div className="mt-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10.5px] text-white/45 uppercase tracking-[0.12em] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Voraussichtlich fertig in
                </span>
                {isEndingSoon && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border animate-pulse"
                    style={{
                      color: 'rgba(134,239,172,0.95)',
                      background: 'rgba(34,197,94,0.12)',
                      borderColor: 'rgba(34,197,94,0.3)',
                    }}
                  >
                    BALD FERTIG!
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {countdownToEnd.days > 0 && (
                  <CountdownCell value={countdownToEnd.days} label="Tage" />
                )}
                <CountdownCell value={countdownToEnd.hours} label="Std" />
                <CountdownCell value={countdownToEnd.minutes} label="Min" />
                <CountdownCell value={countdownToEnd.seconds} label="Sek" />
              </div>
            </div>
          )}

          {/* Expired state (end time has passed - wartung should end soon) */}
          {hasEndTime && countdownToEnd && countdownToEnd.isExpired && (
            <div
              className="mt-6 p-4 rounded-xl flex items-start gap-3"
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.22)',
              }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-green-200">Wartung sollte beendet sein</p>
                <p className="text-[11.5px] text-green-200/70 mt-0.5 leading-relaxed">
                  Das geplante Zeitfenster ist abgelaufen. Die Seite wird in Kürze wieder erreichbar sein.
                </p>
              </div>
            </div>
          )}

          {/* Time Window Info */}
          {(status?.wartung_start || status?.wartung_ende) && (
            <div
              className="mt-5 p-4 rounded-xl space-y-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-[10.5px] text-white/40 uppercase tracking-[0.12em] font-semibold mb-2">Wartungsfenster</p>
              {status.wartung_start && (
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <Calendar className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span className="text-white/50">Start:</span>
                  <span className="text-white/85 tabular-nums font-medium ml-auto">{formatTime(status.wartung_start)}</span>
                </div>
              )}
              {status.wartung_ende && (
                <div className="flex items-center gap-2.5 text-[12.5px]">
                  <Flag className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span className="text-white/50">Geplantes Ende:</span>
                  <span className="text-white/85 tabular-nums font-medium ml-auto">{formatTime(status.wartung_ende)}</span>
                </div>
              )}
            </div>
          )}

          {/* No end time → show simple info */}
          {!hasEndTime && (
            <div
              className="mt-6 p-4 rounded-xl flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                style={{ background: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)' }}
              >
                <Clock className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/85">Geplante Dauer</p>
                <p className="text-[11.5px] text-white/45 mt-0.5">Voraussichtlich 30-60 Minuten</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Refresh Button */}
            <button
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              className="w-full rounded-xl flex items-center justify-center gap-3 font-semibold transition-all active:scale-[0.98] border disabled:opacity-60"
              style={{
                height: '64px',
                minWidth: '320px',
                paddingLeft: '48px',
                paddingRight: '48px',
                fontSize: '15px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <RefreshCw className={`flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`} style={{ width: '20px', height: '20px' }} />
              <span style={{ whiteSpace: 'nowrap' }}>{refreshing ? 'Prüfe...' : 'Status prüfen'}</span>
            </button>

            {/* Discord Button */}
            <a
              href="https://discord.gg/g784tka9sh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl flex items-center justify-center gap-3 font-semibold transition-all active:scale-[0.98] border"
              style={{
                height: '64px',
                minWidth: '320px',
                paddingLeft: '48px',
                paddingRight: '48px',
                fontSize: '15px',
                background: 'linear-gradient(135deg, rgba(88,101,242,0.18), rgba(88,101,242,0.08))',
                borderColor: 'rgba(88,101,242,0.3)',
                color: 'rgba(196,204,255,0.95)',
                boxShadow: '0 4px 12px -4px rgba(88,101,242,0.25)',
              }}
            >
              <svg className="flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span style={{ whiteSpace: 'nowrap' }}>Discord Updates</span>
            </a>
          </div>

          {/* Auto-refresh Hint */}
          <p className="mt-5 text-center text-[10.5px] text-white/25 tracking-wide">
            Seite aktualisiert sich automatisch alle 30 Sekunden
          </p>
        </div>

        {/* Footer Brand */}
        <p className="text-center mt-6 text-[11px] text-white/25 tracking-wide">
          Hamburg Horizon RP · Danke für deine Geduld
        </p>
      </div>
    </div>
  );
}
