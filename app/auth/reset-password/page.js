'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/supabase/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      setSent(true);
      toast.success('Reset-Mail verschickt (falls Konto existiert)');
    } catch (err) {
      toast.error(err.message || 'Etwas ist schiefgelaufen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080808]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        <div
          className="glass rounded-2xl p-8 border border-white/10"
          style={{ background: 'rgba(8, 8, 8, 0.85)', backdropFilter: 'blur(20px)' }}
        >
          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(var(--theme-accent-rgb), 0.1)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
                  }}
                >
                  <Mail className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Passwort zurücksetzen</h1>
                  <p className="text-xs text-white/40">Wir senden dir eine E-Mail mit Link</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="deine@discord-email.de"
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--theme-accent)', color: '#000' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    'Reset-Link senden'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '2px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">E-Mail verschickt</h2>
              <p className="text-sm text-white/60 mb-1">
                Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Reset-Link
                gesendet.
              </p>
              <p className="text-xs text-white/40">
                Bitte prüfe auch deinen Spam-Ordner.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
