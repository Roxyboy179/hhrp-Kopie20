'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2, Search, ShieldCheck, ShieldOff, Mail,
  Unlock, Lock, AlertTriangle, CheckCircle2, XCircle, Clock,
  RefreshCw, User as UserIcon, ArrowLeft,
} from 'lucide-react';

const inputClass =
  'bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 focus:border-white/30 focus:ring-white/10 rounded-xl h-11';

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Pill({ tone = 'neutral', icon: Icon, children }) {
  const tones = {
    success: { color: 'rgba(134,239,172,0.95)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.22)' },
    danger:  { color: 'rgba(252,165,165,0.95)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' },
    warning: { color: 'rgba(253,224,71,0.95)',  bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.22)' },
    info:    { color: 'rgba(147,197,253,0.95)', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.22)' },
    neutral: { color: 'rgba(255,255,255,0.7)',  bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium border"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

export default function AdminBenutzerPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('auto'); // auto | email | discordId | username
  const [searchLoading, setSearchLoading] = useState(false);
  const [result, setResult] = useState(null); // { found, multiple?, user?, candidates? }
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!data.admin) {
          router.push('/admin');
          return;
        }
        if (data.admin.roleLevel < 4) {
          toast.error('Keine Berechtigung', {
            description: 'Nur Projektinhaber (Level 4) dürfen Benutzer verwalten.',
          });
          router.push('/admin');
          return;
        }
        setAdmin(data.admin);
      } catch (e) {
        console.error(e);
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [router]);

  // Auto-detect Search-Type-Hint (nur visuell)
  const detectType = (q) => {
    const v = q.trim();
    if (!v) return null;
    if (v.includes('@')) return 'email';
    if (/^\d{15,25}$/.test(v)) return 'discordId';
    return 'username';
  };
  const detectedType = detectType(query);

  const performSearch = async (overrideQuery, overrideType) => {
    const q = (overrideQuery ?? query).trim();
    const t = overrideType || searchType;
    if (!q) {
      toast.error('Bitte einen Suchbegriff eingeben');
      return;
    }
    setSearchLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({ q, type: t });
      const res = await fetch(`/api/admin/users/lookup?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Suchen');
      setResult(data);
      if (!data.found) {
        toast.error('Nicht gefunden', { description: `Kein User mit "${q}" gefunden.` });
      }
    } catch (err) {
      toast.error('Fehler', { description: err.message });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    await performSearch();
  };

  const selectCandidate = async (cand) => {
    // Direkter Lookup via E-Mail des Kandidaten
    await performSearch(cand.email, 'email');
  };

  const handleDisable2FA = async () => {
    if (!result?.user?.email) return;
    setActionLoading('2fa');
    try {
      const res = await fetch('/api/admin/users/disable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('2FA entfernt', { description: data.message });
      setConfirmAction(null);
      // Reload status
      await performSearch(result.user.email, 'email');
    } catch (err) {
      toast.error('Fehler', { description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async () => {
    if (!result?.user?.email) return;
    setActionLoading('unlock');
    try {
      const res = await fetch('/api/admin/users/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Account entsperrt', { description: data.message });
      setConfirmAction(null);
      await performSearch(result.user.email, 'email');
    } catch (err) {
      toast.error('Fehler', { description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (!admin) return null;

  const user = result?.found && !result.multiple ? result.user : null;
  const candidates = result?.found && result.multiple ? result.candidates : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Benutzer-Verwaltung</h1>
          <p className="text-white/45 text-[13px] mt-1.5">
            2FA entfernen oder Account-Sperren aufheben · <span className="text-red-300/80">Nur Projektinhaber (Level 4)</span>
          </p>
        </div>
      </div>

      {/* Info-Box */}
      <div
        className="p-4 rounded-2xl relative overflow-hidden"
        style={{ ...cardStyle, background: 'rgba(234,179,8,0.05)', borderColor: 'rgba(234,179,8,0.18)' }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-300/90" />
          <div className="text-[12.5px] text-white/65 leading-relaxed">
            Hier kannst du Login-Probleme von Benutzern beheben:
            <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-white/55">
              <li><b className="text-white/80">2FA entfernen</b> — wenn der Benutzer seinen Authenticator verloren hat.</li>
              <li><b className="text-white/80">Account entsperren</b> — nach 3 fehlgeschlagenen Login-Versuchen.</li>
            </ul>
            <p className="mt-2 text-white/45 text-[11.5px]">
              Alle Aktionen werden in den Aktivitäts-Logs erfasst <b>und</b> der User wird per E-Mail benachrichtigt.
            </p>
          </div>
        </div>
      </div>

      {/* Such-Form */}
      <div className="p-5 md:p-6 rounded-2xl relative overflow-hidden" style={cardStyle}>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
        />
        <h3 className="text-[15px] font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-white/55" />
          Benutzer suchen
        </h3>
        <p className="text-[11.5px] text-white/40 mb-4">
          Suche nach <b>E-Mail</b>, <b>Discord-ID</b> oder <b>Discord-Benutzername</b> — Typ wird automatisch erkannt.
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          {/* Type-Selector */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'auto', label: 'Automatisch' },
              { id: 'email', label: 'E-Mail' },
              { id: 'discordId', label: 'Discord-ID' },
              { id: 'username', label: 'Benutzername' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSearchType(t.id)}
                className={`h-8 px-3 rounded-lg text-[11.5px] font-medium border transition ${
                  searchType === t.id
                    ? 'bg-white/[0.08] border-white/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/45 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-white/60 text-[12.5px] font-medium flex items-center gap-2">
                Suchbegriff
                {searchType === 'auto' && detectedType && (
                  <span className="text-[10.5px] text-white/35 normal-case">
                    → erkannt als <b className="text-white/55">
                      {detectedType === 'email' ? 'E-Mail' : detectedType === 'discordId' ? 'Discord-ID' : 'Benutzername'}
                    </b>
                  </span>
                )}
              </Label>
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchType === 'email' ? 'benutzer@example.com'
                  : searchType === 'discordId' ? '1059408423726362695'
                  : searchType === 'username' ? 'max_mustermann'
                  : 'E-Mail, Discord-ID oder Benutzername…'
                }
                className={inputClass}
                required
                autoFocus
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={searchLoading || !query.trim()}
                className="h-11 px-5 rounded-xl font-semibold text-[12.5px] border-0 text-black disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 8px 20px -6px rgba(0,0,0,0.6)',
                }}
              >
                {searchLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Suche…</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" /> Suchen</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Ergebnis: nicht gefunden */}
      {result && !result.found && (
        <div className="p-8 rounded-2xl text-center" style={cardStyle}>
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border"
            style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.15)' }}
          >
            <XCircle className="w-6 h-6 text-red-300/80" />
          </div>
          <p className="text-white/70 text-[14px] font-medium">Kein Benutzer gefunden</p>
          <p className="text-white/40 text-[12px] mt-1">
            Es existiert kein passender Eintrag für „{result.query}".
          </p>
        </div>
      )}

      {/* Ergebnis: mehrere Treffer (Username-Suche) */}
      {candidates && (
        <div className="p-5 rounded-2xl relative overflow-hidden" style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-4 h-4 text-white/55" />
            <h3 className="text-[14px] font-semibold text-white">
              {candidates.length} Treffer für „{result.query}"
            </h3>
          </div>
          <p className="text-[11.5px] text-white/45 mb-4">Wähle einen Benutzer aus, um Details anzuzeigen:</p>
          <div className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.discordUserId}
                onClick={() => selectCandidate(c)}
                className="w-full text-left p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <UserIcon className="w-4 h-4 text-white/55" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white font-medium truncate">
                    {c.globalName || c.discordUsername || '(unbekannt)'}
                    {c.globalName && c.discordUsername && (
                      <span className="text-white/45 font-normal ml-1.5">@{c.discordUsername}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span><span className="text-white/30">ID:</span> <span className="font-mono">{c.discordUserId}</span></span>
                    {c.email && <span><span className="text-white/30">E-Mail:</span> {c.email}</span>}
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-white/30 rotate-180" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ergebnis: 1 User */}
      {user && (
        <div className="p-5 md:p-6 rounded-2xl relative overflow-hidden" style={cardStyle}>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)' }}
          />

          {/* User-Header */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.08]"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }}
            >
              <UserIcon className="w-5 h-5 text-white/75" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-[15px] font-semibold text-white tracking-tight truncate">{user.email}</h3>
                {user.emailConfirmedAt ? (
                  <Pill tone="success" icon={CheckCircle2}>E-Mail bestätigt</Pill>
                ) : (
                  <Pill tone="warning" icon={Clock}>Nicht bestätigt</Pill>
                )}
              </div>
              {(user.discordUsername || user.globalName) && (
                <div className="text-[12px] text-white/55 mb-1.5">
                  Discord:{' '}
                  <span className="text-white/80 font-medium">
                    {user.globalName || user.discordUsername}
                  </span>
                  {user.globalName && user.discordUsername && (
                    <span className="text-white/40"> @{user.discordUsername}</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11.5px] text-white/45 mt-2">
                <div>User-ID: <span className="text-white/65 font-mono">{user.id.slice(0, 8)}…</span></div>
                {user.discordUserId && (
                  <div>Discord-ID: <span className="text-white/65 font-mono">{user.discordUserId}</span></div>
                )}
                <div>Erstellt: <span className="text-white/65">{formatDate(user.createdAt)}</span></div>
                <div>Letzter Login: <span className="text-white/65">{formatDate(user.lastSignInAt)}</span></div>
              </div>
            </div>
          </div>

          {/* Status-Karten Grid */}
          <div className="grid md:grid-cols-2 gap-3 mb-5">
            {/* 2FA-Status */}
            <div
              className="p-4 rounded-xl border"
              style={
                user.twoFa.enabled
                  ? { background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.18)' }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }
              }
            >
              <div className="flex items-center gap-2 mb-2">
                {user.twoFa.enabled ? (
                  <ShieldCheck className="w-4 h-4 text-green-300/90" />
                ) : (
                  <ShieldOff className="w-4 h-4 text-white/45" />
                )}
                <span className="text-[12.5px] font-semibold text-white">2-Faktor-Authentifizierung</span>
              </div>
              {user.twoFa.enabled ? (
                <div className="space-y-1 text-[11.5px] text-white/55">
                  <div>Status: <Pill tone="success">Aktiv</Pill></div>
                  <div>Aktiviert: <span className="text-white/75">{formatDate(user.twoFa.enabledAt)}</span></div>
                  <div>Backup-Codes verbleibend: <span className="text-white/75 font-mono">{user.twoFa.backupCodesRemaining}</span></div>
                </div>
              ) : (
                <p className="text-[11.5px] text-white/50">2FA ist nicht aktiviert.</p>
              )}
            </div>

            {/* Lock-Status */}
            <div
              className="p-4 rounded-xl border"
              style={
                user.lock.locked
                  ? { background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.18)' }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }
              }
            >
              <div className="flex items-center gap-2 mb-2">
                {user.lock.locked ? (
                  <Lock className="w-4 h-4 text-red-300/90" />
                ) : (
                  <Unlock className="w-4 h-4 text-white/45" />
                )}
                <span className="text-[12.5px] font-semibold text-white">Account-Sperre</span>
              </div>
              {user.lock.locked ? (
                <div className="space-y-1 text-[11.5px] text-white/55">
                  <div>Status: <Pill tone="danger" icon={Lock}>Gesperrt</Pill></div>
                  <div>Gesperrt seit: <span className="text-white/75">{formatDate(user.lock.lockedAt)}</span></div>
                  <div>Fehlversuche: <span className="text-white/75 font-mono">{user.lock.failedLoginAttempts}</span></div>
                </div>
              ) : (
                <div className="space-y-1 text-[11.5px] text-white/55">
                  <div>Status: <Pill tone="success" icon={CheckCircle2}>Entsperrt</Pill></div>
                  <div>Fehlversuche: <span className="text-white/75 font-mono">{user.lock.failedLoginAttempts}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
            <Button
              onClick={() => setConfirmAction({ type: '2fa', email: user.email })}
              disabled={!user.twoFa.enabled || actionLoading !== null}
              className="h-10 px-4 rounded-xl text-[12.5px] font-medium border bg-orange-500/5 hover:bg-orange-500/15 text-orange-300/90 hover:text-orange-200 border-orange-500/20 hover:border-orange-500/35 disabled:opacity-30"
            >
              <ShieldOff className="w-4 h-4 mr-2" />
              2FA entfernen
            </Button>
            <Button
              onClick={() => setConfirmAction({ type: 'unlock', email: user.email })}
              disabled={(!user.lock.locked && user.lock.failedLoginAttempts === 0) || actionLoading !== null}
              className="h-10 px-4 rounded-xl text-[12.5px] font-medium border bg-green-500/5 hover:bg-green-500/15 text-green-300/90 hover:text-green-200 border-green-500/20 hover:border-green-500/35 disabled:opacity-30"
            >
              <Unlock className="w-4 h-4 mr-2" />
              {user.lock.locked ? 'Account entsperren' : 'Fehlversuche zurücksetzen'}
            </Button>
            <Button
              onClick={() => performSearch(user.email, 'email')}
              disabled={searchLoading}
              className="h-10 px-4 rounded-xl text-[12.5px] font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1] text-white/70 hover:text-white ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </div>
      )}

      {/* Bestätigungs-Dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px) saturate(160%)' }}
          onClick={() => actionLoading === null && setConfirmAction(null)}
        >
          <div
            className="p-6 max-w-md w-full rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(18,18,20,0.96) 0%, rgba(10,10,12,0.98) 100%)',
              border: confirmAction.type === '2fa'
                ? '1px solid rgba(249,115,22,0.25)'
                : '1px solid rgba(34,197,94,0.25)',
              boxShadow: '0 24px 60px -12px rgba(0,0,0,0.85)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: confirmAction.type === '2fa'
                  ? 'linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)',
              }}
            />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                style={
                  confirmAction.type === '2fa'
                    ? { background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.2)' }
                    : { background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' }
                }
              >
                {confirmAction.type === '2fa'
                  ? <ShieldOff className="w-5 h-5 text-orange-300" />
                  : <Unlock className="w-5 h-5 text-green-300" />}
              </div>
              <h3 className="text-[16px] font-semibold text-white tracking-tight">
                {confirmAction.type === '2fa' ? '2FA wirklich entfernen?' : 'Account wirklich entsperren?'}
              </h3>
            </div>
            <p className="text-white/55 text-[13px] mb-2 leading-relaxed">
              {confirmAction.type === '2fa' ? (
                <>
                  Du entfernst die 2-Faktor-Authentifizierung für <strong className="text-white/90">{confirmAction.email}</strong>.
                  Der Benutzer kann sich danach <b>ohne 2FA-Code</b> einloggen und muss 2FA selbst neu einrichten.
                </>
              ) : (
                <>
                  Du entsperrst den Account <strong className="text-white/90">{confirmAction.email}</strong> und
                  setzt die Anzahl der Fehlversuche auf <b>0</b> zurück. Der Benutzer kann sich danach wieder
                  normal anmelden.
                </>
              )}
            </p>
            <div className="text-[11px] text-white/35 mb-5 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              Der Benutzer wird per E-Mail benachrichtigt · Aktion wird geloggt.
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading !== null}
                className="h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/75 hover:text-white text-[12.5px] font-medium"
              >
                Abbrechen
              </Button>
              <Button
                onClick={confirmAction.type === '2fa' ? handleDisable2FA : handleUnlock}
                disabled={actionLoading !== null}
                className="h-10 px-4 rounded-xl border-0 text-white text-[12.5px] font-semibold disabled:opacity-50"
                style={
                  confirmAction.type === '2fa'
                    ? {
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.85), rgba(234,88,12,0.95))',
                        boxShadow: '0 4px 14px -4px rgba(249,115,22,0.4)',
                      }
                    : {
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(22,163,74,0.95))',
                        boxShadow: '0 4px 14px -4px rgba(34,197,94,0.4)',
                      }
                }
              >
                {actionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Wird ausgeführt…</>
                ) : confirmAction.type === '2fa' ? (
                  <><ShieldOff className="w-4 h-4 mr-2" /> 2FA entfernen</>
                ) : (
                  <><Unlock className="w-4 h-4 mr-2" /> Entsperren</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
