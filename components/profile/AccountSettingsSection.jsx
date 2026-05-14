'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck, Mail, KeyRound, ShieldCheck, ShieldAlert, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, ArrowRight, Sparkles,
  Trash2, AlertTriangle, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { IconInput } from '@/components/ui/IconInput';
import TwoFactorSection from '@/components/profile/TwoFactorSection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AccountSettingsSection({ discordEmail }) {
  const router = useRouter();
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

  // 2FA Status (cached, wird auch von TwoFactorSection nachgeladen)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACodeForPw, setTwoFACodeForPw] = useState('');
  const [twoFACodeForDel, setTwoFACodeForDel] = useState('');

  // Account löschen
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const load2FAStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/2fa/status', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setTwoFAEnabled(!!data.enabled);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status?.hasAccount) {
      load2FAStatus();
      // Reload alle 30s, falls 2FA in TwoFactorSection geändert wurde
      const t = setInterval(load2FAStatus, 30000);
      return () => clearInterval(t);
    }
  }, [status?.hasAccount, load2FAStatus]);

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
    if (twoFAEnabled && !twoFACodeForPw) {
      toast.error('Bitte 2FA-Code eingeben');
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
          twoFactorCode: twoFAEnabled ? twoFACodeForPw.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'TWOFA_REQUIRED') {
          // 2FA wurde gerade aktiviert während dieser Seite offen war
          setTwoFAEnabled(true);
          toast.error('2FA-Code erforderlich — bitte Code eingeben');
          return;
        }
        if (data.code === 'INVALID_2FA') {
          toast.error('Ungültiger 2FA-Code');
          return;
        }
        throw new Error(data.error || 'Fehler');
      }
      toast.success('Passwort aktualisiert');
      setCurrentPw('');
      setNewPw('');
      setNewPwConfirm('');
      setTwoFACodeForPw('');
    } catch (err) {
      toast.error(err.message || 'Passwort-Änderung fehlgeschlagen');
    } finally {
      setChanging(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'LÖSCHEN') {
      toast.error('Bitte tippe "LÖSCHEN" zur Bestätigung ein');
      return;
    }
    if (twoFAEnabled && !twoFACodeForDel) {
      toast.error('Bitte 2FA-Code eingeben');
      return;
    }
    setDeleting(true);
    try {
      const fetchOpts = {
        method: 'DELETE',
        credentials: 'include',
      };
      if (twoFAEnabled) {
        fetchOpts.headers = { 'Content-Type': 'application/json' };
        fetchOpts.body = JSON.stringify({ twoFactorCode: twoFACodeForDel.trim() });
      }
      const res = await fetch('/api/auth/supabase/delete-account', fetchOpts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === 'TWOFA_REQUIRED') {
          setTwoFAEnabled(true);
          toast.error('2FA-Code erforderlich');
          return;
        }
        if (data.code === 'INVALID_2FA') {
          toast.error('Ungültiger 2FA-Code');
          return;
        }
        throw new Error(data.error || 'Konto-Löschung fehlgeschlagen');
      }
      toast.success('Dein Login-Konto wurde gelöscht.');
      setDeleteOpen(false);
      setDeleteConfirmText('');
      setTwoFACodeForDel('');
      // Status neu laden, damit die "Konto erstellen" CTA wieder erscheint
      setLoading(true);
      await loadStatus();
      // Zurück zum Profil leiten
      try {
        router.refresh();
      } catch {
        /* noop */
      }
    } catch (err) {
      toast.error(err.message || 'Konto-Löschung fehlgeschlagen');
    } finally {
      setDeleting(false);
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
            <IconInput
              type={showChangePw ? 'text' : 'password'}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              icon={KeyRound}
              rightAction={{
                onClick: () => setShowChangePw((v) => !v),
                icon: showChangePw ? EyeOff : Eye,
                label: showChangePw ? 'Passwort verbergen' : 'Passwort anzeigen',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Neues Passwort</label>
            <IconInput
              type={showChangePw ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
              placeholder="Mindestens 8 Zeichen"
              icon={KeyRound}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Neues Passwort wiederholen
            </label>
            <IconInput
              type={showChangePw ? 'text' : 'password'}
              value={newPwConfirm}
              onChange={(e) => setNewPwConfirm(e.target.value)}
              required
              minLength={8}
              icon={KeyRound}
            />
          </div>

          {twoFAEnabled && (
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                2FA-Code (aus Authenticator-App oder Backup-Code)
              </label>
              <input
                type="text"
                value={twoFACodeForPw}
                onChange={(e) => setTwoFACodeForPw(e.target.value)}
                placeholder="123456 oder XXXX-XXXX"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm font-mono tracking-wider"
                autoComplete="one-time-code"
                required
              />
            </div>
          )}

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

      {/* 2FA Section */}
      <TwoFactorSection accountEmail={status?.email || discordEmail} />

      {/* Danger Zone — Konto löschen */}
      <div
        className="glass rounded-2xl p-6 border"
        style={{
          background: 'rgba(239, 68, 68, 0.04)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gefahrenbereich</h2>
            <p className="text-xs text-white/40">Unwiderrufliche Aktionen</p>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-sm text-white/80 font-medium mb-1.5">Login-Konto löschen</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Dein Email/Passwort-Login wird vollständig entfernt. Dein Discord-Account und deine
            Spielerdaten (Lizenzen, Geld, Bewerbungen etc.) bleiben unverändert bestehen — du
            kannst dich danach weiterhin über Discord anmelden.
            <br />
            <span className="text-red-300/80">Diese Aktion kann nicht rückgängig gemacht werden.</span>
          </p>
        </div>

        <AlertDialog
          open={deleteOpen}
          onOpenChange={(o) => {
            setDeleteOpen(o);
            if (!o) setDeleteConfirmText('');
          }}
        >
          <AlertDialogTrigger asChild>
            <button
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
              }}
            >
              <Trash2 className="w-4 h-4" />
              Konto endgültig löschen
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="border-white/10"
            style={{
              background: 'rgba(12, 12, 12, 0.98)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Login-Konto wirklich löschen?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/60 text-sm space-y-2">
                <span className="block">
                  Du bist im Begriff, dein Login-Konto für{' '}
                  <span className="text-white font-medium">{status.email}</span> dauerhaft zu
                  löschen.
                </span>
                <span className="block">
                  Du kannst dich anschließend nur noch via{' '}
                  <span className="text-white">Discord</span> anmelden. Deine Spielerdaten bleiben
                  erhalten.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 my-2">
              <label className="block text-xs font-medium text-white/60">
                Tippe <span className="text-red-300 font-bold">LÖSCHEN</span> ein, um zu bestätigen:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="LÖSCHEN"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500/40 text-sm font-mono tracking-wider"
                autoComplete="off"
                disabled={deleting}
              />

              {twoFAEnabled && (
                <>
                  <label className="block text-xs font-medium text-white/60 pt-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                    2FA-Code (oder Backup-Code)
                  </label>
                  <input
                    type="text"
                    value={twoFACodeForDel}
                    onChange={(e) => setTwoFACodeForDel(e.target.value)}
                    placeholder="123456 oder XXXX-XXXX"
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 text-sm font-mono tracking-wider"
                    autoComplete="one-time-code"
                    disabled={deleting}
                  />
                </>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleting}
                className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] hover:text-white"
              >
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteAccount();
                }}
                disabled={deleting || deleteConfirmText.trim().toUpperCase() !== 'LÖSCHEN'}
                className="bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Lösche…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Endgültig löschen
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
