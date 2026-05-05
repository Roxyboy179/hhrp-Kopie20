'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Loader2 } from 'lucide-react';

// Hamburg Horizon RP — Aktuelle App-Version
export const APP_VERSION = 'V1.0.5';

const STATUS_DOT = {
  operational: { color: 'rgb(34, 197, 94)', label: 'Alle Systeme online' },
  degraded: { color: 'rgb(245, 158, 11)', label: 'Eingeschränkter Service' },
  partial_outage: { color: 'rgb(249, 115, 22)', label: 'Teilausfall' },
  major_outage: { color: 'rgb(239, 68, 68)', label: 'Großstörung' },
  loading: { color: 'rgb(107, 114, 128)', label: 'Status wird geprüft' },
  error: { color: 'rgb(107, 114, 128)', label: 'Status nicht verfügbar' },
};

/**
 * Kleine Status- + Versions-Leiste, die in den bestehenden Footer
 * integriert wird. Pingt /api/system-status/check alle 60s.
 */
export function FooterStatusBar() {
  const [statusKey, setStatusKey] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/system-status/check', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setStatusKey(json.overall || 'operational');
      } catch {
        if (!cancelled) setStatusKey('error');
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const meta = STATUS_DOT[statusKey] || STATUS_DOT.loading;
  const isOk = statusKey === 'operational';
  const isLoading = statusKey === 'loading';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {/* ─── System Status Pill ─── */}
      <Link
        href="/system-status"
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02]"
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
        title="System-Status anzeigen"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-white/40" />
        ) : (
          <span className="relative inline-flex w-2 h-2">
            {isOk && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: meta.color, opacity: 0.5 }}
              />
            )}
            <span
              className="relative w-2 h-2 rounded-full"
              style={{
                background: meta.color,
                boxShadow: `0 0 8px ${meta.color}`,
              }}
            />
          </span>
        )}
        <span className="text-[11px] sm:text-xs font-medium text-white/65 group-hover:text-white transition-colors whitespace-nowrap">
          {meta.label}
        </span>
        <Activity className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
      </Link>

      {/* ─── Version Badge ─── */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
        title="Aktuelle App-Version"
      >
        <span className="text-white/30">Aktuelle Version</span>
        <span className="text-white/85 font-semibold">{APP_VERSION}</span>
      </div>
    </div>
  );
}

export default FooterStatusBar;
