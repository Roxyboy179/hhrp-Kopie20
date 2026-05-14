'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, Mail, KeyRound, ShieldCheck, ShieldAlert, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettingsSection({ discordEmail }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // { hasAccount, email, emailVerified, ... }

  // Sign-up form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Change password form
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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/supabase/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Konto erstellt! Bitte bestätige deine E-Mail.');
      setPassword('');
      setConfirmPassword('');
      await loadStatus();
    } catch (err) {
      toast.error(err.message || 'Konto-Erstellung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  };

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

  // === Kein Konto vorhanden -> Erstellen ===
  if (!status?.hasAccount) {
    const emailToUse = status?.discordEmail || discordEmail || '';
    return (
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(var(--theme-accent-rgb), 0.12)',
              border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
            }}
          >
            <UserCheck className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mein Konto erstellen</h2>
            <p className="text-xs text-white/40">
              Erstelle einen Login mit E-Mail + Passwort (verknüpft mit deinem Discord)
            </p>
          </div>
        </div>

        {!emailToUse ? (
          <div
            className="rounded-xl p-4 text-sm flex items-start gap-2"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-medium">Discord-Email fehlt</p>
              <p className="text-red-300/70 text-xs mt-1">
                Bitte melde dich erneut mit Discord an, damit wir deine E-Mail-Adresse erhalten.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                E-Mail-Adresse <span className="text-white/30">(automatisch von Discord)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={emailToUse}
                  disabled
                  readOnly
                  className="w-full pl-10 pr-3 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white/70 text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-white/35 mt-1.5">
                Die E-Mail ist mit deinem Discord-Account verknüpft und kann nicht geändert werden.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Passwort</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
                  placeholder="Mindestens 8 Zeichen"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Passwort wiederholen
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
              />
            </div>

            <div
              className="rounded-xl p-3 text-xs flex items-start gap-2"
              style={{
                background: 'rgba(var(--theme-accent-rgb), 0.06)',
                border: '1px solid rgba(var(--theme-accent-rgb), 0.15)',
              }}
            >
              <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--theme-accent)' }} />
              <p className="text-white/60">
                Nach der Erstellung schicken wir dir eine Bestätigungs-Mail. Du kannst dich erst
                einloggen, wenn du deine E-Mail verifiziert hast.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Erstelle Konto…
                </>
              ) : (
                'Konto erstellen'
              )}
            </button>
          </form>
        )}
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
