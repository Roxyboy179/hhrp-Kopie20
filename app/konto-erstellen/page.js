'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck, Mail, KeyRound, Eye, EyeOff, Loader2,
  CheckCircle2, ArrowLeft, AlertCircle, ShieldCheck, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';

export default function KontoErstellenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [statusLoading, setStatusLoading] = useState(true);
  const [linkStatus, setLinkStatus] = useState(null); // { hasAccount, email, discordEmail }

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auth-Status holen
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Nicht eingeloggt -> ab zur Login-Seite (Discord erforderlich)
      router.replace('/login?mode=discord&reason=register');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/supabase/status', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json();
        if (!cancelled) setLinkStatus(data);
      } catch (e) {
        console.error('[konto-erstellen] status load:', e);
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
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
      setSuccess(true);
      toast.success('Konto erstellt! Bitte bestätige deine E-Mail.');
    } catch (err) {
      toast.error(err.message || 'Konto-Erstellung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  const discordEmail = linkStatus?.discordEmail || user?.email || '';

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
      }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgba(var(--theme-accent-rgb), 0.3)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'rgba(34, 197, 94, 0.25)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/profil?tab=settings"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 md:mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Profil
        </Link>

        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Konto <span style={{ color: 'var(--theme-accent)' }}>erstellen</span>
          </h1>
          <p className="text-sm md:text-base text-white/50">
            Erstelle einen Login mit E-Mail-Adresse und Passwort
          </p>
        </div>

        {/* === Bereits Konto vorhanden === */}
        {linkStatus?.hasAccount && !success && (
          <div
            className="glass rounded-2xl p-6 md:p-8 border border-white/[0.08] text-center"
            style={{ background: 'rgba(8, 8, 8, 0.65)', backdropFilter: 'blur(20px)' }}
          >
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '2px solid rgba(34,197,94,0.3)',
              }}
            >
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Du hast bereits ein Konto
            </h2>
            <p className="text-sm md:text-base text-white/55 mb-6">
              Dein Login-Konto ist bereits mit{' '}
              <b className="text-white">{linkStatus.email}</b> verknüpft.
            </p>
            <Link
              href="/profil?tab=settings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              Zu meinen Konto-Einstellungen
            </Link>
          </div>
        )}

        {/* === Success State === */}
        {success && (
          <div
            className="glass rounded-2xl p-6 md:p-8 border border-white/[0.08] text-center"
            style={{ background: 'rgba(8, 8, 8, 0.65)', backdropFilter: 'blur(20px)' }}
          >
            <div
              className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '2px solid rgba(34,197,94,0.3)',
              }}
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Konto erstellt!</h2>
            <p className="text-sm md:text-base text-white/55 mb-2">
              Wir haben dir eine Bestätigungs-Mail an{' '}
              <b className="text-white">{discordEmail}</b> geschickt.
            </p>
            <p className="text-xs md:text-sm text-white/40 mb-6">
              Bitte klicke auf den Link in der Mail, um deine E-Mail-Adresse zu verifizieren.
              Erst danach kannst du dich mit E-Mail + Passwort einloggen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/profil?tab=settings"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition"
                style={{ background: 'var(--theme-accent)', color: '#000' }}
              >
                Zum Profil
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition border border-white/15 text-white hover:bg-white/[0.04]"
              >
                Zur Login-Seite
              </Link>
            </div>
          </div>
        )}

        {/* === Erstellen-Formular === */}
        {!linkStatus?.hasAccount && !success && (
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
                <UserCheck className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white">Mein Konto erstellen</h2>
                <p className="text-xs md:text-sm text-white/45 mt-0.5">
                  Verknüpft mit deinem Discord-Account
                </p>
              </div>
            </div>

            {!discordEmail ? (
              <div
                className="rounded-xl p-4 text-sm flex items-start gap-3"
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">
                    E-Mail-Adresse{' '}
                    <span className="text-white/30 font-normal">(automatisch von Discord)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={discordEmail}
                      disabled
                      readOnly
                      className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/10 rounded-xl text-white/70 text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] md:text-xs text-white/35 mt-1.5">
                    Die E-Mail ist mit deinem Discord-Account verknüpft und kann nicht geändert
                    werden.
                  </p>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">
                    Passwort
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Mindestens 8 Zeichen"
                      className="w-full pl-11 pr-11 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">
                    Passwort wiederholen
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
                  />
                </div>

                <div
                  className="rounded-xl p-3.5 text-xs md:text-sm flex items-start gap-2"
                  style={{
                    background: 'rgba(var(--theme-accent-rgb), 0.06)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.15)',
                  }}
                >
                  <Mail
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--theme-accent)' }}
                  />
                  <p className="text-white/60">
                    Nach der Erstellung schicken wir dir eine Bestätigungs-Mail. Du kannst dich erst
                    einloggen, wenn du deine E-Mail verifiziert hast.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm md:text-base transition flex items-center justify-center gap-2 disabled:opacity-50"
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

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="text-xs md:text-sm text-white/45 hover:text-white underline"
                  >
                    Du hast schon ein Konto? Hier einloggen
                  </Link>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] md:text-xs text-white/30 mt-6 md:mt-8">
          Mit der Konto-Erstellung stimmst du unseren{' '}
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
