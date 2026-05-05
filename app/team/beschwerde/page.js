'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ShieldAlert,
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
  Lock,
  CheckCircle2,
  User as UserIcon,
} from 'lucide-react';

const inputClass =
  'w-full bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/10 focus:outline-none rounded-xl backdrop-blur-sm px-4 py-3 transition-all';

export default function TeamBeschwerdePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [teamlerName, setTeamlerName] = useState('');
  const [grund, setGrund] = useState('');
  const [vorfall, setVorfall] = useState('');
  const [bestaetigt, setBestaetigt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;

        if (!data?.user) {
          toast.error('Nicht eingeloggt', {
            description: 'Du musst eingeloggt sein, um diese Seite zu nutzen.',
          });
          router.push('/');
          return;
        }
        if (!data.user.isTeamMember) {
          toast.error('Keine Berechtigung', {
            description: 'Diese Seite ist nur für Team-Mitglieder zugänglich.',
          });
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (e) {
        console.error(e);
        if (!cancelled) router.push('/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!teamlerName.trim() || !grund.trim() || !vorfall.trim()) {
      toast.error('Fehler', { description: 'Bitte fülle alle Felder aus.' });
      return;
    }
    if (!bestaetigt) {
      toast.error('Bestätigung fehlt', {
        description: 'Bitte bestätige den Hinweis zu falschen Beschwerden.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/team/beschwerde', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamlerName: teamlerName.trim(),
          grund: grund.trim(),
          vorfall: vorfall.trim(),
          bestaetigt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unbekannter Fehler');

      toast.success('Beschwerde übermittelt', {
        description: 'Deine Meldung wurde sicher an die Leitung weitergeleitet.',
      });
      setSuccess(true);
      setTeamlerName('');
      setGrund('');
      setVorfall('');
      setBestaetigt(false);
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0b' }}>
        <Loader2 className="w-7 h-7 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#0a0a0b' }}>
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(239,68,68,0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,255,255,0.025), transparent 60%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-red-500/20"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Team-Beschwerde
              </h1>
              <p className="text-sm text-white/50 mt-0.5">
                Vertrauliche Meldung an die Projekt-/Teamleitung
              </p>
            </div>
          </div>

          {/* Team-Info Pill */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] mt-2"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Lock className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[12px] text-white/60">
              Eingeloggt als{' '}
              <span className="text-white/85 font-medium">
                {user?.globalName || user?.username}
              </span>
              {user?.adminRole || user?.teamRole ? (
                <span className="text-white/40"> · {user.adminRole || user.teamRole}</span>
              ) : null}
            </span>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <div
            className="mb-6 p-4 rounded-2xl border border-emerald-500/20 flex items-start gap-3"
            style={{
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
            }}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-emerald-200 font-medium">Beschwerde erfolgreich übermittelt</p>
              <p className="text-emerald-200/70 mt-0.5">
                Die Leitung wurde benachrichtigt und wird sich um die Angelegenheit kümmern.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/[0.06] p-5 sm:p-7 space-y-6"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,22,0.85) 0%, rgba(14,14,16,0.92) 100%)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            boxShadow:
              '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Teamler Name */}
          <div>
            <label
              htmlFor="teamlerName"
              className="flex items-center gap-2 text-[13px] font-medium text-white/85 mb-2"
            >
              <UserIcon className="w-3.5 h-3.5 text-white/50" />
              Teamler Name
              <span className="text-red-400">*</span>
            </label>
            <input
              id="teamlerName"
              type="text"
              value={teamlerName}
              onChange={(e) => setTeamlerName(e.target.value)}
              maxLength={80}
              placeholder="Discord-/RP-Name des betroffenen Teamlers"
              className={inputClass}
              required
            />
            <p className="text-[11px] text-white/35 mt-1.5">
              {teamlerName.length}/80 Zeichen
            </p>
          </div>

          {/* Grund */}
          <div>
            <label
              htmlFor="grund"
              className="flex items-center gap-2 text-[13px] font-medium text-white/85 mb-2"
            >
              Warum möchtest du eine Beschwerde einreichen?
              <span className="text-red-400">*</span>
            </label>
            <textarea
              id="grund"
              value={grund}
              onChange={(e) => setGrund(e.target.value)}
              maxLength={1500}
              rows={4}
              placeholder="Erkläre kurz, warum du diese Beschwerde einreichst …"
              className={inputClass}
              required
            />
            <p className="text-[11px] text-white/35 mt-1.5">
              {grund.length}/1500 Zeichen
            </p>
          </div>

          {/* Vorfall */}
          <div>
            <label
              htmlFor="vorfall"
              className="flex items-center gap-2 text-[13px] font-medium text-white/85 mb-2"
            >
              Was hat der Teamler getan?
              <span className="text-red-400">*</span>
            </label>
            <textarea
              id="vorfall"
              value={vorfall}
              onChange={(e) => setVorfall(e.target.value)}
              maxLength={1500}
              rows={6}
              placeholder="Beschreibe den Vorfall so genau wie möglich (Datum, Uhrzeit, Zeugen, Screenshots ggf. separat einreichen) …"
              className={inputClass}
              required
            />
            <p className="text-[11px] text-white/35 mt-1.5">
              {vorfall.length}/1500 Zeichen
            </p>
          </div>

          {/* Warning Box */}
          <label
            htmlFor="bestaetigt"
            className="block cursor-pointer rounded-2xl border border-amber-500/25 p-4 transition-all hover:border-amber-500/40"
            style={{
              background:
                'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  id="bestaetigt"
                  type="checkbox"
                  checked={bestaetigt}
                  onChange={(e) => setBestaetigt(e.target.checked)}
                  className="w-5 h-5 rounded-md border-white/20 bg-white/[0.05] text-amber-500 focus:ring-2 focus:ring-amber-500/40 cursor-pointer accent-amber-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-amber-200">
                    Wichtiger Hinweis
                  </span>
                </div>
                <p className="text-[12.5px] text-amber-100/80 leading-relaxed">
                  Mir ist bewusst, dass eine{' '}
                  <span className="font-semibold text-amber-200">
                    falsche oder unbegründete Beschwerde
                  </span>{' '}
                  gegen einen Teamler eine{' '}
                  <span className="font-semibold text-amber-200">
                    Team-Verwarnung gegen mich
                  </span>{' '}
                  zur Folge haben kann. Ich versichere, dass meine Angaben
                  wahrheitsgemäß sind.
                </p>
              </div>
            </div>
          </label>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
            <p className="text-[11.5px] text-white/40">
              Deine Identität wird zusammen mit der Beschwerde übermittelt und
              vertraulich behandelt.
            </p>
            <button
              type="submit"
              disabled={submitting || !bestaetigt}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background:
                  submitting || !bestaetigt
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
                color: '#fff',
                border:
                  submitting || !bestaetigt
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(255,255,255,0.12)',
                boxShadow:
                  submitting || !bestaetigt
                    ? 'none'
                    : '0 8px 24px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird übermittelt …
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Beschwerde einreichen
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <p className="text-center text-[11px] text-white/30 mt-6">
          🛡️ Diese Seite ist ausschließlich für Team-Mitglieder zugänglich · HHRP Team-Beschwerde-System
        </p>
      </div>
    </div>
  );
}
