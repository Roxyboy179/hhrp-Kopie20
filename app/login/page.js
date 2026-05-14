'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail, KeyRound, Eye, EyeOff, Loader2, CheckCircle2, XCircle,
  ArrowLeft, ShieldCheck, Sparkles, AlertCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { IconInput } from '@/components/ui/IconInput';

const DiscordIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

// ─── Email/Password Form ───────────────────────────────────────────
function EmailLoginCard() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);

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
        throw new Error(data.error || 'Login fehlgeschlagen');
      }
      toast.success('Erfolgreich angemeldet');
      await refreshUser();
      router.push('/profil');
    } catch (err) {
      toast.error(err.message || 'Login fehlgeschlagen');
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
    <div
      className="glass rounded-2xl p-6 md:p-8 border border-white/[0.08]"
      style={{ background: 'rgba(8, 8, 8, 0.65)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(var(--theme-accent-rgb), 0.12)',
            border: '1px solid rgba(var(--theme-accent-rgb), 0.25)',
          }}
        >
          <Mail className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white">Mit E-Mail anmelden</h1>
          <p className="text-xs md:text-sm text-white/45 mt-0.5">
            Login mit E-Mail-Adresse und Passwort
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">
            E-Mail-Adresse
          </label>
          <IconInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="deine@discord-email.de"
            icon={Mail}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">Passwort</label>
          <IconInput
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            icon={KeyRound}
            rightAction={{
              onClick: () => setShowPw((v) => !v),
              icon: showPw ? EyeOff : Eye,
              label: showPw ? 'Passwort verbergen' : 'Passwort anzeigen',
            }}
          />
        </div>

        {needsVerify && (
          <div
            className="rounded-xl p-4 text-xs md:text-sm flex items-start gap-3"
            style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
            }}
          >
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-yellow-200 font-medium mb-1">E-Mail noch nicht bestätigt</p>
              <p className="text-yellow-200/70 text-xs mb-2">
                Bitte prüfe dein Postfach (auch den Spam-Ordner).
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-yellow-300 hover:text-yellow-200 text-xs font-medium underline disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Bestätigungs-Mail erneut senden
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm md:text-base transition flex items-center justify-center gap-2 disabled:opacity-50"
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

        <div className="flex items-center justify-between text-xs md:text-sm pt-2">
          <Link
            href="/auth/reset-password"
            className="text-white/55 hover:text-white underline transition"
          >
            Passwort vergessen?
          </Link>
          <Link
            href="/konto-erstellen"
            className="text-white/55 hover:text-white underline transition"
          >
            Noch kein Konto?
          </Link>
        </div>

        <div
          className="rounded-xl p-3.5 text-xs md:text-sm flex items-start gap-2 mt-2"
          style={{
            background: 'rgba(var(--theme-accent-rgb), 0.05)',
            border: '1px solid rgba(var(--theme-accent-rgb), 0.12)',
          }}
        >
          <Sparkles
            className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
            style={{ color: 'var(--theme-accent)' }}
          />
          <p className="text-white/55">
            Um ein „Nur Login"-Konto zu erstellen, musst du zuerst über Discord angemeldet sein.
            Klicke oben auf <b className="text-white/80">Discord Login</b> oder besuche die
            Konto-Erstellungsseite über deinen Discord-Account.
          </p>
        </div>
      </form>
    </div>
  );
}

// ─── Discord OAuth Card ───────────────────────────────────────────
function DiscordLoginCard() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const popupRef = useRef(null);
  const checkClosedIntervalRef = useRef(null);

  const openDiscordPopup = useCallback(() => {
    setStatus('loading');
    setErrorMessage('');
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
    } else {
      setStatus('error');
      setErrorMessage('Popup wurde blockiert. Bitte erlaube Popups für diese Seite.');
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.type === 'discord-auth') {
        if (data.success) {
          setStatus('success');
          setTimeout(async () => {
            await refreshUser();
            router.push('/profil');
          }, 1500);
        } else if (data.error) {
          setStatus('error');
          const map = {
            discord_denied: 'Du hast die Anmeldung abgebrochen.',
            no_code: 'Kein Autorisierungscode erhalten.',
            token_failed: 'Token-Austausch fehlgeschlagen.',
            user_failed: 'Benutzer-Daten konnten nicht abgerufen werden.',
            not_member: 'Du bist nicht Mitglied des Hamburg Horizon Discord-Servers.',
            auth_failed: 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.',
          };
          setErrorMessage(map[data.error] || 'Ein unbekannter Fehler ist aufgetreten.');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      if (checkClosedIntervalRef.current) clearInterval(checkClosedIntervalRef.current);
    };
  }, [refreshUser, router]);

  return (
    <div
      className="glass rounded-2xl p-6 md:p-8 border border-white/[0.08]"
      style={{ background: 'rgba(8, 8, 8, 0.65)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(88, 101, 242, 0.15)',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            color: '#5865F2',
          }}
        >
          <DiscordIcon size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white">Mit Discord anmelden</h1>
          <p className="text-xs md:text-sm text-white/45 mt-0.5">
            Schneller Login über deinen Discord-Account
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs md:text-sm text-white/70">
                Keine Registrierung nötig — einfach über deinen bestehenden Discord-Account
                anmelden.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs md:text-sm text-white/70">
                Sichere OAuth2-Anmeldung — wir bekommen nie dein Discord-Passwort.
              </p>
            </div>
          </div>

          <button
            onClick={openDiscordPopup}
            className="w-full py-3.5 rounded-xl font-semibold text-sm md:text-base transition flex items-center justify-center gap-3 text-white"
            style={{ background: '#5865F2' }}
          >
            <DiscordIcon size={20} />
            Mit Discord anmelden
          </button>

          <p className="text-[11px] md:text-xs text-white/30 text-center mt-4">
            Voraussetzung: Mitgliedschaft im Hamburg Horizon RP Discord-Server.
          </p>
        </>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-5 py-8">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#5865F2' }} />
          <p className="text-center text-sm md:text-base text-white/80">
            Bitte warte, während du mit Discord angemeldet wirst…
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-white">Willkommen zurück!</p>
          <p className="text-xs text-white/40">Du wirst weitergeleitet…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)' }}
          >
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg font-semibold text-white">Anmeldung fehlgeschlagen</p>
          <p className="text-sm text-white/60 text-center px-4">{errorMessage}</p>
          <button
            onClick={openDiscordPopup}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: '#5865F2' }}
          >
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Login Page ───────────────────────────────────────────────
function LoginPageContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'discord' ? 'discord' : 'email';
  const reason = searchParams.get('reason');
  const [mode, setMode] = useState(initialMode);
  const { user } = useAuth();
  const router = useRouter();

  // Bereits eingeloggt? -> ab zum Profil
  useEffect(() => {
    if (user) {
      router.replace('/profil');
    }
  }, [user, router]);

  const tabs = [
    { id: 'email', label: 'Nur Login', icon: Mail },
    { id: 'discord', label: 'Discord Login', icon: DiscordIcon },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
      }}
    >
      {/* Animated background glow */}
      <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'rgba(88, 101, 242, 0.3)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 md:mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Anmelden bei <span style={{ color: 'var(--theme-accent)' }}>HHRP</span>
          </h1>
          <p className="text-sm md:text-base text-white/50">
            Wähle deine bevorzugte Anmelde-Methode
          </p>
        </div>

        {/* Reason Banner (z.B. wenn von Konto-Erstellung umgeleitet) */}
        {reason === 'register' && (
          <div
            className="rounded-xl p-4 mb-5 md:mb-6 flex items-start gap-3"
            style={{
              background: 'rgba(88, 101, 242, 0.08)',
              border: '1px solid rgba(88, 101, 242, 0.25)',
            }}
          >
            <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#a5acff' }} />
            <div className="min-w-0">
              <p className="text-sm md:text-base font-medium text-white">
                Erst Discord-Login, dann Konto erstellen
              </p>
              <p className="text-xs md:text-sm text-white/55 mt-1">
                Um ein „Nur Login"-Konto zu erstellen, musst du dich zuerst mit Discord
                anmelden. Wähle unten <b className="text-white/80">Discord Login</b>.
              </p>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div
          className="glass rounded-2xl p-2 mb-5 md:mb-6 border border-white/[0.08]"
          style={{ background: 'rgba(8, 8, 8, 0.65)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex gap-1.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = mode === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 md:py-3.5 px-3 rounded-xl text-xs md:text-sm font-medium transition"
                  style={{
                    background: active
                      ? t.id === 'discord'
                        ? 'rgba(88, 101, 242, 0.18)'
                        : 'rgba(var(--theme-accent-rgb), 0.15)'
                      : 'transparent',
                    border: `1px solid ${
                      active
                        ? t.id === 'discord'
                          ? 'rgba(88, 101, 242, 0.4)'
                          : 'rgba(var(--theme-accent-rgb), 0.35)'
                        : 'transparent'
                    }`,
                    color: active
                      ? t.id === 'discord'
                        ? '#a5acff'
                        : 'var(--theme-accent)'
                      : 'rgba(255,255,255,0.55)',
                  }}
                >
                  <Icon size={16} className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {mode === 'email' && <EmailLoginCard />}
        {mode === 'discord' && <DiscordLoginCard />}

        {/* Footer */}
        <p className="text-center text-[11px] md:text-xs text-white/30 mt-6 md:mt-8">
          Mit der Anmeldung stimmst du unseren{' '}
          <Link href="/nutzungsbedingungen" className="underline hover:text-white/60">
            Nutzungsbedingungen
          </Link>{' '}
          und{' '}
          <Link href="/datenschutz" className="underline hover:text-white/60">
            Datenschutzbestimmungen
          </Link>{' '}
          zu.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
