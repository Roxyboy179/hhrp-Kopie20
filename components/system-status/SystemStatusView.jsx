'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  Shield,
  Database,
  Globe,
  User as UserIcon,
  FileText,
  Users,
  Headphones,
  Image as ImageIcon,
  Bot,
  ServerCrash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ──────────────────────────────────────────────────────────────
// Status-Konstanten & Mappings
// ──────────────────────────────────────────────────────────────
const STATUS_META = {
  operational: {
    label: 'Operational',
    color: 'rgb(34, 197, 94)',
    bg: 'rgba(34, 197, 94, 0.10)',
    border: 'rgba(34, 197, 94, 0.30)',
    pulse: 'rgba(34, 197, 94, 0.60)',
    icon: CheckCircle2,
    text: 'Alle Systeme laufen einwandfrei',
  },
  degraded: {
    label: 'Eingeschränkt',
    color: 'rgb(245, 158, 11)',
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.30)',
    pulse: 'rgba(245, 158, 11, 0.60)',
    icon: AlertTriangle,
    text: 'Einige Services sind eingeschränkt',
  },
  partial_outage: {
    label: 'Teilausfall',
    color: 'rgb(249, 115, 22)',
    bg: 'rgba(249, 115, 22, 0.10)',
    border: 'rgba(249, 115, 22, 0.30)',
    pulse: 'rgba(249, 115, 22, 0.60)',
    icon: AlertTriangle,
    text: 'Es liegen Teilausfälle vor',
  },
  major_outage: {
    label: 'Großstörung',
    color: 'rgb(239, 68, 68)',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
    pulse: 'rgba(239, 68, 68, 0.60)',
    icon: ServerCrash,
    text: 'Mehrere Services sind nicht erreichbar',
  },
  down: {
    label: 'Offline',
    color: 'rgb(239, 68, 68)',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
    pulse: 'rgba(239, 68, 68, 0.60)',
    icon: XCircle,
    text: 'Service ist nicht erreichbar',
  },
};

const SERVICE_ICONS = {
  discord_auth: Shield,
  discord_bot: Bot,
  database: Database,
  service_main: Globe,
  service_profil: UserIcon,
  service_bewerbung: FileText,
  service_team: Users,
  service_voice: Headphones,
  discord_cdn: ImageIcon,
};

const REFRESH_INTERVAL_MS = 30_000;

// ──────────────────────────────────────────────────────────────
// Status-Pulse Indicator (animierter Punkt mit Ringen)
// ──────────────────────────────────────────────────────────────
function PulseIndicator({ status, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.operational;
  const sizes = {
    sm: { dot: 'w-2 h-2', ring: 'w-3 h-3' },
    md: { dot: 'w-3 h-3', ring: 'w-5 h-5' },
    lg: { dot: 'w-4 h-4', ring: 'w-8 h-8' },
  };
  const s = sizes[size] || sizes.md;
  const isOk = status === 'operational';

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      {isOk && (
        <span
          className={`${s.ring} absolute rounded-full animate-ping`}
          style={{ background: meta.pulse, opacity: 0.5 }}
        />
      )}
      <span
        className={`${s.dot} rounded-full relative`}
        style={{
          background: meta.color,
          boxShadow: `0 0 12px ${meta.pulse}`,
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Latency-Badge — färbt sich nach Geschwindigkeit
// ──────────────────────────────────────────────────────────────
function LatencyBadge({ latency, status }) {
  if (status === 'down') {
    return (
      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1">
        <WifiOff className="w-3 h-3" />
        Timeout
      </span>
    );
  }

  let color = 'rgb(34, 197, 94)';
  let bg = 'rgba(34, 197, 94, 0.08)';
  let border = 'rgba(34, 197, 94, 0.20)';
  if (latency > 1500) {
    color = 'rgb(239, 68, 68)';
    bg = 'rgba(239, 68, 68, 0.08)';
    border = 'rgba(239, 68, 68, 0.20)';
  } else if (latency > 600) {
    color = 'rgb(245, 158, 11)';
    bg = 'rgba(245, 158, 11, 0.08)';
    border = 'rgba(245, 158, 11, 0.20)';
  }

  return (
    <span
      className="text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 tabular-nums"
      style={{ background: bg, borderColor: border, borderWidth: 1, color }}
    >
      <Zap className="w-3 h-3" />
      {latency === 0 ? '— ms' : `${latency} ms`}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// Service-Card (eine Zeile pro Service)
// ──────────────────────────────────────────────────────────────
function ServiceCard({ service, index }) {
  const meta = STATUS_META[service.status] || STATUS_META.operational;
  const Icon = SERVICE_ICONS[service.id] || Activity;

  return (
    <div
      className="p-4 rounded-xl border transition-all hover:translate-y-[-1px]"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        animationDelay: `${Math.min(index * 60, 400)}ms`,
        animation: 'hh-fade-in-up 400ms ease-out both',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: meta.bg,
            border: `1px solid ${meta.border}`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <PulseIndicator status={service.status} size="sm" />
            <h3 className="text-sm font-semibold text-white truncate">{service.name}</h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5 truncate">{service.description}</p>
          {service.error && (
            <p className="text-[11px] text-red-300/80 mt-1 truncate">⚠ {service.error}</p>
          )}
        </div>

        {/* Right: Latency + Status */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <LatencyBadge latency={service.latency} status={service.status} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              color: meta.color,
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Footer-Bar: HTTP Code & Note */}
      {(service.httpCode || service.note) && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
          <span>
            {service.httpCode ? `HTTP ${service.httpCode}` : 'Keine Antwort'}
          </span>
          {service.note && <span className="italic">{service.note}</span>}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Live-Updated-Indicator (kleiner Counter)
// ──────────────────────────────────────────────────────────────
function LiveTimer({ checkedAt }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!checkedAt) return;
    const start = new Date(checkedAt).getTime();
    const tick = () => setSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkedAt]);

  const text = secs < 60 ? `vor ${secs}s` : `vor ${Math.floor(secs / 60)}m ${secs % 60}s`;
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/50">
      <Clock className="w-3 h-3" />
      Zuletzt geprüft {text}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// Main View
// ──────────────────────────────────────────────────────────────
export function SystemStatusView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/system-status/check', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message || 'Status konnte nicht abgerufen werden');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial + Auto-Refresh
  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => fetchStatus(false), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchStatus]);

  const overall = data?.overall || 'operational';
  const overallMeta = STATUS_META[overall] || STATUS_META.operational;
  const OverallIcon = overallMeta.icon;
  const summary = data?.summary || { operational: 0, degraded: 0, down: 0, total: 0 };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="space-y-6">
        <div
          className="p-8 rounded-2xl border flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Status wird geprüft…</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error && !data) {
    return (
      <div
        className="p-6 rounded-2xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.10), rgba(239, 68, 68, 0.02))',
          borderColor: 'rgba(239, 68, 68, 0.30)',
        }}
      >
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Status-Check fehlgeschlagen</h3>
            <p className="text-sm text-white/60 mb-4">{error}</p>
            <Button
              onClick={() => fetchStatus(true)}
              className="rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ───
  return (
    <div className="space-y-6">
      {/* ═══ OVERALL STATUS HERO ═══ */}
      <div
        className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${overallMeta.bg}, rgba(255, 255, 255, 0.02))`,
          borderColor: overallMeta.border,
        }}
      >
        {/* Glow-Effekt */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: overallMeta.color }}
        />

        <div className="relative flex items-start gap-4 sm:gap-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: overallMeta.bg,
              border: `1px solid ${overallMeta.border}`,
            }}
          >
            <OverallIcon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: overallMeta.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PulseIndicator status={overall === 'partial_outage' || overall === 'major_outage' ? 'down' : overall} size="md" />
              <span
                className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{
                  background: overallMeta.bg,
                  border: `1px solid ${overallMeta.border}`,
                  color: overallMeta.color,
                }}
              >
                {overallMeta.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{overallMeta.text}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-white/50">
              {data?.checkedAt && <LiveTimer checkedAt={data.checkedAt} />}
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3" />
                Live-Monitoring
              </span>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-6">
          <SummaryStat label="Operational" value={summary.operational} color="rgb(34, 197, 94)" />
          <SummaryStat label="Eingeschränkt" value={summary.degraded} color="rgb(245, 158, 11)" />
          <SummaryStat label="Offline" value={summary.down} color="rgb(239, 68, 68)" />
        </div>
      </div>

      {/* ═══ CONTROLS ═══ */}
      <div
        className="p-3 rounded-xl border flex items-center justify-between gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => setAutoRefresh((v) => !v)}
          className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors px-2 py-1 rounded-md"
        >
          <span
            className={`w-2 h-2 rounded-full ${autoRefresh ? 'animate-pulse' : ''}`}
            style={{
              background: autoRefresh ? 'rgb(34, 197, 94)' : 'rgb(107, 114, 128)',
              boxShadow: autoRefresh ? '0 0 8px rgba(34, 197, 94, 0.6)' : 'none',
            }}
          />
          <span className="font-medium">
            Auto-Refresh {autoRefresh ? 'AN' : 'AUS'}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/40">{REFRESH_INTERVAL_MS / 1000}s Intervall</span>
        </button>

        <Button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="h-8 px-3 rounded-lg text-xs"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.04))',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
          }}
        >
          {refreshing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Prüfe…
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Jetzt prüfen
            </>
          )}
        </Button>
      </div>

      {/* ═══ SERVICE LIST ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/50" />
            Services
            <span className="text-xs font-mono text-white/40">({summary.total})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {(data?.services || []).map((svc, i) => (
            <ServiceCard key={svc.id} service={svc} index={i} />
          ))}
        </div>
      </div>

      {/* ═══ FOOTER NOTE ═══ */}
      <div
        className="p-4 rounded-xl border text-xs text-white/50 leading-relaxed"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <p className="flex items-start gap-2">
          <Activity className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white/40" />
          <span>
            Diese Seite zeigt den Live-Status aller Hamburg Horizon RP-Dienste. Jeder Service
            wird per HTTP-Anfrage erreicht und nach Antwortzeit & Status-Code bewertet.
            Bei Problemen wende dich bitte an den{' '}
            <a
              href="/voice-support"
              className="text-white/80 hover:text-white underline underline-offset-2"
            >
              Voice Support
            </a>
            .
          </span>
        </p>
      </div>

      <style jsx>{`
        @keyframes hh-fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Summary-Stat Box
// ──────────────────────────────────────────────────────────────
function SummaryStat({ label, value, color }) {
  return (
    <div
      className="p-3 rounded-xl border text-center"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-medium">
        {label}
      </div>
    </div>
  );
}

export default SystemStatusView;
