'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Loader2, X } from 'lucide-react';

const STATUS_DOT = {
  operational: { color: 'rgb(34, 197, 94)', label: 'Alle Systeme online' },
  degraded: { color: 'rgb(245, 158, 11)', label: 'Eingeschränkter Service' },
  partial_outage: { color: 'rgb(249, 115, 22)', label: 'Teilausfall' },
  major_outage: { color: 'rgb(239, 68, 68)', label: 'Großstörung' },
  loading: { color: 'rgb(107, 114, 128)', label: 'Status wird geprüft' },
  error: { color: 'rgb(107, 114, 128)', label: 'Status nicht verfügbar' },
};

const REFRESH_INTERVAL_MS = 60_000;
const DISMISS_KEY = 'hhrp_status_floater_dismissed';

/**
 * Floating Status-Widget — fixed unten rechts auf jeder Seite.
 * - Auf /system-status selbst ausgeblendet (sonst redundant)
 * - User kann es per X-Button dismissen (für die Session)
 * - Pingt /api/system-status/check alle 60s
 * - Compact: nur Pulse-Dot + Label, klickbar → /system-status
 */
export function SystemStatusFloater() {
  const pathname = usePathname();
  const [statusKey, setStatusKey] = useState('loading');
  const [summary, setSummary] = useState(null);
  const [dismissed, setDismissed] = useState(true); // start true → render erst nach mount
  const [mounted, setMounted] = useState(false);

  // Mount-Check + Dismiss-State aus sessionStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
      setDismissed(isDismissed);
    }
  }, []);

  // Status-Polling
  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/system-status/check', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setStatusKey(json.overall || 'operational');
        setSummary(json.summary || null);
      } catch {
        if (!cancelled) setStatusKey('error');
      }
    };

    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [dismissed]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISS_KEY, '1');
    }
  };

  // ─── Rendering Bedingungen ───
  if (!mounted) return null;
  if (dismissed) return null;
  // Auf der Status-Page selbst ausblenden
  if (pathname === '/system-status') return null;

  const meta = STATUS_DOT[statusKey] || STATUS_DOT.loading;
  const isOk = statusKey === 'operational';
  const isLoading = statusKey === 'loading';
  const isProblem =
    statusKey === 'degraded' ||
    statusKey === 'partial_outage' ||
    statusKey === 'major_outage';

  // Bei Problemen: leichte Skalierung für Aufmerksamkeit (subtil)
  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[9990] flex items-stretch"
      style={{ pointerEvents: 'none' }}
      role="status"
      aria-live="polite"
    >
      <Link
        href="/system-status"
        className="group relative inline-flex items-center gap-2 sm:gap-2.5 pl-3 pr-2 sm:pl-4 sm:pr-3 py-2 sm:py-2.5 rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(20, 20, 20, 0.85), rgba(15, 15, 15, 0.9))',
          borderColor: isProblem
            ? `${meta.color}40`
            : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isProblem
            ? `0 8px 32px ${meta.color}25, 0 0 0 1px ${meta.color}15 inset`
            : '0 8px 24px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'auto',
          animation: isProblem ? 'hhrp-status-attention 2.4s ease-in-out infinite' : 'none',
        }}
        title={`${meta.label} — Klicken für Details`}
      >
        {/* Status Dot */}
        {isLoading ? (
          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-white/40" />
        ) : (
          <span className="relative inline-flex w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0">
            {isOk && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: meta.color, opacity: 0.55 }}
              />
            )}
            <span
              className="relative w-full h-full rounded-full"
              style={{
                background: meta.color,
                boxShadow: `0 0 10px ${meta.color}`,
              }}
            />
          </span>
        )}

        {/* Label — auf sehr kleinen Screens versteckt */}
        <span className="hidden xs:inline text-[11px] sm:text-xs font-medium text-white/75 group-hover:text-white transition-colors whitespace-nowrap">
          {meta.label}
        </span>

        {/* Activity-Icon (auf sm+) */}
        <Activity className="hidden sm:inline-block w-3 h-3 text-white/30 group-hover:text-white/65 transition-colors flex-shrink-0" />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-0.5 sm:ml-1 -mr-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="System-Status-Anzeige ausblenden"
          title="Ausblenden"
        >
          <X className="w-3 h-3" />
        </button>
      </Link>

      <style jsx>{`
        @keyframes hhrp-status-attention {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @media (min-width: 380px) {
          .xs\\:inline {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}

export default SystemStatusFloater;
