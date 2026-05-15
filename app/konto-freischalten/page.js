'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail, Loader2, CheckCircle2, ArrowLeft, ShieldCheck,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { IconInput } from '@/components/ui/IconInput';

// ─── Reauth Card (Account-Freischaltung per E-Mail-OTP) ─────────────
function ReauthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Done
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const requestCode = async (e) => {
    if (e) e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Bitte gültige E-Mail-Adresse eingeben');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/supabase/request-reauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.status === 429) {
        toast.error(data.error || 'Bitte kurz warten');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Fehler');
      toast.success('Wenn diese E-Mail existiert, ist der Code unterwegs.');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.message || 'Konnte Code nicht anfordern');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Bitte 6-stelligen Code eingeben');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/supabase/verify-reauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'EXPIRED') {
          toast.error('Code abgelaufen — bitte neuen Code anfordern');
          setCode('');
          setStep(1);
          return;
        }
        if (data.code === 'TOO_MANY_ATTEMPTS') {
          toast.error('Zu viele Fehlversuche — bitte neuen Code anfordern');
          setCode('');
          setStep(1);
          return;
        }
        toast.error(data.error || 'Ungültiger Code');
        setCode('');
        return;
      }
      toast.success('Account freigeschaltet!');
      setStep(3);
      setTimeout(() => {
        router.push(`/login?mode=email&email=${encodeURIComponent(email)}`);
      }, 2200);
    } catch (err) {
      toast.error(err.message || 'Verifizierung fehlgeschlagen');
    } finally {
      setLoading(false);
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
          <ShieldCheck className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white">Konto freischalten</h1>
          <p className="text-xs md:text-sm text-white/45 mt-0.5">
            {step === 1 && 'Bestätige deine Identität per E-Mail-Code'}
            {step === 2 && 'Gib den 6-stelligen Code aus der E-Mail ein'}
            {step === 3 && 'Erfolgreich freigeschaltet'}
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-3 md:p-4 mb-5 flex items-start gap-3"
        style={{
          background: 'rgba(234,179,8,0.07)',
          border: '1px solid rgba(234,179,8,0.25)',
        }}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-300" />
        <p className="text-xs md:text-sm text-yellow-100/85">
          Nach 3 fehlgeschlagenen Login-Versuchen wurde dein Konto gesperrt.
          Bestätige hier deine Identität per <b>E-Mail-Code</b>, um es wieder freizuschalten.
          Dein bisheriges Passwort bleibt erhalten.
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={requestCode} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">
              E-Mail-Adresse deines Kontos
            </label>
            <IconInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              icon={Mail}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 rounded-xl font-semibold text-sm md:text-base transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--theme-accent)', color: '#000' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sende Code…
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Code per E-Mail anfordern
              </>
            )}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="text-xs text-white/55 mb-1">
            Wir haben einen Code an <span className="text-white/85 font-medium">{email}</span> gesendet.
            Der Code ist 15 Minuten gültig.
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-white/70 mb-2">
              6-stelliger Bestätigungscode
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-4 py-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-center text-2xl md:text-3xl font-mono tracking-[0.5em] font-semibold"
              autoComplete="one-time-code"
              autoFocus
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 rounded-xl font-semibold text-sm md:text-base transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--theme-accent)', color: '#000' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifiziere…
              </>
            ) : (
              'Konto freischalten'
            )}
          </button>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setStep(1); setCode(''); }}
              className="text-xs md:text-sm text-white/55 hover:text-white underline flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              E-Mail ändern
            </button>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={resendCooldown > 0 || loading}
              className="text-xs md:text-sm text-white/55 hover:text-white underline disabled:opacity-40 disabled:no-underline flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {resendCooldown > 0 ? `Erneut in ${resendCooldown}s` : 'Code erneut senden'}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-white">Account freigeschaltet!</p>
          <p className="text-sm text-white/55 text-center px-4">
            Du wirst zum Login weitergeleitet…
          </p>
        </div>
      )}
    </div>
  );
}

function KontoFreischaltenContent() {
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
          style={{ background: 'rgba(234, 179, 8, 0.18)' }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 md:mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Login
        </Link>

        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Konto <span style={{ color: 'var(--theme-accent)' }}>freischalten</span>
          </h1>
          <p className="text-sm md:text-base text-white/50">
            Schalte dein gesperrtes Konto per E-Mail-Code wieder frei
          </p>
        </div>

        {/* Reauth Card */}
        <ReauthCard />

        {/* Footer */}
        <p className="text-center text-[11px] md:text-xs text-white/30 mt-6 md:mt-8">
          Probleme beim Freischalten?{' '}
          <Link href="/login" className="underline hover:text-white/60">
            Zurück zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function KontoFreischaltenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      }
    >
      <KontoFreischaltenContent />
    </Suspense>
  );
}
