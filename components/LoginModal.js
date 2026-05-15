'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Mail, KeyRound, Eye, EyeOff, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

const DiscordIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

// ─── Discord OAuth Sub-Flow ─────────────────────────────────────────
function DiscordFlow({ onBack, onClose, refreshUser }) {
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [countdown, setCountdown] = useState(30);
  const popupRef = useRef(null);
  const checkClosedIntervalRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const openDiscordPopup = useCallback(() => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      '/api/auth/discord',
      'DiscordAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    if (popup) {
      popupRef.current = popup;
      if (checkClosedIntervalRef.current) clearInterval(checkClosedIntervalRef.current);
      checkClosedIntervalRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosedIntervalRef.current);
          setStatus((prev) => {
            if (prev === 'loading') {
              setErrorMessage('Anmeldung wurde abgebrochen.');
              return 'error';
            }
            return prev;
          });
        }
      }, 500);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.type === 'discord-auth') {
        if (data.success) {
          setStatus('success');
        } else if (data.error) {
          setStatus('error');
          setErrorCode(data.error);
          const map = {
            discord_denied: 'Du hast die Anmeldung abgebrochen.',
            no_code: 'Kein Autorisierungscode erhalten.',
            token_failed: 'Token-Austausch fehlgeschlagen.',
            user_failed: 'Benutzer-Daten konnten nicht abgerufen werden.',
            not_member: 'Du bist nicht Mitglied des Hamburg Horizon Discord-Servers.',
            account_locked: 'Dein Login-Konto wurde nach 3 fehlgeschlagenen Login-Versuchen gesperrt. Bitte schalte dein Konto per E-Mail-Code wieder frei.',
            auth_failed: 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.',
          };
          // Heuristik: Wenn der Code "lock" / "lock" enthält → Sperr-Meldung
          let resolved = map[data.error];
          if (!resolved && /lock|gesperr/i.test(String(data.error))) {
            resolved = map.account_locked;
            setErrorCode('account_locked');
          }
          setErrorMessage(resolved || 'Ein unbekannter Fehler ist aufgetreten.');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    setCountdown(30);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (status === 'success') {
            onClose();
            setTimeout(() => refreshUser(), 100);
          } else {
            onClose();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimerRef.current);
  }, [status, onClose, refreshUser]);

  useEffect(() => {
    const t = setTimeout(() => openDiscordPopup(), 100);
    return () => {
      clearTimeout(t);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      if (checkClosedIntervalRef.current) clearInterval(checkClosedIntervalRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [openDiscordPopup]);

  return (
    <div className="py-6">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-16 h-16 animate-spin" style={{ color: 'var(--theme-accent)' }} />
          <p className="text-center text-base text-white/80">
            Bitte warte, während du mit Discord angemeldet wirst…
          </p>
          <button onClick={onBack} className="text-xs text-white/40 hover:text-white/70 underline">
            Abbrechen & zurück
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-white">Willkommen zurück!</p>
          <p className="text-xs text-white/40">Schließt automatisch in {countdown}s</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-lg font-semibold text-white">
            {errorCode === 'account_locked' ? 'Account gesperrt' : 'Anmeldung fehlgeschlagen'}
          </p>
          <p className="text-sm text-white/60 text-center px-4">{errorMessage}</p>
          {errorCode && (
            <p className="text-[10px] text-white/30 font-mono text-center">
              Code: {errorCode}
            </p>
          )}
          {errorCode === 'account_locked' ? (
            <div className="flex flex-col gap-2 mt-2 w-full px-4">
              <Link
                href="/login?mode=reauth"
                onClick={onClose}
                className="w-full text-center py-2.5 rounded-lg font-medium text-sm transition inline-flex items-center justify-center gap-2"
                style={{ background: 'var(--theme-accent)', color: '#000' }}
              >
                <ShieldCheck className="w-4 h-4" />
                Konto freischalten
              </Link>
              <Button onClick={onBack} variant="ghost" className="text-white/70 w-full">
                Zurück zur Auswahl
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 mt-2">
              <Button onClick={onBack} variant="ghost" className="text-white/70">Zurück</Button>
              <Button
                onClick={() => { setStatus('loading'); openDiscordPopup(); }}
                style={{ background: 'var(--theme-accent)', color: '#000' }}
              >
                Erneut versuchen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Email/Password Login Sub-Flow ──────────────────────────────────
function EmailLoginFlow({ onBack, onClose, refreshUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);

  // 2FA-Challenge State
  const [twoFAStage, setTwoFAStage] = useState(false);
  const [twoFAChallengeId, setTwoFAChallengeId] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAUseBackup, setTwoFAUseBackup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setNeedsVerify(false);
    try {
      const res = await fetch('/api/auth/supabase/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_CONFIRMED') {
          setNeedsVerify(true);
          toast.error('E-Mail noch nicht bestätigt');
          return;
        }
        if (data.code === 'ACCOUNT_LOCKED') {
          toast.error('Account gesperrt — bitte freischalten');
          onClose();
          // kleinen Tick warten, damit das Modal sauber schließt, dann navigieren
          setTimeout(() => {
            try {
              window.location.href = `/login?mode=reauth&email=${encodeURIComponent(email)}`;
            } catch { /* noop */ }
          }, 80);
          return;
        }
        throw new Error(data.error || 'Login fehlgeschlagen');
      }
      // 2FA erforderlich? → Stage wechseln
      if (data.requires2FA && data.challengeId) {
        setTwoFAChallengeId(data.challengeId);
        setTwoFAStage(true);
        setTwoFACode('');
        toast.success('Bitte gib deinen 2FA-Code ein');
        return;
      }
      toast.success('Erfolgreich angemeldet');
      onClose();
      setTimeout(() => refreshUser(), 100);
    } catch (err) {
      toast.error(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    const code = twoFACode.trim();
    if (!code) {
      toast.error('Bitte Code eingeben');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/supabase/login-verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challengeId: twoFAChallengeId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'CHALLENGE_EXPIRED') {
          toast.error('Sitzung abgelaufen — bitte erneut anmelden');
          setTwoFAStage(false);
          setTwoFAChallengeId('');
          setTwoFACode('');
          setPassword('');
          return;
        }
        if (data.code === 'INVALID_2FA') {
          toast.error('Ungültiger Code');
          // Challenge wurde konsumiert → Re-Login nötig
          setTwoFAStage(false);
          setTwoFAChallengeId('');
          setTwoFACode('');
          setPassword('');
          return;
        }
        throw new Error(data.error || 'Verifizierung fehlgeschlagen');
      }
      toast.success('Erfolgreich angemeldet');
      onClose();
      setTimeout(() => refreshUser(), 100);
    } catch (err) {
      toast.error(err.message || 'Verifizierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/supabase/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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

  return (
    <div className="pt-2 pb-1">
      <button
        onClick={() => {
          if (twoFAStage) {
            // Aus 2FA-Stage zurück → Re-Login
            setTwoFAStage(false);
            setTwoFAChallengeId('');
            setTwoFACode('');
            setPassword('');
            return;
          }
          onBack();
        }}
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white/80 mb-4 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {twoFAStage ? 'Zurück zum Login' : 'Zurück zur Auswahl'}
      </button>

      {twoFAStage ? (
        <form onSubmit={handleVerify2FA} className="space-y-4">
          <div className="text-center mb-2">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{
                background: 'rgba(var(--theme-accent-rgb), 0.12)',
                border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
              }}
            >
              <ShieldCheck className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
            </div>
            <h3 className="text-white font-semibold text-base mb-1">2FA-Code erforderlich</h3>
            <p className="text-xs text-white/50">
              {twoFAUseBackup
                ? 'Gib einen deiner Backup-Codes ein.'
                : 'Öffne deine Authenticator-App und gib den 6-stelligen Code ein.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              {twoFAUseBackup ? 'Backup-Code' : '6-stelliger Code'}
            </label>
            <input
              type="text"
              inputMode={twoFAUseBackup ? 'text' : 'numeric'}
              value={twoFACode}
              onChange={(e) => {
                const v = twoFAUseBackup ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFACode(v);
              }}
              maxLength={twoFAUseBackup ? 9 : 6}
              placeholder={twoFAUseBackup ? 'XXXX-XXXX' : '123456'}
              className="w-full px-3 py-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-center text-2xl font-mono tracking-[0.4em] font-semibold"
              autoComplete="one-time-code"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !twoFACode}
            className="w-full py-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--theme-accent)', color: '#000' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifiziere…
              </>
            ) : (
              'Code bestätigen'
            )}
          </button>

          <button
            type="button"
            onClick={() => { setTwoFAUseBackup((v) => !v); setTwoFACode(''); }}
            className="w-full text-xs text-white/50 hover:text-white underline"
          >
            {twoFAUseBackup ? 'Stattdessen App-Code verwenden' : 'Stattdessen Backup-Code verwenden'}
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">E-Mail-Adresse</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full pl-10 pr-3 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
              placeholder="deine@discord-email.de"
            />
          </div>
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
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
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

        {needsVerify && (
          <div
            className="rounded-xl p-3 text-xs"
            style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
            }}
          >
            <p className="text-yellow-200 mb-2">
              Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte prüfe dein Postfach.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-yellow-300 underline hover:text-yellow-200 disabled:opacity-50"
            >
              {resending ? 'Wird gesendet…' : 'Bestätigungs-Mail erneut senden'}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--theme-accent)', color: '#000' }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Anmelden…
            </>
          ) : (
            'Anmelden'
          )}
        </button>

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            href="/auth/reset-password"
            onClick={onClose}
            className="text-white/50 hover:text-white underline"
          >
            Passwort vergessen?
          </Link>
          <span className="text-white/30">Noch kein Konto?</span>
        </div>

        <div
          className="rounded-xl p-3 text-xs text-white/50 mt-1"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 text-white/40" />
          Ein „Nur Login"-Konto kannst du im Profil unter <b className="text-white/70">Einstellungen → Mein Konto</b> erstellen (Discord-Login erforderlich).
        </div>
      </form>
      )}
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────
export function LoginModal({ open, onOpenChange }) {
  const { refreshUser } = useAuth();
  // mode: 'choose' | 'discord' | 'email'
  const [mode, setMode] = useState('choose');

  useEffect(() => {
    if (!open) {
      setMode('choose');
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: 'rgba(8, 8, 8, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(var(--theme-accent-rgb), 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            {mode === 'choose' && 'Anmelden bei HHRP'}
            {mode === 'discord' && 'Discord Anmeldung'}
            {mode === 'email' && 'Mit E-Mail anmelden'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="py-2 space-y-3">
            <p className="text-center text-sm text-white/50 mb-4">
              Wähle deine bevorzugte Anmelde-Methode
            </p>

            <button
              onClick={() => setMode('email')}
              className="w-full p-4 rounded-xl flex items-center gap-3 text-left transition group"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(var(--theme-accent-rgb), 0.12)',
                  border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
                }}
              >
                <Mail className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">Nur Login</p>
                <p className="text-xs text-white/45 mt-0.5">
                  E-Mail-Adresse + Passwort
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('discord')}
              className="w-full p-4 rounded-xl flex items-center gap-3 text-left transition group"
              style={{
                background: 'rgba(88, 101, 242, 0.08)',
                border: '1px solid rgba(88, 101, 242, 0.25)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(88, 101, 242, 0.18)',
                  border: '1px solid rgba(88, 101, 242, 0.35)',
                  color: '#5865F2',
                }}
              >
                <DiscordIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">Discord Login</p>
                <p className="text-xs text-white/45 mt-0.5">
                  Mit deinem Discord-Account anmelden
                </p>
              </div>
            </button>

            <p className="text-[11px] text-white/30 text-center pt-2">
              Beide Methoden setzen Mitgliedschaft im Hamburg Horizon RP Discord-Server voraus.
            </p>
          </div>
        )}

        {mode === 'discord' && (
          <DiscordFlow
            onBack={() => setMode('choose')}
            onClose={handleClose}
            refreshUser={refreshUser}
          />
        )}

        {mode === 'email' && (
          <EmailLoginFlow
            onBack={() => setMode('choose')}
            onClose={handleClose}
            refreshUser={refreshUser}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
