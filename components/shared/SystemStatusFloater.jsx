'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Loader2 } from 'lucide-react';

const STATUS_META = {
  operational: {
    color: 'rgb(34, 197, 94)',
    label: 'Alle Systeme online',
    short: 'Online',
  },
  degraded: {
    color: 'rgb(245, 158, 11)',
    label: 'Eingeschränkter Service',
    short: 'Eingeschränkt',
  },
  partial_outage: {
    color: 'rgb(249, 115, 22)',
    label: 'Teilausfall',
    short: 'Teilausfall',
  },
  major_outage: {
    color: 'rgb(239, 68, 68)',
    label: 'Großstörung',
    short: 'Störung',
  },
  loading: {
    color: 'rgb(107, 114, 128)',
    label: 'Status wird geprüft',
    short: 'Prüfe …',
  },
  error: {
    color: 'rgb(107, 114, 128)',
    label: 'Status nicht verfügbar',
    short: 'Status n/v',
  },
};

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Floating Status-Widget — fixed unten rechts auf jeder Seite.
 * - Mobile: besser sichtbar, größerer Touch-Target, Short-Label, Safe-Area-Padding
 * - Desktop: vollständiges Label + Activity-Icon
 * - Permanent sichtbar, auf /system-status selbst ausgeblendet
 */
export function SystemStatusFloater() {
  const pathname = usePathname();
  const [statusKey, setStatusKey] = useState('loading');
  const [, setSummary] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

  if (!mounted) return null;
  if (pathname === '/system-status') return null;

  const meta = STATUS_META[statusKey] || STATUS_META.loading;
  const isOk = statusKey === 'operational';
  const isLoading = statusKey === 'loading';
  const isProblem =
    statusKey === 'degraded' ||
    statusKey === 'partial_outage' ||
    statusKey === 'major_outage';

  // Farben basierend auf Status
  const accentRgba = (alpha) => meta.color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);

  return (
    <div
      className="fixed z-[9990] flex items-stretch"
      style={{
        right: 'max(0.75rem, env(safe-area-inset-right))',
        bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
        pointerEvents: 'none',
      }}
      role="status"
      aria-live="polite"
    >
      <Link
        href="/system-status"
        aria-label={`System-Status: ${meta.label}. Tippen für Details.`}
        title={`${meta.label} — Tippen für Details`}
        className="group relative inline-flex items-center gap-2 sm:gap-2.5 rounded-full border-[1.5px] backdrop-blur-xl transition-all duration-300 hover:scale-[1.04] active:scale-95 hover:shadow-2xl"
        style={{
          paddingLeft: '0.875rem',
          paddingRight: '0.875rem',
          paddingTop: '0.625rem',
          paddingBottom: '0.625rem',
          minHeight: '40px',
          background:
            'linear-gradient(135deg, rgba(18,18,20,0.92), rgba(10,10,12,0.95))',
          borderColor: accentRgba(isProblem ? 0.55 : isOk ? 0.35 : 0.25),
          boxShadow: isProblem
            ? `0 10px 30px ${accentRgba(0.35)}, 0 0 0 1px ${accentRgba(0.2)} inset, 0 0 20px ${accentRgba(0.18)}`
            : isOk
            ? `0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px ${accentRgba(0.12)} inset, 0 0 14px ${accentRgba(0.12)}`
            : '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
          pointerEvents: 'auto',
          animation: isProblem ? 'hhrp-status-attention 2s ease-in-out infinite' : 'none',
        }}
      >
        {/* Status Dot — größer für bessere Sichtbarkeit */}
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50 flex-shrink-0" />
        ) : (
          <span className="relative inline-flex w-3 h-3 flex-shrink-0">
            {isOk && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: meta.color, opacity: 0.65 }}
              />
            )}
            {isProblem && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: meta.color, opacity: 0.7 }}
              />
            )}
            <span
              className="relative w-full h-full rounded-full"
              style={{
                background: meta.color,
                boxShadow: `0 0 12px ${meta.color}, 0 0 4px ${meta.color}`,
              }}
            />
          </span>
        )}

        {/* Short Label (mobile) / Long Label (desktop) */}
        <span
          className="text-[12px] sm:text-[12.5px] font-semibold tracking-tight whitespace-nowrap transition-colors"
          style={{
            color: isProblem ? meta.color : 'rgba(255,255,255,0.9)',
          }}
        >
          {/* Mobile: kurz */}
          <span className="sm:hidden">{meta.short}</span>
          {/* Desktop: lang */}
          <span className="hidden sm:inline">{meta.label}</span>
        </span>

        {/* Activity-Icon (ab sm) */}
        <Activity
          className="hidden sm:inline-block w-3.5 h-3.5 text-white/35 group-hover:text-white/70 transition-colors flex-shrink-0"
        />
      </Link>

      <style jsx>{`
        @keyframes hhrp-status-attention {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}

export default SystemStatusFloater;
