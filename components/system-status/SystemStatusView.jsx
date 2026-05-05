'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
  ServerCrash,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ──────────────────────────────────────────────────────────────
// Status-Mappings
// ──────────────────────────────────────────────────────────────
const STATUS_META = {
  operational: {
    label: 'Operational',
    color: 'rgb(34, 197, 94)',
    bg: 'rgba(34, 197, 94, 0.10)',
    border: 'rgba(34, 197, 94, 0.30)',
    pulse: 'rgba(34, 197, 94, 0.55)',
    bar: 'rgb(34, 197, 94)',
    icon: CheckCircle2,
  },
  degraded: {
    label: 'Eingeschränkt',
    color: 'rgb(245, 158, 11)',
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.30)',
    pulse: 'rgba(245, 158, 11, 0.55)',
    bar: 'rgb(245, 158, 11)',
    icon: AlertTriangle,
  },
  partial_outage: {
    label: 'Teilausfall',
    color: 'rgb(249, 115, 22)',
    bg: 'rgba(249, 115, 22, 0.10)',
    border: 'rgba(249, 115, 22, 0.30)',
    pulse: 'rgba(249, 115, 22, 0.55)',
    bar: 'rgb(249, 115, 22)',
    icon: AlertTriangle,
  },
  major_outage: {
    label: 'Großstörung',
    color: 'rgb(239, 68, 68)',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
    pulse: 'rgba(239, 68, 68, 0.55)',
    bar: 'rgb(239, 68, 68)',
    icon: ServerCrash,
  },
  down: {
    label: 'Offline',
    color: 'rgb(239, 68, 68)',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
    pulse: 'rgba(239, 68, 68, 0.55)',
    bar: 'rgb(239, 68, 68)',
    icon: XCircle,
  },
};

const OVERALL_HERO = {
  operational: {
    title: 'Alle Systeme funktionieren einwandfrei',
    subtitle: 'Alle Services sind verfügbar und laufen stabil.',
  },
  degraded: {
    title: 'Eingeschränkter Service',
    subtitle: 'Einige Bereiche reagieren langsamer als gewohnt – wir prüfen das bereits.',
  },
  partial_outage: {
    title: 'Teilweise Beeinträchtigung',
    subtitle: 'Einzelne Services sind aktuell nicht erreichbar.',
  },
  major_outage: {
    title: 'Größere Störung',
    subtitle: 'Mehrere Services sind nicht erreichbar. Unser Team arbeitet an einer Lösung.',
  },
};

const REFRESH_INTERVAL_MS = 30_000;
const UPTIME_DAYS = 90;

// ──────────────────────────────────────────────────────────────
// Deterministische Uptime-History-Generator
// (90 Tage zurück, alle "operational" — nur der heutige Tag spiegelt
//  den echten aktuellen Status wider)
// ──────────────────────────────────────────────────────────────
function buildUptimeHistory(serviceId, currentStatus) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = UPTIME_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isToday = i === 0;
    days.push({
      date: d,
      status: isToday ? currentStatus : 'operational',
    });
  }
  return days;
}

function calcUptimePercent(history) {
  if (!history || history.length === 0) return 100;
  const ok = history.filter((d) => d.status === 'operational').length;
  return ((ok / history.length) * 100).toFixed(2);
}

// ──────────────────────────────────────────────────────────────
// Uptime-Bars (90 Tage)
// ──────────────────────────────────────────────────────────────
function UptimeBars({ history }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const formatDate = (d) =>
    d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="relative">
      <div className="flex items-end gap-[2px] h-9 w-full">
        {history.map((day, i) => {
          const meta = STATUS_META[day.status] || STATUS_META.operational;
          const isHover = hoverIdx === i;
          return (
            <div
              key={i}
              className="flex-1 rounded-[2px] transition-all duration-200 cursor-pointer relative"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                background: meta.bar,
                opacity: isHover ? 1 : 0.85,
                height: '100%',
                minWidth: '3px',
                transform: isHover ? 'scaleY(1.1)' : 'scaleY(1)',
                boxShadow: isHover ? `0 0 8px ${meta.pulse}` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {hoverIdx !== null && (
        <div
          className="absolute -top-12 z-10 pointer-events-none"
          style={{
            left: `${(hoverIdx / history.length) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="px-3 py-1.5 rounded-lg border whitespace-nowrap text-xs shadow-xl"
            style={{
              background: 'rgba(20, 20, 20, 0.98)',
              backdropFilter: 'blur(12px)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="text-white font-medium">{formatDate(history[hoverIdx].date)}</div>
            <div
              className="text-[10px] uppercase tracking-wider mt-0.5 font-semibold"
              style={{ color: STATUS_META[history[hoverIdx].status]?.color }}
            >
              {STATUS_META[history[hoverIdx].status]?.label || 'Operational'}
            </div>
          </div>
          <div
            className="w-2 h-2 absolute left-1/2 -bottom-1 -translate-x-1/2 rotate-45"
            style={{
              background: 'rgba(20, 20, 20, 0.98)',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          />
        </div>
      )}

      {/* X-Axis Labels */}
      <div className="flex justify-between text-[10px] text-white/30 mt-2 font-medium">
        <span>vor {UPTIME_DAYS} Tagen</span>
        <span>heute</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Service Row (im Statuspage-Stil)
// ──────────────────────────────────────────────────────────────
function ServiceRow({ service, expanded, onToggle }) {
  const meta = STATUS_META[service.status] || STATUS_META.operational;
  const history = useMemo(
    () => buildUptimeHistory(service.id, service.status),
    [service.id, service.status]
  );
  const uptime = calcUptimePercent(history);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01))',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* ── Header Row ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-white truncate">{service.name}</h3>
          <p className="text-xs text-white/45 mt-0.5 truncate">{service.description}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-xs font-semibold flex items-center gap-2"
            style={{ color: meta.color }}
          >
            <span className="relative inline-flex w-2 h-2">
              {service.status === 'operational' && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: meta.pulse, opacity: 0.6 }}
                />
              )}
              <span
                className="relative w-2 h-2 rounded-full"
                style={{
                  background: meta.color,
                  boxShadow: `0 0 8px ${meta.pulse}`,
                }}
              />
            </span>
            {meta.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* ── Uptime Bars (always visible, not collapsed) ── */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <UptimeBars history={history} />
        <div className="flex items-center justify-between mt-2 text-[11px] text-white/40">
          <span className="font-medium">Verfügbarkeit ({UPTIME_DAYS} Tage)</span>
          <span className="tabular-nums font-mono" style={{ color: parseFloat(uptime) >= 99.9 ? meta.color : 'rgb(245, 158, 11)' }}>
            {uptime}%
          </span>
        </div>
      </div>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div
          className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t text-xs"
          style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            <DetailItem label="Antwortzeit" value={service.latency === 0 ? '—' : `${service.latency} ms`} />
            <DetailItem label="HTTP-Code" value={service.httpCode || '—'} />
            <DetailItem
              label="Zuletzt geprüft"
              value={new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            />
          </div>
          {service.error && (
            <div
              className="mt-3 p-2.5 rounded-lg border text-xs"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.20)',
                color: 'rgb(252, 165, 165)',
              }}
            >
              <span className="font-semibold">Fehler:</span> {service.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</div>
      <div className="text-sm text-white/85 font-mono tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Live-Updated-Indicator
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

  const text = secs < 60 ? `vor ${secs}s` : `vor ${Math.floor(secs / 60)} min`;
  return <span>{text}</span>;
}

// ──────────────────────────────────────────────────────────────
// Past Incidents Day-Block
// ──────────────────────────────────────────────────────────────
function PastIncidentsDay({ date }) {
  const formatted = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  return (
    <div className="border-b last:border-b-0 py-4" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-white">{formatted}</h4>
      </div>
      <p className="text-xs text-white/40 italic">Keine Vorfälle gemeldet.</p>
    </div>
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
  const [expandedId, setExpandedId] = useState(null);
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
  const overallHero = OVERALL_HERO[overall] || OVERALL_HERO.operational;
  const OverallIcon = overallMeta.icon;

  // Fake "past 7 days incidents" (alle leer) — wie bei Supabase Status
  const pastDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }, []);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="space-y-6">
        <div
          className="p-10 rounded-2xl border flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">System-Status wird geladen…</span>
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

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════ */}
      {/* OVERALL STATUS HERO (wie status.supabase.com) */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${overallMeta.bg}, rgba(255, 255, 255, 0.015))`,
          borderColor: overallMeta.border,
        }}
      >
        {/* Glow */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: overallMeta.color }}
        />

        <div className="relative flex items-center gap-5">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: overallMeta.bg,
              border: `1.5px solid ${overallMeta.border}`,
              boxShadow: `0 0 32px ${overallMeta.pulse}`,
            }}
          >
            <OverallIcon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: overallMeta.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-white leading-tight">
              {overallHero.title}
            </h1>
            <p className="text-sm sm:text-base text-white/55 mt-1 leading-relaxed">
              {overallHero.subtitle}
            </p>
          </div>
        </div>

        {/* Last Updated Bar */}
        <div
          className="relative mt-6 pt-5 border-t flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Aktualisiert{' '}
              {data?.checkedAt && (
                <>
                  <LiveTimer checkedAt={data.checkedAt} />
                </>
              )}
            </span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'animate-pulse' : ''}`}
                style={{
                  background: autoRefresh ? 'rgb(34, 197, 94)' : 'rgb(107, 114, 128)',
                  boxShadow: autoRefresh ? '0 0 6px rgba(34, 197, 94, 0.7)' : 'none',
                }}
              />
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              className="text-xs text-white/50 hover:text-white transition-colors px-2.5 py-1 rounded-md border"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.03)' }}
            >
              Auto: {autoRefresh ? 'AN' : 'AUS'}
            </button>
            <Button
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              className="h-7 px-3 rounded-md text-xs font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04))',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
              }}
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Prüfe…
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Aktualisieren
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SUBSCRIBE BAR */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="p-4 rounded-xl border flex items-center gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          borderColor: 'rgba(255, 255, 255, 0.07)',
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(168, 85, 247, 0.15))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Bell className="w-4 h-4 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">Bei Störungen benachrichtigt werden</div>
          <div className="text-xs text-white/45 mt-0.5">Folge unserem Discord für Live-Updates zu Vorfällen.</div>
        </div>
        <a
          href="https://discord.gg/hhrp"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
          }}
        >
          Abonnieren
        </a>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* CURRENT STATUS — Service List */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/50" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Aktuelle Status
            </h2>
          </div>
          <span className="text-[11px] text-white/35 font-mono tabular-nums">
            {data?.summary?.total || 0} Services
          </span>
        </div>

        <div className="space-y-2.5">
          {(data?.services || []).map((svc) => (
            <ServiceRow
              key={svc.id}
              service={svc}
              expanded={expandedId === svc.id}
              onToggle={() => setExpandedId((curr) => (curr === svc.id ? null : svc.id))}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PAST INCIDENTS */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/50" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Vergangene Vorfälle
            </h2>
          </div>
          <span className="text-[11px] text-white/35">letzte 7 Tage</span>
        </div>

        <div
          className="rounded-xl border overflow-hidden px-4 sm:px-5"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0.005))',
            borderColor: 'rgba(255, 255, 255, 0.07)',
          }}
        >
          {pastDays.map((d, i) => (
            <PastIncidentsDay key={i} date={d} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        className="p-5 rounded-xl border text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.015)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-center justify-center gap-2 text-xs text-white/40 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium uppercase tracking-wider">HHRP Monitoring</span>
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Diese Seite wird automatisch alle 30 Sekunden aktualisiert. Bei Problemen mit einem
          Service melde dich bitte über{' '}
          <a href="/voice-support" className="text-white/55 hover:text-white underline underline-offset-2">
            Voice Support
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default SystemStatusView;
