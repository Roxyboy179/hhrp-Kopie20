'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase übergibt access_token im Hash-Fragment: #access_token=...&type=recovery
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    if (!hash || hash.length < 2) {
      setTokenError('Kein gültiger Reset-Link. Bitte fordere einen neuen an.');
      return;
    }
    const params = new URLSearchParams(hash.substring(1));
    const at = params.get('access_token');
    const type = params.get('type');
    const errorDesc = params.get('error_description') || params.get('error');
    if (errorDesc) {
      setTokenError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      return;
    }
    if (!at || (type && type !== 'recovery' && type !== 'magiclink')) {
      setTokenError('Kein gültiger Reset-Link. Bitte fordere einen neuen an.');
      return;
    }
    setAccessToken(at);
  }, []);

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
    setLoading(true);
    try {
      const res = await fetch('/api/auth/supabase/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      setSuccess(true);
      toast.success('Passwort aktualisiert');
      setTimeout(() => router.push('/'), 2500);
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
          {tokenError ? (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Link ungültig</h2>
              <p className="text-sm text-white/60 mb-4">{tokenError}</p>
              <Link
                href="/auth/reset-password"
                className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--theme-accent)', color: '#000' }}
              >
                Neuen Link anfordern
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '2px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Passwort aktualisiert</h2>
              <p className="text-sm text-white/60">Du wirst gleich weitergeleitet…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(var(--theme-accent-rgb), 0.1)',
                    border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
                  }}
                >
                  <KeyRound className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Neues Passwort setzen</h1>
                  <p className="text-xs text-white/40">Wähle ein sicheres Passwort (min. 8 Zeichen)</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">
                    Neues Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 pr-10 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm"
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

                <button
                  type="submit"
                  disabled={loading || !accessToken}
                  className="w-full py-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--theme-accent)', color: '#000' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Speichere…
                    </>
                  ) : (
                    'Passwort speichern'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
