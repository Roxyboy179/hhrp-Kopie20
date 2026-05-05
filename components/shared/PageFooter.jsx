'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Loader2 } from 'lucide-react';

// Hamburg Horizon RP — Aktuelle App-Version
const APP_VERSION = 'V1.0.5';

const STATUS_DOT_COLOR = {
  operational: { color: 'rgb(34, 197, 94)', label: 'Alle Systeme online' },
  degraded: { color: 'rgb(245, 158, 11)', label: 'Eingeschränkter Service' },
  partial_outage: { color: 'rgb(249, 115, 22)', label: 'Teilausfall' },
  major_outage: { color: 'rgb(239, 68, 68)', label: 'Großstörung' },
  loading: { color: 'rgb(107, 114, 128)', label: 'Status wird geladen…' },
  error: { color: 'rgb(107, 114, 128)', label: 'Status nicht verfügbar' },
};

export function PageFooter() {
  const [statusKey, setStatusKey] = useState('loading');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
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
    // Refresh alle 60s
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const meta = STATUS_DOT_COLOR[statusKey] || STATUS_DOT_COLOR.loading;
  const isOk = statusKey === 'operational';
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 sm:mt-24 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start md:items-center gap-6">
          {/* ─── Left: Brand & Copyright ─── */}
          <div className="space-y-2 text-center md:text-left">
            <div className="text-sm font-semibold text-white/80 tracking-tight">
              Hamburg Horizon RP
            </div>
            <div className="text-xs text-white/40 leading-relaxed">
              © {year} Hamburg Horizon RP. Alle Rechte vorbehalten.
            </div>
          </div>

          {/* ─── Center: System Status Indicator ─── */}
          <Link
            href="/system-status"
            className="group inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-full border transition-all hover:scale-[1.02] mx-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Pulse Dot */}
            {statusKey === 'loading' ? (
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

            <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">
              {meta.label}
            </span>

            <Activity className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
          </Link>

          {/* ─── Right: Quick Links + Version ─── */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 text-xs text-white/45">
              <Link href="/system-status" className="hover:text-white transition-colors">
                Status
              </Link>
              <span className="text-white/15">·</span>
              <Link href="/impressum" className="hover:text-white transition-colors">
                Impressum
              </Link>
              <span className="text-white/15">·</span>
              <Link href="/datenschutz" className="hover:text-white transition-colors">
                Datenschutz
              </Link>
              <span className="text-white/15">·</span>
              <Link href="/nutzungsbedingungen" className="hover:text-white transition-colors">
                Nutzung
              </Link>
            </nav>

            {/* Version Badge */}
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
              <span className="text-white/80 font-semibold">{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PageFooter;
