'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCheck, Mail, KeyRound, ShieldCheck, ShieldAlert, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, ArrowRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettingsSection({ discordEmail }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // { hasAccount, email, emailVerified, ... }

  // Change password form (nur wenn Konto vorhanden)
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [showChangePw, setShowChangePw] = useState(false);
  const [changing, setChanging] = useState(false);

  // Misc
  const [resending, setResending] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/supabase/status', { credentials: 'include' });
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('[mein-konto] load status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleResend = async () => {
    if (!status?.email) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/supabase/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: status.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Bestätigungs-Mail erneut verschickt');
    } catch (err) {
      toast.error(err.message || 'Fehler beim Senden');
    } finally {
      setResending(false);
    }
  };

  const handleRequestReset = async () => {
    if (!status?.email) return;
    setRequestingReset(true);
    try {
      const res = await fetch('/api/auth/supabase/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: status.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Passwort-Reset-Mail verschickt');
    } catch (err) {
      toast.error(err.message || 'Fehler');
    } finally {
      setRequestingReset(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error('Neues Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (newPw !== newPwConfirm) {
      toast.error('Neue Passwörter stimmen nicht überein');
      return;
    }
    setChanging(true);
    try {
      const res = await fetch('/api/auth/supabase/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Passwort aktualisiert');
      setCurrentPw('');
      setNewPw('');
      setNewPwConfirm('');
    } catch (err) {
      toast.error(err.message || 'Passwort-Änderung fehlgeschlagen');
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 border border-white/[0.08] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  // === Kein Konto vorhanden -> Call-to-Action zu eigener Seite ===
  if (!status?.hasAccount) {
    return (
      <div
        className="glass rounded-2xl p-6 md:p-8 border border-white/[0.08]"
        style={{ background: 'rgba(8, 8, 8, 0.45)' }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(var(--theme-accent-rgb), 0.12)',
              border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
            }}
          >
            <UserCheck className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white">Du hast noch kein Login-Konto</h2>
            <p className="text-xs md:text-sm text-white/45 mt-0.5">
              Erstelle einen Login mit E-Mail-Adresse und Passwort
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
            <p className="text-xs md:text-sm text-white/70">
              Email-Login mit deiner Discord-Email — schneller anmelden ohne Discord-Popup.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
            <p className="text-xs md:text-sm text-white/70">
              Sicheres eigenes Passwort — bei Bedarf jederzeit zurücksetzbar.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
            <p className="text-xs md:text-sm text-white/70">
              Mit Discord-Account verknüpft — Server-Rollen & Berechtigungen bleiben erhalten.
            </p>
          </div>
        </div>

        <Link
          href="/konto-erstellen"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm md:text-base transition"
          style={{ background: 'var(--theme-accent)', color: '#000' }}
        >
          <Sparkles className="w-4 h-4" />
          Konto jetzt erstellen
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-[11px] md:text-xs text-white/35 text-center mt-3">
          Die E-Mail wird automatisch von deinem Discord-Account übernommen.
        </p>
      </div>
    );
  }

  // === Konto vorhanden -> Status + Passwort ändern ===
  return (
    <div className="space-y-5">
      {/* Status Card */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: status.emailVerified
                ? 'rgba(34,197,94,0.12)'
                : 'rgba(234,179,8,0.12)',
              border: `1px solid ${status.emailVerified ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)'}`,
            }}
          >
            {status.emailVerified ? (
              <ShieldCheck className="w-5 h-5 text-green-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mein Login-Konto</h2>
            <p className="text-xs text-white/40">
              {status.emailVerified ? 'E-Mail bestätigt' : 'E-Mail noch nicht bestätigt'}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-xs text-white/50">E-Mail</span>
            <span className="text-sm text-white font-medium">{status.email}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-xs text-white/50">Status</span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                status.emailVerified
                  ? 'bg-green-500/10 text-green-300 border border-green-500/25'
                  : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/25'
              }`}
            >
              {status.emailVerified ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Bestätigt
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Unbestätigt
                </>
              )}
            </span>
          </div>
        </div>

        {!status.emailVerified && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
            style={{
              background: 'rgba(234,179,8,0.12)',
              border: '1px solid rgba(234,179,8,0.3)',
              color: '#fde047',
            }}
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Bestätigungs-Mail erneut senden
          </button>
        )}
      </div>

      {/* Change Password Card */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(var(--theme-accent-rgb), 0.12)',
              border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
            }}
          >
            <KeyRound className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Passwort ändern</h2>
            <p className="text-xs text-white/40">Setze ein neues Passwort für deinen Login</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Aktuelles Passwort
            </label>
            <div className="relative">
              <input
                type={showChangePw ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 bg-white/[0.04] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/25 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowChangePw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showChangePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Neues Passwort</label>
            <input
              type={showChangePw ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/25 text-sm"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Neues Passwort wiederholen
            </label>
            <input
              type={showChangePw ? 'text' : 'password'}
              value={newPwConfirm}
              onChange={(e) => setNewPwConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/25 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={changing}
            className="w-full py-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--theme-accent)', color: '#000' }}
          >
            {changing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aktualisiere…
              </>
            ) : (
              'Passwort ändern'
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <button
            onClick={handleRequestReset}
            disabled={requestingReset}
            className="text-xs text-white/50 hover:text-white underline disabled:opacity-50"
          >
            {requestingReset ? 'Wird gesendet…' : 'Passwort vergessen? Reset-Link per E-Mail anfordern'}
          </button>
        </div>
      </div>
    </div>
  );
}
